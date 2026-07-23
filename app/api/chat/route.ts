import { NextResponse } from "next/server";
import { getCharacter } from "@/data/characters";
import type { ChatHistoryItem, ChatRequest, ChatResponse } from "@/lib/chat-types";
import { getMockBoundaryReply } from "@/lib/chat-policy";
import { requestOpenRouterReply } from "@/lib/openrouter";

const MAX_HISTORY_ITEMS = 12;
const MAX_MESSAGE_LENGTH = 2_000;

function isHistoryItem(value: unknown): value is ChatHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ChatHistoryItem>;
  return (
    (item.sender === "user" || item.sender === "character") &&
    typeof item.text === "string" &&
    (item.type === "text" || item.type === "voice-placeholder")
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

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "消息内容过长" }, { status: 400 });
  }

  if (!character) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 });
  }

  if (!Array.isArray(body.history) || !body.history.every(isHistoryItem)) {
    return NextResponse.json({ error: "历史消息格式不正确" }, { status: 400 });
  }

  const history = body.history.slice(-MAX_HISTORY_ITEMS);
  const boundaryReply = getMockBoundaryReply(message);
  const characterReplyCount = history.filter((item) => item.sender === "character").length;
  const reply = character.replies[characterReplyCount % character.replies.length];
  const wantsVoice = /语音|声音|说给我听|读给我听/i.test(message);
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (boundaryReply) {
    const response: ChatResponse = {
      reply: boundaryReply.reply,
      mode: "mock",
    };
    return NextResponse.json(response);
  }

  if (!apiKey) {
    const response: ChatResponse = {
      reply: wantsVoice ? `[VOICE]${reply}` : reply,
      mode: "mock",
    };
    return NextResponse.json(response);
  }

  try {
    const liveReply = await requestOpenRouterReply({
      apiKey,
      character,
      history,
      message,
    });
    const response: ChatResponse = {
      reply: wantsVoice ? `[VOICE]${liveReply}` : liveReply,
      mode: "live",
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "模型服务暂时不可用，请稍后重试" },
      { status: 503 },
    );
  }
}
