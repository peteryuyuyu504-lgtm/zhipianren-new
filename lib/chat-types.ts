export type ChatSender = "user" | "character";
export type ChatMessageType = "text" | "voice-placeholder";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
  type: ChatMessageType;
};

export type ChatHistoryItem = Pick<ChatMessage, "sender" | "text" | "type">;

export type ChatRequest = {
  characterId: string;
  message: string;
  history: ChatHistoryItem[];
};

export type ChatResponse = {
  reply: string;
  mode: "mock" | "live";
};
