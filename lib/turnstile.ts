const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) throw new Error("TURNSTILE_SECRET_KEY is not configured");
  if (!token || token.length > 2_048) return false;

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`Turnstile returned HTTP ${response.status}`);
  }

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}
