import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmailButton } from "./copy-email-button";

const SUPPORT_EMAIL = "feedback@v-boyfriend.online";

export const metadata: Metadata = {
  title: "联系我们 · 纸片人男友",
  description: "联系纸片人男友客服，反馈问题或分享产品建议。",
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.25 2" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="contact-motion-orbs" aria-hidden="true">
        <i />
        <i />
      </div>

      <section className="contact-card" aria-labelledby="contact-title">
        <div className="contact-icon" aria-hidden="true">
          <MailIcon />
        </div>

        <p className="contact-eyebrow">纸片人男友 · SUPPORT</p>
        <h1 id="contact-title">联系我们</h1>
        <p className="contact-description">
          账号、计费、隐私、安全问题或产品建议，都可以通过这里联系我们。
        </p>

        <div className="contact-divider" />

        <p className="contact-label">客服邮箱</p>
        <a
          className="contact-email-link"
          href={`mailto:${SUPPORT_EMAIL}`}
        >
          <span className="contact-email-icon" aria-hidden="true">
            <MailIcon />
          </span>
          <span className="contact-email-copy">
            <strong>{SUPPORT_EMAIL}</strong>
            <span>点击发送邮件</span>
          </span>
          <span className="contact-arrow" aria-hidden="true">→</span>
        </a>

        <CopyEmailButton email={SUPPORT_EMAIL} />

        <div className="contact-response-time">
          <span className="contact-clock-icon" aria-hidden="true">
            <ClockIcon />
          </span>
          <span>我们会尽量在 3 个工作日内回复</span>
        </div>

        <div className="contact-divider contact-divider-bottom" />

        <Link className="contact-back-link" href="/login">
          <span aria-hidden="true">←</span>
          <span>返回首页</span>
        </Link>
      </section>
    </main>
  );
}
