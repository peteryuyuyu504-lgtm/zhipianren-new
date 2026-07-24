import type { ChatMessage, MediaState } from "@/lib/chat-types";

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
    (message.type === undefined ||
      message.type === "text" ||
      message.type === "voice-placeholder" ||
      (message.type === "image" &&
        (message.imageStatus === "processing" ||
          message.imageStatus === "completed" ||
          message.imageStatus === "failed")))
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
      type:
        message.type === "voice-placeholder"
          ? "voice-placeholder"
          : message.type === "image"
            ? "image"
            : "text",
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

function isToday(createdAt: string) {
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) return false;
  const created = new Date(createdAt);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

function roundsSinceType(messages: ChatMessage[], type: ChatMessage["type"]) {
  const lastMediaIndex = messages.findLastIndex(
    (message) => message.sender === "character" && message.type === type,
  );
  if (lastMediaIndex < 0) return 10_000;
  return messages
    .slice(lastMediaIndex + 1)
    .filter((message) => message.sender === "user").length;
}

export function getBalancedMediaState(
  currentMessages: ChatMessage[],
  allCharacterMessages: ChatMessage[],
): MediaState {
  const sessionStats = getChatSessionStats(currentMessages);
  return {
    completedRounds: sessionStats.completedRounds,
    dailyImageCount: allCharacterMessages.filter(
      (message) =>
        message.sender === "character" &&
        message.type === "image" &&
        isToday(message.createdAt),
    ).length,
    dailyVoiceCount: allCharacterMessages.filter(
      (message) =>
        message.sender === "character" &&
        message.type === "voice-placeholder" &&
        isToday(message.createdAt),
    ).length,
    roundsSinceImage: roundsSinceType(currentMessages, "image"),
    roundsSinceVoice: roundsSinceType(currentMessages, "voice-placeholder"),
  };
}
