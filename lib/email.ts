import { Resend } from "resend";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";
import { buildWelcomeEmailHtml } from "@/lib/welcome-email";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "xiaomi/mimo-v2.5";
const DEFAULT_EMAIL_FROM = "纸片人男友 <hello@v-boyfriend.online>";

type OpenRouterEmailResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName = "朋友",
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: userEmail,
    subject: "你好呀，我是你的专属男友 💌",
    html: buildWelcomeEmailHtml(
      userName,
      process.env.DISCORD_INVITE_URL,
    ),
  });

  if (error) {
    throw new Error(`Welcome email could not be sent: ${error.message}`);
  }

  return data;
}

export async function sendPasswordResetEmail(
  userEmail: string,
  resetUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: userEmail,
    subject: "重置你的纸片人男友登录密码",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #243247;">
        <p style="font-size: 12px; letter-spacing: .12em; color: #7c8aa0;">PAPER BOYFRIEND · ACCOUNT</p>
        <h2 style="margin: 20px 0 12px;">重新打开属于你的陪伴空间</h2>
        <p style="line-height: 1.8;">我们收到了重置密码的请求。点击下面的按钮设置新密码，这个链接将在 30 分钟后失效。</p>
        <p style="margin: 28px 0;">
          <a href="${escapeHtml(resetUrl)}" style="display: inline-block; padding: 13px 22px; border-radius: 12px; background: #273e5d; color: #fff; text-decoration: none;">设置新密码</a>
        </p>
        <p style="line-height: 1.7; color: #7c8aa0; font-size: 13px;">如果不是你发起的请求，可以忽略这封邮件，你的密码不会改变。</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Password reset email could not be sent: ${error.message}`);
  }

  return data;
}

async function generateLoveLetter(userName: string) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "你是一位温柔、克制、真诚的虚拟男友。请写一段适合早晨邮件发送的中文情话，控制在80字以内，不使用露骨内容，不提及AI、模型或提示词。",
        },
        {
          role: "user",
          content: `请给${userName}写今天的早安情话。`,
        },
      ],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter love letter request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as OpenRouterEmailResponse;
  const loveLetter = body.choices?.[0]?.message?.content?.trim();
  if (!loveLetter) throw new Error("OpenRouter returned an empty love letter");

  return loveLetter;
}

export async function sendDailyLoveLetter(
  userEmail: string,
  userName = "朋友",
) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

  const loveLetter = await generateLoveLetter(userName);
  const safeUserName = escapeHtml(userName);
  const safeLoveLetter = escapeHtml(loveLetter).replace(/\r?\n/g, "<br />");
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelProductionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const appUrl =
    configuredAppUrl ||
    (vercelProductionHost ? `https://${vercelProductionHost}` : "");
  const returnLink = appUrl
    ? `<p style="color: #999; font-size: 12px;">想跟我聊天？<a href="${escapeHtml(appUrl)}">点这里回来找我</a></p>`
    : "";

  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: userEmail,
    subject: `早安 ${userName}，今天也想你了`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <p>${safeUserName}，${safeLoveLetter}</p>
        <br />
        <p>—— 你的纸片人男友</p>
        ${returnLink}
      </div>
    `,
  });

  if (error) {
    throw new Error(`Daily love letter could not be sent: ${error.message}`);
  }

  return data;
}

export async function sendDailyLoveLetterToAll() {
  const recipients = await getDb()
    .select({
      id: users.id,
      email: users.email,
      userName: users.username,
    })
    .from(users);

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const userName =
      recipient.userName?.trim() ||
      recipient.email.split("@")[0] ||
      "朋友";

    try {
      await sendDailyLoveLetter(recipient.email, userName);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Daily love letter failed for user ${recipient.id}:`,
        error instanceof Error ? error.message : "Unknown email error",
      );
    }
  }

  return {
    total: recipients.length,
    sent,
    failed,
  };
}
