import { NextResponse } from "next/server";
import { getCharacter } from "@/data/characters";
import {
  getCharacterVoice,
  synthesizeSpeech,
} from "@/lib/bytedance-tts";
import { prepareTextForSpeech } from "@/lib/voice-text";

const MAX_TTS_TEXT_LENGTH = 500;

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

  const apiKey = process.env.BYTEDANCE_TTS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "语音服务尚未配置" },
      { status: 503 },
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
