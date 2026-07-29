import { NextResponse } from "next/server";
import { sendDailyLoveLetter, sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      type?: unknown;
    };
    const type = body.type === "daily" ? "daily" : "welcome";
    const result =
      type === "daily"
        ? await sendDailyLoveLetter("peteryuyuyu504@gmail.com", "Peter")
        : await sendWelcomeEmail("peteryuyuyu504@gmail.com", "Peter");

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
