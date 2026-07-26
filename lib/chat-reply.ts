import type { ChatMessageType } from "@/lib/chat-types";

export function parseChatReply(reply: string): { text: string; type: ChatMessageType } {
  const isVoicePlaceholder = reply.startsWith("[VOICE]");
  return {
    text: isVoicePlaceholder ? reply.slice("[VOICE]".length).trim() : reply.trim(),
    type: isVoicePlaceholder ? "voice-placeholder" : "text",
  };
}
