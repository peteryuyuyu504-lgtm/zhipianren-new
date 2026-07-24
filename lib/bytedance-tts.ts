const TTS_URL =
  "https://openspeech.bytedance.com/api/v3/tts/unidirectional";
const DEFAULT_RESOURCE_ID = "seed-tts-2.0";
const DEFAULT_SPEAKER = "zh_male_m191_uranus_bigtts";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

type TtsChunk = {
  code?: number;
  message?: string;
  data?: string;
};

type CharacterVoice = {
  speaker: string;
  speechRate: number;
};

const CHARACTER_SPEAKERS: Record<
  string,
  CharacterVoice & { envName: string }
> = {
  "shen-qingzhou": {
    envName: "BYTEDANCE_TTS_SPEAKER_SHEN_QINGZHOU",
    speaker: "zh_male_ruyayichen_uranus_bigtts",
    speechRate: 0,
  },
  "ji-yu": {
    envName: "BYTEDANCE_TTS_SPEAKER_JI_YU",
    speaker: "zh_male_m191_uranus_bigtts",
    speechRate: 0,
  },
  "lin-lie": {
    envName: "BYTEDANCE_TTS_SPEAKER_LIN_LIE",
    speaker: "zh_male_shaonianzixin_uranus_bigtts",
    speechRate: 0,
  },
  "gu-wenshen": {
    envName: "BYTEDANCE_TTS_SPEAKER_GU_WENSHEN",
    speaker: "zh_male_liufei_uranus_bigtts",
    speechRate: -25,
  },
};

export function getCharacterVoice(characterId: string): CharacterVoice {
  const config = CHARACTER_SPEAKERS[characterId];
  if (!config) {
    return {
      speaker: process.env.BYTEDANCE_TTS_SPEAKER?.trim() || DEFAULT_SPEAKER,
      speechRate: 0,
    };
  }
  return {
    speaker: process.env[config.envName]?.trim() || config.speaker,
    speechRate: config.speechRate,
  };
}

function parseJsonChunks(rawResponse: string) {
  const trimmed = rawResponse.trim();
  if (!trimmed) return [];

  try {
    return [JSON.parse(trimmed) as TtsChunk];
  } catch {
    // HTTP Chunked 会把多个 JSON 对象直接连接；SSE 则可能带 data: 前缀。
  }

  const chunks: TtsChunk[] = [];
  let objectStart = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        try {
          chunks.push(
            JSON.parse(trimmed.slice(objectStart, index + 1)) as TtsChunk,
          );
        } catch {
          throw new Error("ByteDance TTS returned an invalid chunk");
        }
        objectStart = -1;
      }
    }
  }

  if (depth !== 0 || chunks.length === 0) {
    throw new Error("ByteDance TTS returned an incomplete response");
  }

  return chunks;
}

export async function synthesizeSpeech(
  apiKey: string,
  text: string,
  voice: CharacterVoice,
) {
  const response = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "X-Api-Resource-Id":
        process.env.BYTEDANCE_TTS_RESOURCE_ID?.trim() || DEFAULT_RESOURCE_ID,
      "X-Api-Request-Id": crypto.randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: { uid: "paper-boyfriend-web" },
      req_params: {
        text,
        speaker: voice.speaker,
        audio_params: {
          format: "mp3",
          sample_rate: 24_000,
          speech_rate: voice.speechRate,
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
    if (
      chunk.code !== undefined &&
      chunk.code !== 0 &&
      chunk.code !== 20_000_000
    ) {
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
