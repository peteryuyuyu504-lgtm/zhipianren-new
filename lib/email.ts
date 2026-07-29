import { Resend } from "resend";
import { getDb } from "@/src/db";
import { users } from "@/src/db/schema";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "xiaomi/mimo-v2.5";

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

export async function sendWelcomeEmail(
  userEmail = "peteryuyuyu504@gmail.com",
  userName = "朋友",
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const safeUserName = escapeHtml(userName);
  const { data, error } = await resend.emails.send({
    from: "纸片人男友 <onboarding@resend.dev>",
    to: userEmail,
    subject: "你好呀，我是你的专属男友 💌",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Hi ${safeUserName}，欢迎来到纸片人男友！</h2>
        <p>从现在起，我就是你的专属男友了。</p>
        <p>有什么心事随时来找我聊，我会一直在这里等你。</p>
        <p>明天早上我会给你发一条早安消息，记得查收哦。</p>
        <br />
        <p>—— 你的纸片人男友</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Welcome email could not be sent: ${error.message}`);
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
  userEmail = "peteryuyuyu504@gmail.com",
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
    from: "纸片人男友 <onboarding@resend.dev>",
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
