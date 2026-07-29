import { NextRequest, NextResponse } from "next/server";
import { sendDailyLoveLetterToAll } from "@/lib/email";

export async function GET(request: NextRequest) {
  // 第一步：验证请求是否合法
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "定时任务密钥尚未配置" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  // 第二步：执行任务——给所有用户发情话邮件
  try {
    const result = await sendDailyLoveLetterToAll();
    return NextResponse.json({
      success: true,
      message: "每日情话发送完成",
      result,
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "每日情话发送失败：",
      error instanceof Error ? error.message : "Unknown daily email error",
    );
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
