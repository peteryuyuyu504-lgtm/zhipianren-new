import type { ChatMessage } from "@/lib/chat-types";

export function getChatStorageKey(characterId: string) {
  return `paper-boyfriend:chat:${characterId}`;
}

function isStoredMessage(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.sender === "user" || message.sender === "character") &&
    typeof message.text === "string" &&
    (message.createdAt === undefined || typeof message.createdAt === "string") &&
    (message.type === undefined || message.type === "text" || message.type === "voice-placeholder")
  );
}

// 本地记录损坏或结构过期时返回空数组，避免聊天页面崩溃。
export function parseStoredMessages(rawHistory: string | null, limit = 100) {
  if (!rawHistory) return [];

  try {
    const parsedHistory = JSON.parse(rawHistory) as unknown;
    if (!Array.isArray(parsedHistory) || !parsedHistory.every(isStoredMessage)) return [];

    // 旧版消息可能没有时间或类型；读取时补成安全值，并在下一次保存时完成升级。
    return parsedHistory.slice(-limit).map((message) => ({
      ...message,
      createdAt:
        typeof message.createdAt === "string" && !Number.isNaN(Date.parse(message.createdAt))
          ? message.createdAt
          : "",
      type: message.type === "voice-placeholder" ? "voice-placeholder" : "text",
    })) as ChatMessage[];
  } catch {
    return [];
  }
}

export function getChatSessionStats(messages: ChatMessage[]) {
  const hasUserMessage = messages.some((message) => message.sender === "user");
  let completedRounds = 0;
  let lastCompletedAt: string | null = null;

  // 只有相邻的“用户消息 + 有效角色回复”才算完整一轮，开场白和失败请求不会计入。
  for (let index = 0; index < messages.length - 1; index += 1) {
    const userMessage = messages[index];
    const replyMessage = messages[index + 1];
    if (
      userMessage.sender === "user" &&
      replyMessage.sender === "character" &&
      replyMessage.text.trim()
    ) {
      completedRounds += 1;
      if (replyMessage.createdAt && !Number.isNaN(Date.parse(replyMessage.createdAt))) {
        lastCompletedAt = replyMessage.createdAt;
      }
    }
  }

  return {
    status: hasUserMessage ? "进行中" : "尚未开始",
    completedRounds,
    lastCompletedAt,
  } as const;
}
