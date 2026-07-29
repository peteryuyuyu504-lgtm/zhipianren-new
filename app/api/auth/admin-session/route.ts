import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminSessionCookie, isConfiguredAdmin } from "@/lib/admin-auth";
import { sendWelcomeEmail } from "@/lib/email";
import {
  hashPassword,
  isValidPassword,
  verifyPassword,
} from "@/lib/password";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createUserSessionValue, userSessionCookie } from "@/lib/user-session";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
    turnstileToken?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const turnstileToken =
    typeof body?.turnstileToken === "string" ? body.turnstileToken : "";

  if (!email || email.length > 255 || !email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱。" }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "密码需要为 8～128 个字符。" },
      { status: 400 },
    );
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
      "Turnstile verification request failed:",
      error instanceof Error ? error.message : "Unknown Turnstile error",
    );
    return NextResponse.json(
      { error: "人机验证服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }

  let userId: number;
  let isNewUser = false;
  try {
    const db = getDb();
    const [existingUser] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      if (!existingUser.passwordHash) {
        return NextResponse.json(
          {
            error: "这个账号还没有设置密码，请点击“忘记密码”完成设置。",
            code: "PASSWORD_SETUP_REQUIRED",
          },
          { status: 403 },
        );
      }
      if (!(await verifyPassword(password, existingUser.passwordHash))) {
        return NextResponse.json(
          { error: "邮箱或密码不正确。" },
          { status: 401 },
        );
      }
      userId = existingUser.id;
    } else {
      const passwordHash = await hashPassword(password);
      const [createdUser] = await db
        .insert(users)
        .values({ email, passwordHash })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });

      if (!createdUser) {
        return NextResponse.json(
          { error: "账号创建冲突，请重新登录。" },
          { status: 409 },
        );
      }
      userId = createdUser.id;
      isNewUser = true;
    }
  } catch (error) {
    console.error(
      "User authentication database request failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return NextResponse.json(
      { error: "登录服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }

  if (isNewUser) {
    try {
      await sendWelcomeEmail(email, email.split("@")[0] || "朋友");
    } catch (error) {
      console.error(
        "Welcome email could not be sent:",
        error instanceof Error ? error.message : "Unknown email error",
      );
    }
  }

  const isAdmin = isConfiguredAdmin(email);
  const response = NextResponse.json({ isAdmin, isNewUser });
  response.cookies.set(
    userSessionCookie.name,
    createUserSessionValue(userId),
    userSessionCookie.options,
  );

  if (isAdmin) {
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
