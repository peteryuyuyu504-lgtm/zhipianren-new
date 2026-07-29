import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { submitImageToImage } from "@/lib/apimart-images";
import { registerGeneratedImageTask } from "@/lib/generated-images";
import { getCurrentUserId } from "@/lib/user-session";

const MAX_PROMPT_LENGTH = 2_000;

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isSafePublicImageUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      hostname === "localhost" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    const ipVersion = isIP(hostname);
    if (ipVersion === 4 && isPrivateIpv4(hostname)) return false;
    if (ipVersion === 6) {
      const normalized = hostname.replace(/^\[|\]$/g, "");
      if (
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80:")
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: { prompt?: unknown; imageUrl?: unknown };

  try {
    body = (await request.json()) as {
      prompt?: unknown;
      imageUrl?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "请求内容不是有效的 JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

  if (!prompt || !imageUrl) {
    return NextResponse.json(
      { error: "图片描述和参考图片不能为空" },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: "图片描述过长" }, { status: 400 });
  }
  if (!isSafePublicImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: "参考图片必须使用安全的公网 HTTPS 地址" },
      { status: 400 },
    );
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });
  }

  const apiKey =
    process.env.APIMART_IMAGE_TO_IMAGE_API_KEY?.trim() ||
    process.env.APIMART_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "图片服务尚未配置" },
      { status: 503 },
    );
  }

  try {
    const task = await submitImageToImage(apiKey, prompt, imageUrl);
    try {
      await registerGeneratedImageTask({
        userId,
        taskId: task.taskId,
        kind: "image-to-image",
        prompt,
      });
    } catch (error) {
      console.error(
        "Image edit task persistence is unavailable; continuing without R2:",
        error instanceof Error ? error.message : "Unknown database error",
      );
    }

    return NextResponse.json({
      ...task,
      kind: "image-to-image",
    });
  } catch (error) {
    console.error(
      "Image edit task submission failed:",
      error instanceof Error ? error.message : "Unknown image error",
    );
    return NextResponse.json(
      { error: "图片编辑任务提交失败，请稍后重试" },
      { status: 503 },
    );
  }
}
