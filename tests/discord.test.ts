import assert from "node:assert/strict";
import test from "node:test";
import { getDiscordInviteUrl } from "@/lib/discord";

test("accepts supported HTTPS Discord invite URLs", () => {
  assert.equal(
    getDiscordInviteUrl("https://discord.gg/example"),
    "https://discord.gg/example",
  );
  assert.equal(
    getDiscordInviteUrl(" https://discord.com/invite/example "),
    "https://discord.com/invite/example",
  );
});

test("rejects missing, unsafe, or unrelated URLs", () => {
  const invalidValues = [
    undefined,
    "",
    "javascript:alert(1)",
    "http://discord.gg/example",
    "https://discord.gg.evil.example/invite",
    "https://example.com/invite",
    "https://discord.gg",
    "https://discord.com/example",
    "https://user:password@discord.gg/example",
    "https://discord.gg:8443/example",
  ];

  for (const value of invalidValues) {
    assert.equal(getDiscordInviteUrl(value), undefined);
  }
});
