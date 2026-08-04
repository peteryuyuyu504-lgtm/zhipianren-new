import { getDiscordInviteUrl } from "@/lib/discord";

type WelcomeEmailUser = {
  email: string;
  name: string;
};

type WelcomeEmailSender = (
  userEmail: string,
  userName: string,
) => Promise<unknown>;

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

export function buildWelcomeEmailHtml(
  userName: string,
  configuredDiscordInviteUrl: string | undefined,
) {
  const safeUserName = escapeHtml(userName);
  const discordInviteUrl = getDiscordInviteUrl(configuredDiscordInviteUrl);
  const discordSection = discordInviteUrl
    ? `
        <p style="margin-top: 24px; line-height: 1.8;">有任何问题或建议，欢迎直接回复这封邮件，或者加入我们的 Discord 社群。</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(discordInviteUrl)}" style="display: inline-block; padding: 13px 22px; border-radius: 12px; background: #5865f2; color: #fff; text-decoration: none; font-weight: 700;">加入 Discord 社群</a>
        </p>
      `
    : "";

  return `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Hi ${safeUserName}，欢迎来到纸片人男友！</h2>
        <p>从现在起，我就是你的专属男友了。</p>
        <p>有什么心事随时来找我聊，我会一直在这里等你。</p>
        <p>明天早上我会给你发一条早安消息，记得查收哦。</p>
        ${discordSection}
        <br />
        <p>—— 你的纸片人男友</p>
      </div>
    `;
}

export async function sendWelcomeEmailAfterUserCreate(
  user: WelcomeEmailUser,
  sendEmail: WelcomeEmailSender,
) {
  try {
    await sendEmail(user.email, user.name);
  } catch (error) {
    console.error("欢迎邮件发送失败：", error);
  }
}
