"use client";

import { usePathname } from "next/navigation";
import { getDiscordInviteUrl } from "@/lib/discord";

function isAdminPath(pathname: string | null) {
  return pathname === "/admin" || pathname?.startsWith("/admin/") === true;
}

export function SiteFooterContent({
  configuredDiscordInviteUrl,
}: {
  configuredDiscordInviteUrl?: string;
}) {
  const discordInviteUrl = getDiscordInviteUrl(configuredDiscordInviteUrl);
  return (
    <footer className="site-footer" aria-label="网站信息">
      <p className="site-footer-copy">
        <span>纸片人男友 · ONLINE</span>
        <small>有问题，随时来找我们。</small>
      </p>

      {discordInviteUrl ? (
        <nav className="site-footer-links" aria-label="社群入口">
          <a
            className="site-footer-link site-footer-discord-link"
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>加入 Discord 社群</span>
            <small aria-hidden="true">↗</small>
          </a>
        </nav>
      ) : null}
    </footer>
  );
}

export function SiteFooter({
  configuredDiscordInviteUrl,
}: {
  configuredDiscordInviteUrl?: string;
}) {
  const pathname = usePathname();

  if (isAdminPath(pathname)) return null;

  return (
    <SiteFooterContent
      configuredDiscordInviteUrl={configuredDiscordInviteUrl}
    />
  );
}
