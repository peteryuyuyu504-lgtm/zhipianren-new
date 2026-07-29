import { and, eq } from "drizzle-orm";
import { getDb } from "@/src/db";
import { generatedImages } from "@/src/db/schema";
import { uploadToR2 } from "@/lib/r2";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export type GeneratedImageKind = "text-to-image" | "image-to-image";

export async function registerGeneratedImageTask(input: {
  userId: number;
  taskId: string;
  kind: GeneratedImageKind;
  prompt: string;
}) {
  await getDb()
    .insert(generatedImages)
    .values(input)
    .onConflictDoNothing({ target: generatedImages.taskId });
}

export async function getGeneratedImageTask(
  userId: number,
  taskId: string,
) {
  const [record] = await getDb()
    .select({ imageUrl: generatedImages.imageUrl })
    .from(generatedImages)
    .where(
      and(
        eq(generatedImages.userId, userId),
        eq(generatedImages.taskId, taskId),
      ),
    )
    .limit(1);

  return record;
}

export async function persistCompletedTaskImage(input: {
  userId: number;
  taskId: string;
  temporaryUrl: string;
}) {
  const task = await getGeneratedImageTask(input.userId, input.taskId);
  if (!task) throw new Error("Generated image task is not registered");
  if (task.imageUrl) return task.imageUrl;

  const response = await fetch(input.temporaryUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`Temporary image download failed with status ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Generated image is too large");
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  if (!contentType.startsWith("image/")) {
    throw new Error("Generated image response is not an image");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Generated image is too large");
  }

  const extension =
    contentType === "image/jpeg"
      ? "jpg"
      : contentType === "image/webp"
        ? "webp"
        : "png";
  const imageUrl = await uploadToR2(
    imageBuffer,
    `images/${input.taskId}.${extension}`,
    contentType,
  );

  const [updated] = await getDb()
    .update(generatedImages)
    .set({ imageUrl })
    .where(
      and(
        eq(generatedImages.userId, input.userId),
        eq(generatedImages.taskId, input.taskId),
      ),
    )
    .returning({ imageUrl: generatedImages.imageUrl });

  if (!updated) throw new Error("Generated image task is not registered");
  return updated.imageUrl!;
}
