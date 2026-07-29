import { NextResponse } from "next/server";
import { getCharacter } from "@/data/characters";
import type { ChatHistoryItem, ChatRequest, ChatResponse } from "@/lib/chat-types";
import { getMockBoundaryReply } from "@/lib/chat-policy";
import { requestOpenRouterReply } from "@/lib/openrouter";
import { submitCharacterSceneImage } from "@/lib/apimart-images";
import { moderateText } from "@/lib/moderation";
import { consumeDailyChatQuota } from "@/lib/chat-quota";
import { getCurrentUserId } from "@/lib/user-session";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/chat-limits";
import { registerGeneratedImageTask } from "@/lib/generated-images";
import {
  createCharacterScenePrompt,
  decideBalancedMedia,
  getCharacterScene,
} from "@/lib/media-policy";

const MAX_HISTORY_ITEMS = 12;

async function getModerationBlockResponse(
  text: string,
  flaggedMessage: string,
) {
  try {
    const result = await moderateText(text);
    return result.flagged
      ? NextResponse.json({ error: flaggedMessage }, { status: 422 })
      : null;
  } catch (error) {
    // Do not log the submitted text or upstream credentials.
    console.error(
      "Moderation service request failed:",
      error instanceof Error ? error.message : "Unknown moderation error",
    );
    return NextResponse.json(
      { error: "内容安全检测服务暂时不可用，请稍后再试" },
      { status: 503 },
    );
  }
}

function isHistoryItem(value: unknown): value is ChatHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ChatHistoryItem>;
  return (
    (item.sender === "user" || item.sender === "character") &&
    typeof item.text === "string" &&
    (item.type === "text" || item.type === "voice-placeholder")
  );
}

function isMediaState(value: unknown): value is ChatRequest["mediaState"] {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ChatRequest["mediaState"]>;
  return [
    state.completedRounds,
    state.dailyImageCount,
    state.dailyVoiceCount,
    state.roundsSinceImage,
    state.roundsSinceVoice,
  ].every(
    (item) =>
      typeof item === "number" &&
      Number.isInteger(item) &&
      item >= 0 &&
      item <= 10_000,
  );
}

