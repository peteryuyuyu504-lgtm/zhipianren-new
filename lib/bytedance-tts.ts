const TTS_URL =
  "https://openspeech.bytedance.com/api/v3/tts/unidirectional";
const DEFAULT_RESOURCE_ID = "seed-tts-2.0";
const DEFAULT_SPEAKER = "zh_female_vv_uranus_bigtts";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

type TtsChunk = {
  code?: number;
  message?: string;
  data?: string;
};

function parseJsonChunks(rawResponse: string) {
  const trimmed = rawResponse.trim();
  if (!trimmed) return [];

  try {
    return [JSON.parse(trimmed) as TtsChunk];
  } catch {
    // HTTP Chunked 通常以换行分隔 JSON；同时兼容 SSE 的 data: 前缀。
  }

  const chunks: TtsChunk[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const normalized = line.replace(/^data:\s*/, "").trim();
    if (!normalized || normalized === "[DONE]") continue;

    try {
      chunks.push(JSON.parse(normalized) as TtsChunk);
    } catch {
      throw new Error("ByteDance TTS returned an invalid chunk");
    }
  }
  return chunks;
}

export async function synthesizeSpeech(apiKey: string, text: string) {
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "X-Api-Resource-Id":
        process.env.BYTEDANCE_TTS_RESOURCE_ID?.trim() || DEFAULT_RESOURCE_ID,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
    body: JSON.stringify({
      req_params: {
        text,
        speaker:
          process.env.BYTEDANCE_TTS_SPEAKER?.trim() || DEFAULT_SPEAKER,
        audio_params: {
          format: "mp3",
          sample_rate: 24_000,
        },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`ByteDance TTS request failed with status ${response.status}`);
  }

  const chunks = parseJsonChunks(await response.text());
  const audioParts: Buffer[] = [];
  let totalBytes = 0;

  for (const chunk of chunks) {
    if (chunk.code !== undefined && chunk.code !== 0) {
      throw new Error("ByteDance TTS returned an unsuccessful chunk");
    }
    if (!chunk.data) continue;

    const audio = Buffer.from(chunk.data, "base64");
    totalBytes += audio.byteLength;
    if (totalBytes > MAX_AUDIO_BYTES) {
      throw new Error("ByteDance TTS audio exceeded the size limit");
    }
    audioParts.push(audio);
  }

  if (audioParts.length === 0) {
    throw new Error("ByteDance TTS returned no audio");
  }

  return Buffer.concat(audioParts);
}
