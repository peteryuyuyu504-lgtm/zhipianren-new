const DEFAULT_MODERATION_MODEL = "evolink-moderation-1.0";
const DEFAULT_TIMEOUT_MS = 8_000;
const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);

type ModerationResponse = {
  results?: Array<{
    flagged?: boolean;
  }>;
};

type ModerationErrorResponse = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
  message?: unknown;
};

export class ModerationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModerationServiceError";
  }
}

function getModerationUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/moderations`;
}

export function isModerationEnabled() {
  const value = process.env.MODERATION_ENABLED?.trim().toLowerCase();
  return value ? ENABLED_VALUES.has(value) : false;
}

export async function moderateText(text: string) {
  // Paid moderation is opt-in so development and preview testing never spend
  // credits unless MODERATION_ENABLED=true is configured explicitly.
  if (!isModerationEnabled()) {
    return { flagged: false };
  }

  const apiKey = process.env.MODERATION_API_KEY?.trim();
  const baseUrl = process.env.MODERATION_BASE_URL?.trim();
  const model =
    process.env.MODERATION_MODEL?.trim() || DEFAULT_MODERATION_MODEL;

  if (!apiKey || !baseUrl) {
    throw new ModerationServiceError("Moderation service is not configured");
  }

  let response: Response;

  try {
    response = await fetch(getModerationUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [{ type: "text", text }],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" || /timeout/i.test(error.message));
    throw new ModerationServiceError(
      isTimeout
        ? "Moderation request timed out"
        : "Moderation request could not be completed",
    );
  }

  if (!response.ok) {
    let detail = "";

    try {
      const errorData = (await response.json()) as ModerationErrorResponse;
      const code =
        typeof errorData.error?.code === "string" ? errorData.error.code : "";
      const message =
        typeof errorData.error?.message === "string"
          ? errorData.error.message
          : typeof errorData.message === "string"
            ? errorData.message
            : "";
      detail = [code, message]
        .filter(Boolean)
        .join(": ")
        .replace(/[\r\n]+/g, " ")
        .slice(0, 240);
    } catch {
      // Some gateways return an HTML or empty error response.
    }

    throw new ModerationServiceError(
      `Moderation request failed with status ${response.status}${
        detail ? `: ${detail}` : ""
      }`,
    );
  }

  let data: ModerationResponse;

  try {
    data = (await response.json()) as ModerationResponse;
  } catch {
    throw new ModerationServiceError("Moderation returned invalid JSON");
  }

  const result = data.results?.[0];
  if (typeof result?.flagged !== "boolean") {
    throw new ModerationServiceError(
      "Moderation response did not contain a valid result",
    );
  }

  return { flagged: result.flagged };
}
