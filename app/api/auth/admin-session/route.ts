import { NextResponse } from "next/server";
import { adminSessionCookie, isConfiguredAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const response = NextResponse.json({ isAdmin: isConfiguredAdmin(email) });

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

