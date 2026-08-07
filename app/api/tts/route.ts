import { NextResponse } from "next/server";
import { getCharacter } from "@/data/characters";
import {
  getCharacterVoice,
  synthesizeSpeech,
} from "@/lib/bytedance-tts";
import { consumeDailyTtsQuota } from "@/lib/tts-quota";
import { getCurrentUserId } from "@/lib/user-session";
import { prepareTextForSpeech } from "@/lib/voice-text";

const MAX_TTS_TEXT_LENGTH = 500;

function getDatabaseErrorCode(error: unknown) {
  let current: unknown = error;

  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object") {
      return "UNKNOWN";
    }

    if (
      "code" in current &&
      typeof (current as { code?: unknown }).code === "string"
    ) {
      return (current as { code: string }).code;
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return "UNKNOWN";
}

export async function POST(request: Request) {
  let body: { text?: unknown; characterId?: unknown };

  try {
    body = (await request.json()) as {
      text?: unknown;
      characterId?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const characterId =
    typeof body.characterId === "string" ? body.characterId.trim() : "";
  const character = getCharacter(characterId);
  if (!text) {
    return NextResponse.json({ error: "语音文本不能为空" }, { status: 400 });
  }
  if (!character) {
    return NextResponse.json({ error: "语音角色无效" }, { status: 400 });
  }
  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return NextResponse.json({ error: "语音文本过长" }, { status: 400 });
  }
  const preparedSpeech = prepareTextForSpeech(text);
  if (!preparedSpeech.text) {
    return NextResponse.json({ error: "语音文本没有可朗读内容" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "登录状态已失效，请重新登录。" },
      { status: 401 },
    );
  }

  const apiKey = process.env.BYTEDANCE_TTS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "语音服务尚未配置" },
      { status: 503 },
    );
  }

  let quota: Awaited<ReturnType<typeof consumeDailyTtsQuota>>;
  try {
    quota = await consumeDailyTtsQuota(userId);
  } catch (error) {
    console.error("[TTS] Daily quota request failed:", {
      code: getDatabaseErrorCode(error),
      message:
        error instanceof Error ? error.message : "Unknown database error",
    });
    return NextResponse.json(
      { error: "语音服务暂时不可用，请稍后重试。" },
      { status: 503 },
    );
  }

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "今日语音生成次数已用完，请明天再试。" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(quota.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const audio = await synthesizeSpeech(
      apiKey,
      preparedSpeech.text,
      getCharacterVoice(character.id),
      preparedSpeech.performanceInstruction,
    );
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, private",
        "Content-Length": String(audio.byteLength),
        "X-RateLimit-Limit": String(quota.limit),
        "X-RateLimit-Remaining": String(
          Math.max(0, quota.limit - quota.used),
        ),
      },
    });
  } catch (error) {
    console.error(
      "[TTS] Speech synthesis failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "语音生成失败，请稍后重试" },
      { status: 503 },
    );
  }
}
