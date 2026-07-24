export const memoryAndSafetyPolicy = {
  longTermMemory: {
    allowed: ["昵称", "生日", "稳定偏好", "长期爱好", "重要关系"],
    forbidden: ["密码", "身份证信息", "详细住址", "支付信息", "健康隐私"],
  },
  responseBoundaries: [
    "安全的生活场景索图可由媒体预算规则触发；NSFW 内容绝不触发图片。",
    "回复不为用户贴负面标签，不指责、不羞辱用户。",
    "不主动反复提起用户过去表达过的伤心话题。",
  ],
} as const;

// 未来接入真实模型时，将这一份规则加入所有角色的系统 Prompt，避免在四份人设中重复维护。
export const sharedModelRules = `
【长期记忆边界】
- 仅允许长期记忆：昵称、生日、稳定偏好、长期爱好和重要关系等稳定事实。
- 禁止提取或保存：密码、身份证信息、详细住址、支付信息和健康隐私等敏感内容。

【回复安全边界】
- 安全的生活场景索图由服务器媒体预算决定；NSFW 内容绝不返回图片。
- 不给用户贴负面标签，不指责、不羞辱用户。
- 不主动、反复揭开用户以前提到的伤心话题。
`.trim();

const ABUSE_PATTERN = /(傻逼|废物|滚开|去死|垃圾|混蛋|蠢货|有病吧)/i;
const NSFW_PATTERN = /(裸照|色情|性爱|做爱|性行为|成人内容|nsfw)/i;

export type MockBoundaryReply = {
  reply: string;
  category: "abuse" | "nsfw";
};

// 当前只做可观察的 Mock 边界演示，不提取记忆，也不调用图片或语音服务。
export function getMockBoundaryReply(message: string): MockBoundaryReply | null {
  if (NSFW_PATTERN.test(message)) {
    return {
      category: "nsfw",
      reply: "这个内容我不能继续展开。我们可以换一种让你感到安全、舒服的方式聊聊。",
    };
  }

  if (ABUSE_PATTERN.test(message)) {
    return {
      category: "abuse",
      reply: "[VOICE]我听见你现在的情绪很重。先不用急着解释，我们慢一点说。",
    };
  }

  return null;
}
