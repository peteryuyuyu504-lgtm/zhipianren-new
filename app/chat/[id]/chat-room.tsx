"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Character } from "@/data/characters";
import type { ChatMessage, ChatMessageType, ChatResponse } from "@/lib/chat-types";
import {
  getBalancedMediaState,
  getChatSessionStats,
  getChatStorageKey,
  parseStoredMessages,
} from "@/lib/chat-storage";
import { parseChatReply } from "@/lib/chat-reply";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/chat-limits";

const MAX_SAVED_MESSAGES = 100;

const CHAT_PRESENTATIONS: Record<
  string,
  {
    theme: string;
    statusLabel: string;
    status: string;
    onlineLabel: string;
    placeholder: string;
  }
> = {
  "shen-qingzhou": {
    theme: "bookshop",
    statusLabel: "书店此刻",
    status: "雨刚停 · 正在整理旧书",
    onlineLabel: "在线 · 安静陪伴中",
    placeholder: "和沈清舟说点什么…",
  },
  "ji-yu": {
    theme: "system",
    statusLabel: "SYSTEM STATUS",
    status: "专注模式 · 23 min",
    onlineLabel: "离线留言 · 通常很快回复",
    placeholder: "输入一条待处理的信息…",
  },
  "lin-lie": {
    theme: "court",
    statusLabel: "今日训练",
    status: "投篮 87% · 状态火热",
    onlineLabel: "在线 · 刚结束训练",
    placeholder: "喊林烈一声…",
  },
  "gu-wenshen": {
    theme: "atelier",
    statusLabel: "TONIGHT'S NOTE",
    status: "雪松 · 鸢尾 · 潮湿空气",
    onlineLabel: "离线 · 留下一段气味",
    placeholder: "写下此刻没有名字的情绪…",
  },
};

function createMessage(sender: ChatMessage["sender"], text: string, type: ChatMessageType = "text") {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    text,
    createdAt: new Date().toISOString(),
    type,
  } satisfies ChatMessage;
}

function formatMessageTime(createdAt: string) {
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(createdAt));
}

