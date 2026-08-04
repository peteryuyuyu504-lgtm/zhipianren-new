import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWelcomeEmailHtml,
  sendWelcomeEmailAfterUserCreate,
} from "@/lib/welcome-email";

test("welcome email includes a configured Discord invite", () => {
  const html = buildWelcomeEmailHtml(
    "小明",
    "https://discord.gg/example",
  );

  assert.match(html, /加入我们的 Discord 社群/);
  assert.match(html, /href="https:\/\/discord\.gg\/example"/);
});

test("welcome email omits all Discord copy when configuration is missing", () => {
  const html = buildWelcomeEmailHtml("小明", undefined);

  assert.doesNotMatch(html, /Discord/);
  assert.match(html, /欢迎来到纸片人男友/);
});

test("welcome email omits unsafe Discord configuration", () => {
  const html = buildWelcomeEmailHtml("小明", "javascript:alert(1)");

  assert.doesNotMatch(html, /Discord/);
  assert.doesNotMatch(html, /javascript:/);
});

test("welcome email escapes the user name", () => {
  const html = buildWelcomeEmailHtml("<script>alert(1)</script>", undefined);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("new-user hook passes the registered user to the welcome sender", async () => {
  const calls: Array<[string, string]> = [];

  await sendWelcomeEmailAfterUserCreate(
    { email: "person@example.com", name: "小明" },
    async (email, name) => {
      calls.push([email, name]);
    },
  );

  assert.deepEqual(calls, [["person@example.com", "小明"]]);
});

test("new-user hook preserves registration when email delivery fails", async () => {
  const originalConsoleError = console.error;
  const errors: unknown[][] = [];
  console.error = (...arguments_) => errors.push(arguments_);

  try {
    await assert.doesNotReject(
      sendWelcomeEmailAfterUserCreate(
        { email: "person@example.com", name: "小明" },
        async () => {
          throw new Error("Resend unavailable");
        },
      ),
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.[0], "欢迎邮件发送失败：");
});
