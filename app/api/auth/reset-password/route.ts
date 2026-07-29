import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  hashPassword,
  hashPasswordResetToken,
  isValidPassword,
} from "@/lib/password";
import { getDb } from "@/src/db";
import { passwordResetTokens, users } from "@/src/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    password?: unknown;
  } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || token.length > 256) {
    return NextResponse.json(
      { error: "重置链接无效或已经过期。" },
      { status: 400 },
    );
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "新密码需要为 8～128 个字符。" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const tokenHash = hashPasswordResetToken(token);
    const [resetRecord] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "重置链接无效或已经过期，请重新申请。" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await db.transaction(async (transaction) => {
      await transaction
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, resetRecord.userId));
      await transaction
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetRecord.id));
    });

    return NextResponse.json({
      success: true,
      message: "密码已更新，现在可以使用新密码登录。",
    });
  } catch (error) {
    console.error(
      "Password reset update failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return NextResponse.json(
      { error: "密码重置服务暂时不可用，请稍后再试。" },
      { status: 503 },
    );
  }
}