function formatLastChatTime(createdAt: string | null) {
  if (!createdAt) return "还没有正式聊天";
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "时间未知";

  const now = Date.now();
  const elapsed = Math.max(0, now - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  if (elapsed < minute) return "刚刚";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}分钟前`;
  if (elapsed < 24 * hour) return `${Math.floor(elapsed / hour)}小时前`;

  const replyDate = new Date(timestamp);
  const yesterday = new Date(now);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  if (replyDate >= yesterday && replyDate < new Date(yesterday.getTime() + 24 * hour)) {
    return "昨天";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(replyDate);
}

function getTimeOfDayHint() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "早晨好，慢慢开始今天的对话";
  if (hour >= 11 && hour < 14) return "中午了，记得给自己一点休息时间";
  if (hour >= 14 && hour < 18) return "下午好，想说什么都可以慢慢说";
  if (hour >= 18 && hour < 23) return "晚上好，今天的心情也可以留在这里";
  return "夜深了，这里仍有人安静听你说话";
}

function getRelationshipHint(completedRounds: number) {
  if (completedRounds < 2) return "你们还在初次认识";
  if (completedRounds < 6) return "你们正在逐渐熟悉";
  return "你们已经聊过一段时间";
}

function getReturnHint(lastCompletedAt: string | null) {
  if (!lastCompletedAt) return "这是你们第一次认真聊天";
  const relativeTime = formatLastChatTime(lastCompletedAt);
  if (relativeTime === "刚刚") return "你们刚刚还在聊天";
  return `上次聊天是${relativeTime}`;
}

function VoiceMessageCard({
  text,
  characterId,
}: {
  text: string;
  characterId: string;
}) {
  const spokenText = text.replace(/^(?:\[VOICE\]\s*)+/i, "").trim();
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  async function createAudio() {
    if (isLoading || audioUrl) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText, characterId }),
      });
      if (!response.ok) throw new Error("TTS request failed");

      setAudioUrl(URL.createObjectURL(await response.blob()));
    } catch {
      setError("语音暂时生成失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="voice-placeholder-card">
      <div className="voice-placeholder-head">
        <span className="voice-icon" aria-hidden="true">◖</span>
        <strong>语音消息</strong>
      </div>
      {audioUrl ? (
        <audio className="voice-audio" src={audioUrl} controls autoPlay />
      ) : (
        <button
          className="voice-generate-button"
          type="button"
          onClick={() => void createAudio()}
          disabled={isLoading}
        >
          {isLoading ? "正在生成语音…" : "点击播放"}
        </button>
      )}
      <p>{spokenText}</p>
      {error && <p className="voice-error">{error}</p>}
    </div>
  );
}

function ImageMessageCard({
  message,
  onUpdate,
}: {
  message: ChatMessage;
  onUpdate: (
    id: string,
    update: Pick<ChatMessage, "imageStatus" | "imageUrl">,
  ) => void;
}) {
  useEffect(() => {
    if (message.imageStatus !== "processing" || !message.imageTaskId) return;
    let cancelled = false;
    let timer = 0;
    let attempts = 0;

    async function poll() {
      if (cancelled || !message.imageTaskId) return;
      attempts += 1;
      try {
        const response = await fetch(
          `/api/images/tasks/${encodeURIComponent(message.imageTaskId)}?kind=image-to-image`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Image task query failed");
        const data = (await response.json()) as {
          status?: string;
          images?: Array<{ url?: string }>;
        };
        const imageUrl = data.images?.[0]?.url;

        if (data.status === "completed" && imageUrl) {
          onUpdate(message.id, {
            imageStatus: "completed",
            imageUrl,
          });
          return;
        }
        if (data.status === "failed" || data.status === "cancelled") {
          onUpdate(message.id, {
            imageStatus: "failed",
            imageUrl: undefined,
          });
          return;
        }
      } catch {
        if (attempts >= 40) {
          onUpdate(message.id, {
            imageStatus: "failed",
            imageUrl: undefined,
          });
          return;
        }
      }

      if (!cancelled) timer = window.setTimeout(poll, 3_000);
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [message.id, message.imageStatus, message.imageTaskId, onUpdate]);

  return (
    <div className="character-image-card">
      {message.imageStatus === "completed" && message.imageUrl ? (
        <Image
          src={message.imageUrl}
          alt={message.text}
          width={720}
          height={720}
          unoptimized
        />
      ) : message.imageStatus === "failed" ? (
        <p>照片暂时没有生成成功，不会重复扣除新的生成次数。</p>
      ) : (
        <div className="image-generating" role="status">
          <span />
          <p>正在准备一张生活照…</p>
        </div>
      )}
      <small>{message.text}</small>
    </div>
  );
}

export default function ChatRoom({ character }: { character: Character }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [failedMessage, setFailedMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const sessionStats = useMemo(() => getChatSessionStats(messages), [messages]);
  const presentation =
    CHAT_PRESENTATIONS[character.id] ?? CHAT_PRESENTATIONS["shen-qingzhou"];

  // 每位角色使用独立键名，避免不同角色的本地聊天记录混在一起。
  const storageKey = getChatStorageKey(character.id);

  const updateImageMessage = useCallback(
    (
      id: string,
      update: Pick<ChatMessage, "imageStatus" | "imageUrl">,
    ) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, ...update } : message,
        ),
      );
    },
    [],
  );

  // 首次进入时安全读取本地历史，损坏数据会回退到只有开场白的记录。
  useEffect(() => {
    let restoredMessages: ChatMessage[] = [];
    try {
      restoredMessages = parseStoredMessages(
        window.localStorage.getItem(storageKey),
        MAX_SAVED_MESSAGES,
      );
    } catch {
      restoredMessages = [];
    }

    const restoreTimer = window.setTimeout(() => {
      setMessages(
        restoredMessages.length > 0
          ? restoredMessages
          : [createMessage("character", character.greeting)],
      );
      setIsHistoryReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [character.greeting, storageKey]);

  // 历史恢复后才写入 localStorage，避免用初始空数组覆盖已有记录。
  useEffect(() => {
    if (!isHistoryReady) return;

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)),
      );
    } catch {
      // 浏览器禁用或限制本地存储时，聊天仍保持当前页面可用。
    }
  }, [isHistoryReady, messages, storageKey]);

  // 新消息、错误或输入状态出现时，将聊天区域移动到最新内容。
  useEffect(() => {
    if (isHistoryReady) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isHistoryReady, messages, isTyping, replyError]);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  async function requestReply(userText: string, currentMessages: ChatMessage[]) {
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsTyping(true);
    setReplyError("");

    try {
      const allCharacterMessages: ChatMessage[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key?.startsWith("paper-boyfriend:chat:") || key === storageKey) {
          continue;
        }
        allCharacterMessages.push(
          ...parseStoredMessages(window.localStorage.getItem(key)),
        );
      }
      allCharacterMessages.push(...currentMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          message: userText,
          history: currentMessages
            .filter((message) => message.type !== "image")
            .slice(-12)
            .map(({ sender, text, type }) => ({ sender, text, type })),
          mediaState: getBalancedMediaState(
            currentMessages,
            allCharacterMessages,
          ),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = "聊天接口返回失败";
        try {
          const errorData = (await response.json()) as { error?: unknown };
          if (
            typeof errorData.error === "string" &&
            errorData.error.trim()
          ) {
            errorMessage = errorData.error.trim();
          }
        } catch {
          // Keep the generic message when the server response is not JSON.
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as Partial<ChatResponse>;
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("聊天接口没有返回有效回复");
      }

      const parsedReply = parseChatReply(data.reply);

      setMessages((current) => {
        const nextMessages: ChatMessage[] = [
          ...current,
          createMessage(
          "character",
          parsedReply.text,
          parsedReply.type,
          ),
        ];
        if (data.imageTask?.taskId) {
          nextMessages.push({
            ...createMessage(
              "character",
              `${character.name}发来了一张此刻的生活照`,
              "image",
            ),
            imageTaskId: data.imageTask.taskId,
            imageStatus: "processing",
          });
        }
        return nextMessages;
      });
      setFailedMessage("");
    } catch (error) {
      if (controller.signal.aborted) return;
      setFailedMessage(userText);
      setReplyError(
        error instanceof Error
          ? error.message
          : "回复暂时没有送达，请重试。",
      );
    } finally {
      if (!controller.signal.aborted) setIsTyping(false);
    }
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isTyping || !isHistoryReady) return;
    if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
      setReplyError("消息长度超过限制，请缩短后重新发送。");
      return;
    }

    const userMessage = createMessage("user", text);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setFailedMessage("");
    void requestReply(text, nextMessages);
  }

  function retryReply() {
    if (!failedMessage || isTyping) return;
    void requestReply(failedMessage, messages);
  }

  return (
    <main
      className="chat-page"
      data-chat-theme={presentation.theme}
      style={{ "--accent": character.accent } as React.CSSProperties}
    >
      <section className="chat-shell">
        <aside className="chat-character-panel">
          <Link className="panel-back-button" href="/characters" aria-label="返回选择角色">
            ←
          </Link>
          <div className="panel-portrait">
            <Image
              src={character.image}
              alt={`${character.name}的头像`}
              fill
              priority
              sizes="116px"
            />
          </div>
          <div className="panel-identity">
            <h2>{character.name}</h2>
            <p>{character.occupation}</p>
          </div>
          <blockquote>{character.tagline}</blockquote>
          <div className="panel-tags" aria-label="人物特点">
            {character.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="panel-spacer" />
          <div className="panel-status">
            <small>{presentation.statusLabel}</small>
            <strong>{presentation.status}</strong>
          </div>
        </aside>

        <div className="chat-conversation">
        <header className="chat-header">
          <Link className="back-button" href="/characters" aria-label="返回选择角色">←</Link>
          <div className="mini-portrait" aria-hidden="true">
            <Image src={character.image} alt="" fill sizes="42px" />
          </div>
          <div className="chat-identity">
            <h1>{character.name}</h1>
            <p>
              <span className={`online-dot ${character.isOnline ? "" : "offline"}`} />
              {presentation.onlineLabel}
            </p>
          </div>
          <button className="more-button" type="button" aria-label="更多选项" disabled>•••</button>
        </header>

        {isHistoryReady && (
          <section className="chat-session-summary" aria-label="当前会话信息">
            <span>会话状态：{sessionStats.status}</span>
            <span>已完成 {sessionStats.completedRounds} 轮对话</span>
            <span>最后聊天：{formatLastChatTime(sessionStats.lastCompletedAt)}</span>
            <p className="relationship-time-hint">
              {getTimeOfDayHint()}。{getRelationshipHint(sessionStats.completedRounds)}，
              {getReturnHint(sessionStats.lastCompletedAt)}。
            </p>
          </section>
        )}

        <div className="message-area" aria-live="polite">
          <div className="today-label">今天</div>
          {!isHistoryReady && <p className="history-loading">正在恢复本地聊天记录…</p>}

          {messages.map((message) => (
            <div className={`message-row ${message.sender}`} key={message.id}>
              {message.sender === "character" && (
                <div className="message-avatar" aria-hidden="true">
                  <Image src={character.image} alt="" fill sizes="34px" />
                </div>
              )}
              <div className="message-content">
                {message.type === "voice-placeholder" ? (
                  <VoiceMessageCard
                    text={message.text}
                    characterId={character.id}
                  />
                ) : message.type === "image" ? (
                  <ImageMessageCard
                    message={message}
                    onUpdate={updateImageMessage}
                  />
                ) : (
                  <div className="message-bubble">{message.text}</div>
                )}
                {formatMessageTime(message.createdAt) && (
                  <time className="message-time" dateTime={message.createdAt}>
                    {formatMessageTime(message.createdAt)}
                  </time>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row character typing-row" aria-label={`${character.name}正在输入`}>
              <div className="message-avatar" aria-hidden="true">
                <Image src={character.image} alt="" fill sizes="34px" />
              </div>
              <div className="message-bubble typing-bubble">
                <span>对方正在输入</span>
                <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
              </div>
            </div>
          )}

          {replyError && (
            <div className="chat-error" role="alert">
              <span>{replyError}</span>
              <button type="button" onClick={retryReply} disabled={isTyping}>重试</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="message-input">输入消息</label>
          <input
            id="message-input"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (replyError) setReplyError("");
            }}
            placeholder={presentation.placeholder}
            autoComplete="off"
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            disabled={isTyping || !isHistoryReady}
          />
          <button type="submit" disabled={!draft.trim() || isTyping || !isHistoryReady}>发送</button>
        </form>
        </div>
      </section>
      <p className="prototype-note">聊天记录暂存在当前浏览器中，清理浏览器数据后可能消失。</p>
    </main>
  );
}
