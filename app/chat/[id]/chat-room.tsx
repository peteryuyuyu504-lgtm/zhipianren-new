"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Character } from "@/data/characters";

type Message = {
  id: number;
  sender: "user" | "character";
  text: string;
};

export default function ChatRoom({ character }: { character: Character }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "character", text: character.greeting },
  ]);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const replyIndex = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isTyping) return;

    setMessages((current) => [...current, { id: Date.now(), sender: "user", text }]);
    setDraft("");
    setIsTyping(true);

    timerRef.current = setTimeout(() => {
      const reply = character.replies[replyIndex.current % character.replies.length];
      replyIndex.current += 1;
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, sender: "character", text: reply },
      ]);
      setIsTyping(false);
    }, 1050);
  }

  return (
    <main className="chat-page" style={{ "--accent": character.accent } as React.CSSProperties}>
      <section className="chat-shell">
        <header className="chat-header">
          <Link className="back-button" href="/" aria-label="返回选择角色">←</Link>
          <div className="mini-portrait" aria-hidden="true">{character.initial}</div>
          <div className="chat-identity">
            <h1>{character.name}</h1>
            <p><span className="online-dot" />在线</p>
          </div>
          <button className="more-button" type="button" aria-label="更多选项" disabled>•••</button>
        </header>

        <div className="message-area" aria-live="polite">
          <div className="today-label">今天</div>
          {messages.map((message) => (
            <div className={`message-row ${message.sender}`} key={message.id}>
              {message.sender === "character" && (
                <div className="message-avatar" aria-hidden="true">{character.initial}</div>
              )}
              <div className="message-bubble">{message.text}</div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row character typing-row" aria-label={`${character.name}正在输入`}>
              <div className="message-avatar" aria-hidden="true">{character.initial}</div>
              <div className="message-bubble typing-bubble">
                <i /><i /><i />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="message-input">输入消息</label>
          <input
            id="message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`和${character.name}说点什么…`}
            autoComplete="off"
            maxLength={500}
          />
          <button type="submit" disabled={!draft.trim() || isTyping}>发送</button>
        </form>
      </section>
      <p className="prototype-note">当前为本地演示回复 · 刷新后对话将清空</p>
    </main>
  );
}
