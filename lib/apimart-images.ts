const APIMART_BASE_URL = "https://api.apimart.ai";
const DEFAULT_TEXT_TO_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_IMAGE_TO_IMAGE_MODEL = "grok-imagine-1.5-edit-apimart";
const REQUEST_TIMEOUT_MS = 60_000;

type SubmitImageResponse = {
  code?: number;
  data?: Array<{
    status?: string;
    task_id?: string;
  }>;
};

type UploadImageResponse = {
  url?: string;
  filename?: string;
};

const globalForApimart = globalThis as typeof globalThis & {
  apimartReferenceImageCache?: Map<string, string>;
};
const referenceImageCache =
  globalForApimart.apimartReferenceImageCache ?? new Map<string, string>();
globalForApimart.apimartReferenceImageCache = referenceImageCache;

export type ImageTaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

type ImageTaskResponse = {
  code?: number;
  data?: {
    id?: string;
    status?: ImageTaskStatus;
    progress?: number;
    result?: {
      images?: Array<{
        url?: string[];
        expires_at?: number;
      }>;
    };
  };
};

async function requestApimart(
  apiKey: string,
  path: string,
  init?: RequestInit,
) {
  let response: Response;

  try {
    response = await fetch(`${APIMART_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`APIMart ${path} network request failed: ${detail}`);
  }

  if (!response.ok) {
    throw new Error(`APIMart ${path} request failed with status ${response.status}`);
  }

  return response;
}

export async function submitTextToImage(apiKey: string, prompt: string) {
  const response = await requestApimart(apiKey, "/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:
        process.env.APIMART_TEXT_TO_IMAGE_MODEL?.trim() ||
        DEFAULT_TEXT_TO_IMAGE_MODEL,
      prompt,
      n: 1,
      size: "16:9",
      resolution: "2k",
    }),
  });
  const data = (await response.json()) as SubmitImageResponse;
  const taskId = data.data?.[0]?.task_id?.trim();

  if (data.code !== 200 || !taskId) {
    throw new Error("APIMart did not return an image task ID");
  }

  return { taskId, status: "submitted" as const };
}

export async function submitImageToImage(
  apiKey: string,
  prompt: string,
  imageUrl: string,
) {
  const response = await requestApimart(apiKey, "/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:
        process.env.APIMART_IMAGE_TO_IMAGE_MODEL?.trim() ||
        DEFAULT_IMAGE_TO_IMAGE_MODEL,
      prompt,
      image: [imageUrl],
      size: "1:1",
      n: 1,
    }),
  });
  const data = (await response.json()) as SubmitImageResponse;
  const taskId = data.data?.[0]?.task_id?.trim();

  if (data.code !== 200 || !taskId) {
    throw new Error("APIMart did not return an image task ID");
  }

  return { taskId, status: "submitted" as const };
}

async function uploadCharacterReference(
  apiKey: string,
  character: Character,
) {
  const cachedUrl = referenceImageCache.get(character.id);
  if (cachedUrl) return cachedUrl;

  const publicRoot = path.resolve(process.cwd(), "public");
  const imagePath = path.resolve(
    publicRoot,
    character.image.replace(/^[/\\]+/, ""),
  );
  if (!imagePath.startsWith(`${publicRoot}${path.sep}`)) {
    throw new Error("Character image path is invalid");
  }

  const image = await readFile(imagePath);
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(image)], { type: "image/png" }),
    path.basename(imagePath),
  );

  let response: Response;
  try {
    response = await requestApimart(apiKey, "/v1/uploads/images", {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown upload error";
    throw new Error(`Character reference upload failed: ${detail}`);
  }
  const data = (await response.json()) as UploadImageResponse;
  const url = data.url?.trim();
  if (!url) throw new Error("APIMart did not return an uploaded image URL");

  referenceImageCache.set(character.id, url);
  return url;
}

export async function submitCharacterSceneImage(
  apiKey: string,
  character: Character,
  prompt: string,
) {
  const referenceUrl = await uploadCharacterReference(apiKey, character);
  try {
    return await submitImageToImage(apiKey, prompt, referenceUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown submission error";
    throw new Error(`Character image task submission failed: ${detail}`);
  }
}

export async function getImageTask(apiKey: string, taskId: string) {
  const response = await requestApimart(
    apiKey,
    `/v1/tasks/${encodeURIComponent(taskId)}?language=zh`,
  );
  const body = (await response.json()) as ImageTaskResponse;
  const task = body.data;

  if (body.code !== 200 || !task?.id || !task.status) {
    throw new Error("APIMart returned an invalid task response");
  }

  const images =
    task.result?.images?.flatMap((image) =>
      (image.url ?? []).map((url) => ({
        url,
        expiresAt: image.expires_at ?? null,
      })),
    ) ?? [];

  return {
    taskId: task.id,
    status: task.status,
    progress: Math.min(100, Math.max(0, task.progress ?? 0)),
    images: task.status === "completed" ? images : [],
  };
}
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Character } from "@/data/characters";
