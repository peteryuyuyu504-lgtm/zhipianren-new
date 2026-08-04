"use client";

import { useEffect, useRef, useState } from "react";

type CopyEmailButtonProps = {
  email: string;
};

function copyWithFallback(value: string) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    textArea.remove();
  }

  return copied;
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    let copied = false;

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await Promise.race([
        navigator.clipboard.writeText(email),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Clipboard timed out")), 800);
        }),
      ]);
      copied = true;
    } catch {
      try {
        copied = copyWithFallback(email);
      } catch {
        copied = false;
      }
    }

    setStatus(copied ? "copied" : "failed");

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
    }, 2400);
  }

  const isCopied = status === "copied";

  return (
    <div className="contact-copy-area">
      <button
        className={`contact-copy-button${isCopied ? " is-copied" : ""}`}
        type="button"
        onClick={() => void handleCopy()}
      >
        <span aria-hidden="true">{isCopied ? "✓" : "⧉"}</span>
        <span>{isCopied ? "邮箱已复制" : "复制邮箱"}</span>
      </button>
      <p className="contact-copy-status" aria-live="polite">
        {status === "failed" ? "复制失败，请手动选择上方邮箱地址。" : ""}
      </p>
    </div>
  );
}
