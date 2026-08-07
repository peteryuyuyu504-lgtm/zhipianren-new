import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendDailyLoveLetter, sendWelcomeEmail } from "@/lib/email";

function secretsMatch(provided: string | null, expected: string) {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(`Bearer ${expected}`);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const enabled =
    process.env.ENABLE_TEST_EMAIL_ENDPOINT?.trim().toLowerCase() === "true";
  const secret = process.env.TEST_EMAIL_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization");

  if (
    process.env.NODE_ENV === "production" ||
    !enabled ||
    !secret ||
    !secretsMatch(authorization, secret)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipient = process.env.TEST_EMAIL_TO?.trim();
  const recipientName = process.env.TEST_EMAIL_NAME?.trim() || "测试用户";
  if (!recipient) {
    return NextResponse.json(
      { error: "TEST_EMAIL_TO is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      type?: unknown;
    };
    const type = body.type === "daily" ? "daily" : "welcome";
    const result =
      type === "daily"
        ? await sendDailyLoveLetter(recipient, recipientName)
        : await sendWelcomeEmail(recipient, recipientName);

    return NextResponse.json({
      success: true,
      type,
      message: "测试邮件已提交，请检查收件箱和垃圾邮件文件夹。",
      emailId: result?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Local test email failed:",
      error instanceof Error ? error.message : "Unknown email error",
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "测试邮件发送失败",
      },
      { status: 500 },
    );
  }
}
