import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/bytedance-tts";

const MAX_TTS_TEXT_LENGTH = 500;

export async function POST(request: Request) {
  let body: { text?: unknown };

  try {
    body = (await request.json()) as { text?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "语音文本不能为空" }, { status: 400 });
  }
  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return NextResponse.json({ error: "语音文本过长" }, { status: 400 });
  }

  const apiKey = process.env.BYTEDANCE_TTS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "语音服务尚未配置" },
      { status: 503 },
    );
  }

  try {
    const audio = await synthesizeSpeech(apiKey, text);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, private",
        "Content-Length": String(audio.byteLength),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "语音生成失败，请稍后重试" },
      { status: 503 },
    );
  }
}
