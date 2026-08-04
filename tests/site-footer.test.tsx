import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooterContent } from "@/components/site-footer";

test("Footer shows a valid Discord invite without duplicating contact email", () => {
  const html = renderToStaticMarkup(
    <SiteFooterContent configuredDiscordInviteUrl="https://discord.gg/example" />,
  );

  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /feedback@v-boyfriend\.online/);
  assert.match(html, /href="https:\/\/discord\.gg\/example"/);
  assert.match(html, /加入 Discord 社群/);
});

test("Footer keeps working without a Discord invite", () => {
  const html = renderToStaticMarkup(<SiteFooterContent />);

  assert.match(html, /纸片人男友 · ONLINE/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /加入 Discord 社群/);
});

test("Footer hides an invalid Discord invite", () => {
  const html = renderToStaticMarkup(
    <SiteFooterContent configuredDiscordInviteUrl="javascript:alert(1)" />,
  );

  assert.match(html, /纸片人男友 · ONLINE/);
  assert.doesNotMatch(html, /mailto:/);
  assert.doesNotMatch(html, /加入 Discord 社群/);
  assert.doesNotMatch(html, /javascript:/);
});