// 当前接口保持与未来真实模型相同的请求边界，但只返回角色配置中的 Mock 回复。
export async function POST(request: Request) {
  let body: Partial<ChatRequest>;

  try {
    body = (await request.json()) as Partial<ChatRequest>;
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON" }, { status: 400 });
  }

  const characterId = typeof body.characterId === "string" ? body.characterId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const character = getCharacter(characterId);

  if (!characterId || !message) {
    return NextResponse.json({ error: "角色和消息不能为空" }, { status: 400 });
  }

  if (message.length > CHAT_MESSAGE_MAX_LENGTH) {
    return NextResponse.json(
      { error: "消息长度超过限制，请缩短后重新发送。" },
      { status: 400 },
    );
  }

  if (!character) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }
  const activeCharacter = character;

  if (!Array.isArray(body.history) || !body.history.every(isHistoryItem)) {
    return NextResponse.json({ error: "历史消息格式不正确" }, { status: 400 });
  }
  if (!isMediaState(body.mediaState)) {
    return NextResponse.json({ error: "媒体状态格式不正确" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "登录状态已失效，请重新登录。" },
      { status: 401 },
    );
  }
  const authenticatedUserId = userId;

  try {
    const quota = await consumeDailyChatQuota(userId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "今日体验次数已用完，请明天继续体验。" },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error(
      "Daily chat quota request failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return NextResponse.json(
      { error: "聊天服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }

  const inputModerationResponse = await getModerationBlockResponse(
    message,
    "检测到敏感内容，请重新输入",
  );
  if (inputModerationResponse) return inputModerationResponse;

  const history = body.history.slice(-MAX_HISTORY_ITEMS);
  const boundaryReply = getMockBoundaryReply(message);
  // `history` is intentionally capped, so counting replies from it becomes
  // constant once a conversation is longer than the cap. Use the full-session
  // round count sent by the client to keep mock/fallback replies rotating.
  const reply =
    character.replies[body.mediaState.completedRounds % character.replies.length];
  const mediaDecision = decideBalancedMedia({
    characterId,
    message,
    state: body.mediaState,
  });
  const wantsVoice = mediaDecision.voice;
  const imageScene = mediaDecision.image
    ? getCharacterScene(
        activeCharacter,
        body.mediaState.completedRounds,
        message,
      )
    : undefined;
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  async function createImageTask(companionReply: string) {
    if (!mediaDecision.image) return undefined;
    const imageApiKey =
      process.env.APIMART_IMAGE_TO_IMAGE_API_KEY?.trim() ||
      process.env.APIMART_API_KEY?.trim();
    if (!imageApiKey) return undefined;

    try {
      const imagePrompt = createCharacterScenePrompt(
        activeCharacter,
        message,
        companionReply,
        imageScene,
      );
      const task = await submitCharacterSceneImage(
        imageApiKey,
        activeCharacter,
        imagePrompt,
      );
      await registerGeneratedImageTask({
        userId: authenticatedUserId,
        taskId: task.taskId,
        kind: "image-to-image",
        prompt: imagePrompt,
      });
      return { taskId: task.taskId, kind: "image-to-image" as const };
    } catch (error) {
      console.error(
        "Character image request failed:",
        error instanceof Error ? error.message : "Unknown image error",
      );
      return undefined;
    }
  }

  if (boundaryReply) {
    const outputModerationResponse = await getModerationBlockResponse(
      boundaryReply.reply,
      "回复未通过安全审核，请换个话题再试",
    );
    if (outputModerationResponse) return outputModerationResponse;

    const response: ChatResponse = {
      reply: boundaryReply.reply,
      mode: "mock",
    };
    return NextResponse.json(response);
  }

  if (!apiKey) {
    const outputModerationResponse = await getModerationBlockResponse(
      reply,
      "回复未通过安全审核，请换个话题再试",
    );
    if (outputModerationResponse) return outputModerationResponse;

    const imageTask = await createImageTask(reply);
    const response: ChatResponse = {
      reply:
        mediaDecision.image && !imageTask
          ? "刚才那张照片没有发送成功，等一下再让我试试，好吗？"
          : wantsVoice
            ? `[VOICE]${reply}`
            : reply,
      mode: "mock",
      imageTask,
    };
    return NextResponse.json(response);
  }

  try {
    const liveReply = await requestOpenRouterReply({
      apiKey,
      character,
      history,
      message,
      imageScene,
      willSendVoice: wantsVoice,
    });
    let cleanReply = liveReply.replace(/^(?:\[VOICE\]\s*)+/i, "").trim();
    const outputModerationResponse = await getModerationBlockResponse(
      cleanReply,
      "回复未通过安全审核，请换个话题再试",
    );
    if (outputModerationResponse) return outputModerationResponse;

    const imageTask = await createImageTask(cleanReply);

    if (mediaDecision.image && imageTask) {
      const contradictsImage =
        /(不能|没法|无法|发不了|不能发|没办法).{0,8}(照片|图片|图|自拍)|系统.{0,6}(限制|不允许)/i.test(
          cleanReply,
        );
      if (contradictsImage) {
        cleanReply = `给你看看我现在的样子。我正在${imageScene}，刚好拍下这一刻发给你。`;
      }
    } else if (mediaDecision.image) {
      cleanReply = "刚才那张照片没有发送成功，等一下再让我试试，好吗？";
    }

    if (
      wantsVoice &&
      /(只能|只可以|只好).{0,8}(文字|打字)|(不能|没法|无法|发不了|不能发|没办法).{0,8}(语音|声音)|下次.{0,8}(语音|声音)|系统.{0,6}(限制|不允许)/i.test(
        cleanReply,
      )
    ) {
      cleanReply =
        "那我就直接说给你听。别着急，我在这里陪着你呢。你今天过得怎么样，有没有好好休息？";
    }

    const response: ChatResponse = {
      reply: wantsVoice ? `[VOICE]${cleanReply}` : cleanReply,
      mode: "live",
      imageTask,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "OpenRouter chat request failed:",
      error instanceof Error ? error.message : "Unknown upstream error",
    );
    // 开发期保障：真实模型因密钥、额度、模型或网络问题不可用时，
    // 使用角色已有回复降级，避免整个聊天流程中断。
    const outputModerationResponse = await getModerationBlockResponse(
      reply,
      "回复未通过安全审核，请换个话题再试",
    );
    if (outputModerationResponse) return outputModerationResponse;

    const response: ChatResponse = {
      reply: wantsVoice ? `[VOICE]${reply}` : reply,
      mode: "mock",
    };
    return NextResponse.json(response);
  }
}
