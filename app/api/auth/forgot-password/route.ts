import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getDb } from "@/src/db";
import { passwordResetTokens, users } from "@/src/db/schema";

const GENERIC_RESPONSE = {
  success: true,
  message: "如果该邮箱已注册，我们会发送一封密码重置邮件。",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    turnstileToken?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const turnstileToken =
    typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

  if (!email || email.length > 255 || !email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱。" }, { status: 400 });
  }

  try {
    if (!(await verifyTurnstileToken(turnstileToken))) {
      return NextResponse.json(
        { error: "人机验证失败，请重新验证。" },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error(
      "Password reset Turnstile request failed:",
      error instanceof Error ? error.message : "Unknown Turnstile error",
    );
    return NextResponse.json(
      { error: "人机验证服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }

  try {
    const db = getDb();
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) return NextResponse.json(GENERIC_RESPONSE);

    const { token, tokenHash } = createPasswordResetToken();
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1_000),
    });

    try {
      await sendPasswordResetEmail(email, token);
    } catch (error) {
      console.error(
        "Password reset email could not be sent:",
        error instanceof Error ? error.message : "Unknown email error",
      );
    }
  } catch (error) {
    console.error(
      "Password reset request failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
