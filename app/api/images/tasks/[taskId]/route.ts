import { NextResponse } from "next/server";
import { getImageTask } from "@/lib/apimart-images";
import {
  getGeneratedImageTask,
  persistCompletedTaskImage,
} from "@/lib/generated-images";
import { getCurrentUserId } from "@/lib/user-session";

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

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录。" }, { status: 401 });
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
    let registeredTask:
      | Awaited<ReturnType<typeof getGeneratedImageTask>>
      | undefined;
    try {
      registeredTask = await getGeneratedImageTask(userId, taskId);
    } catch (error) {
      console.error(
        "Generated image lookup is unavailable; using temporary image URL:",
        error instanceof Error ? error.message : "Unknown database error",
      );
    }
    if (registeredTask?.imageUrl) {
      return NextResponse.json({
        taskId,
        status: "completed",
        progress: 100,
        images: [{ url: registeredTask.imageUrl, expiresAt: null }],
      });
    }

    const task = await getImageTask(apiKey, taskId);
    const temporaryUrl = task.images[0]?.url;
    if (task.status === "completed" && temporaryUrl && registeredTask) {
      try {
        const permanentUrl = await persistCompletedTaskImage({
          userId,
          taskId,
          temporaryUrl,
        });
        return NextResponse.json({
          ...task,
          images: [{ url: permanentUrl, expiresAt: null }],
        });
      } catch (error) {
        console.error(
          "R2 image persistence failed; returning temporary image URL:",
          error instanceof Error ? error.message : "Unknown R2 error",
        );
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(
      "Image task query or R2 persistence failed:",
      error instanceof Error ? error.message : "Unknown image error",
    );
    return NextResponse.json(
      { error: "图片任务查询失败，请稍后重试" },
      { status: 503 },
    );
  }
}
