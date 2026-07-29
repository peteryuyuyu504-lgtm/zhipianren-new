import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminSessionCookie, isConfiguredAdmin } from "@/lib/admin-auth";
import { sendWelcomeEmail } from "@/lib/email";
import { createUserSessionValue, userSessionCookie } from "@/lib/user-session";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    turnstileToken?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const turnstileToken =
    typeof body?.turnstileToken === "string" ? body.turnstileToken : "";
  const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!email || email.length > 255) {
    return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  }
  if (!turnstileSecretKey) {
    return NextResponse.json(
      { error: "人机验证服务尚未配置，请联系网站管理员。" },
      { status: 503 },
    );
  }

  if (!turnstileToken || turnstileToken.length > 2048) {
    return NextResponse.json(
      { error: "请先完成人机验证。" },
      { status: 403 },
    );
  }

  let turnstileVerified = false;
  try {
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecretKey,
          response: turnstileToken,
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!verifyResponse.ok) {
      throw new Error(`Turnstile returned HTTP ${verifyResponse.status}`);
    }

    const verifyResult = (await verifyResponse.json()) as {
      success?: boolean;
    };
    turnstileVerified = verifyResult.success === true;
  } catch (error) {
    console.error(
      "Turnstile verification request failed:",
      error instanceof Error ? error.message : "Unknown Turnstile error",
    );
    return NextResponse.json(
      { error: "人机验证服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }

  if (!turnstileVerified) {
    return NextResponse.json(
      { error: "人机验证失败，请重新验证。" },
      { status: 403 },
    );
  }

  let userId: number;
  let isNewUser = false;
  try {
    const db = getDb();
    const [createdUser] = await db
      .insert(users)
      .values({ email })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    if (createdUser) {
      userId = createdUser.id;
      isNewUser = true;
    } else {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!existingUser) throw new Error("User record could not be loaded");
      userId = existingUser.id;
    }
  } catch (error) {
    console.error(
      "User session database request failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return NextResponse.json(
      { error: "登录服务暂时不可用，请稍后再试" },
      { status: 503 },
    );
  }

  if (isNewUser) {
    try {
      const userName = email.split("@")[0] || "朋友";
      await sendWelcomeEmail(email, userName);
    } catch (error) {
      // 邮件服务不可用时不影响用户注册和登录。
      console.error(
        "Welcome email could not be sent:",
        error instanceof Error ? error.message : "Unknown email error",
      );
    }
  }

  const response = NextResponse.json({ isAdmin: isConfiguredAdmin(email) });
  response.cookies.set(
    userSessionCookie.name,
    createUserSessionValue(userId),
    userSessionCookie.options,
  );

  if (isConfiguredAdmin(email)) {
    // TODO: 当前项目只有 Mock 登录。接入真实认证后，必须改为服务端验证用户和角色，
    // 并使用签名会话，不能继续相信客户端提交的邮箱。
    response.cookies.set(adminSessionCookie.name, adminSessionCookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } else {
    response.cookies.delete(adminSessionCookie.name);
  }

  return response;
}
