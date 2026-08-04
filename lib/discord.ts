const DISCORD_INVITE_HOSTS = new Set([
  "discord.gg",
  "www.discord.gg",
]);

const DISCORD_WEBSITE_HOSTS = new Set([
  "discord.com",
  "www.discord.com",
]);

export function getDiscordInviteUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    const pathSegments = url.pathname.split("/").filter(Boolean);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port
    ) {
      return undefined;
    }

    if (DISCORD_INVITE_HOSTS.has(url.hostname)) {
      return pathSegments.length > 0 ? candidate : undefined;
    }

    if (DISCORD_WEBSITE_HOSTS.has(url.hostname)) {
      return pathSegments[0] === "invite" && pathSegments.length > 1
        ? candidate
        : undefined;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
