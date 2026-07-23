import { NextResponse } from "next/server";
import { submitTextToImage } from "@/lib/apimart-images";

const MAX_PROMPT_LENGTH = 2_000;

export async function POST(request: Request) {
  let body: { prompt?: unknown };

  try {
    body = (await request.json()) as { prompt?: unknown };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "图片描述不能为空" }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: "图片描述过长" }, { status: 400 });
  }

  const apiKey = process.env.APIMART_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "图片服务尚未配置" },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json(await submitTextToImage(apiKey, prompt));
  } catch {
    return NextResponse.json(
      { error: "图片任务提交失败，请稍后重试" },
      { status: 503 },
    );
  }
}
