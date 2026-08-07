import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readHomepageFile = (name: string) => readFileSync(
  new URL(`../components/homepage/${name}`, import.meta.url),
  "utf8",
);

test("homepage marketing sections keep the required copy and registration path", () => {
  const source = [
    readHomepageFile("homepage-capabilities.tsx"),
    readHomepageFile("homepage-visual-moment.tsx"),
    readHomepageFile("homepage-relationship-growth.tsx"),
    readHomepageFile("homepage-getting-started.tsx"),
  ].join("\n");

  assert.match(source, /懂你的情绪，也懂你的故事/);
  assert.match(source, /听见他的声音/);
  assert.match(source, /记住你说过的话/);
  assert.match(source, /他不只是回复你/);
  assert.match(source, /也会分享他的此刻/);
  assert.match(source, /根据聊天内容生成属于他的生活瞬间/);
  assert.match(source, /你现在在干嘛/);
  assert.match(source, /刚忙完，在咖啡店坐了一会/);
  assert.match(source, /角色外貌/);
  assert.match(source, /homepage\/scenes\/shen-qingzhou\.png/);
  assert.match(source, /不止聊天/);
  assert.match(source, /长期记忆/);
  assert.match(source, /关系阶段/);
  assert.match(source, /专属陪伴/);
  assert.match(source, /三步开启你的专属陪伴/);
  assert.match(source, /创建账号/);
  assert.match(source, /选择AI男友/);
  assert.match(source, /开始聊天/);
  assert.match(source, /href="\/register"/);
});
