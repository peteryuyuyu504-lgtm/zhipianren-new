import { NextResponse } from "next/server";
import { adminSessionCookie, isConfiguredAdmin } from "@/lib/admin-auth";
import { createUserSessionValue, userSessionCookie } from "@/lib/user-session";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 255) {
    return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  }

  let userId: number;
  try {
    const db = getDb();
    const [user] = await db
      .insert(users)
      .values({ email })
      .onConflictDoUpdate({
        target: users.email,
        set: { email },
      })
      .returning({ id: users.id });
    userId = user.id;
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
