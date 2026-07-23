export const memoryAndSafetyPolicy = {
  longTermMemory: {
    allowed: ["昵称", "生日", "稳定偏好", "长期爱好", "重要关系"],
    forbidden: ["密码", "身份证信息", "详细住址", "支付信息", "健康隐私"],
  },
  responseBoundaries: [
    "命令式索图、辱骂或 NSFW 内容不触发图片返回，只使用尊重、克制的文字回应。",
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
- 用户命令式索图、辱骂或提出 NSFW 内容时，不返回图片，改用尊重、克制的文字回应；必要时只返回 [VOICE] 语音安抚占位。
- 不给用户贴负面标签，不指责、不羞辱用户。
- 不主动、反复揭开用户以前提到的伤心话题。
`.trim();

const IMAGE_COMMAND_PATTERN = /(给我|帮我|立刻|马上|现在).{0,8}(发|生成|画|做|给).{0,6}(图片|照片|图|自拍)|发.{0,4}(图片|照片|自拍)|生成.{0,6}(图片|照片)/i;
const ABUSE_PATTERN = /(傻逼|废物|滚开|去死|垃圾|混蛋|蠢货|有病吧)/i;
const NSFW_PATTERN = /(裸照|色情|性爱|做爱|性行为|成人内容|nsfw)/i;

export type MockBoundaryReply = {
  reply: string;
  category: "image-command" | "abuse" | "nsfw";
};

// 当前只做可观察的 Mock 边界演示，不提取记忆，也不调用图片或语音服务。
export function getMockBoundaryReply(message: string): MockBoundaryReply | null {
  if (NSFW_PATTERN.test(message)) {
    return {
      category: "nsfw",
      reply: "这个内容我不能继续展开。我们可以换一种让你感到安全、舒服的方式聊聊。",
    };
  }

  if (IMAGE_COMMAND_PATTERN.test(message)) {
    return {
      category: "image-command",
      reply: "现在不能为你发送或生成图片。不过你可以告诉我想看见怎样的画面，我会用文字陪你慢慢描述。",
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
