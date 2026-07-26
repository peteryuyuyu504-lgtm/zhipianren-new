export type ChatSender = "user" | "character";
export type ChatMessageType = "text" | "voice-placeholder" | "image";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
  type: ChatMessageType;
  imageTaskId?: string;
  imageUrl?: string;
  imageStatus?: "processing" | "completed" | "failed";
};

export type ChatHistoryItem = Pick<ChatMessage, "sender" | "text" | "type">;

export type ChatRequest = {
  characterId: string;
  message: string;
  history: ChatHistoryItem[];
  mediaState: MediaState;
};

export type MediaState = {
  completedRounds: number;
  dailyImageCount: number;
  dailyVoiceCount: number;
  roundsSinceImage: number;
  roundsSinceVoice: number;
};

export type ChatResponse = {
  reply: string;
  mode: "mock" | "live";
  imageTask?: {
    taskId: string;
    kind: "image-to-image";
  };
};
