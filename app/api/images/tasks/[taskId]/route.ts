import { NextResponse } from "next/server";
import { getImageTask } from "@/lib/apimart-images";

const TASK_ID_PATTERN = /^task_[A-Za-z0-9_-]{8,128}$/;

export async function GET(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await context.params;
  if (!TASK_ID_PATTERN.test(taskId)) {
    return NextResponse.json({ error: "图片任务编号无效" }, { status: 400 });
  }

  const kind = new URL(request.url).searchParams.get("kind") ?? "text-to-image";
  if (kind !== "text-to-image" && kind !== "image-to-image") {
    return NextResponse.json({ error: "图片任务类型无效" }, { status: 400 });
  }

  const apiKey =
    (kind === "image-to-image"
      ? process.env.APIMART_IMAGE_TO_IMAGE_API_KEY?.trim()
      : process.env.APIMART_TEXT_TO_IMAGE_API_KEY?.trim()) ||
    process.env.APIMART_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "图片服务尚未配置" },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json(await getImageTask(apiKey, taskId));
  } catch {
    return NextResponse.json(
      { error: "图片任务查询失败，请稍后重试" },
      { status: 503 },
    );
  }
}
