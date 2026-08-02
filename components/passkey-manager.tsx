"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type RegisteredPasskey = {
  id: string;
  name?: string | null;
  deviceType?: string;
  backedUp?: boolean;
  createdAt?: string | Date;
};

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPasskeys() {
    const result = await authClient.passkey.listUserPasskeys();
    if (result.error) {
      throw new Error(result.error.message || "无法读取通行密钥");
    }
    setPasskeys((result.data ?? []) as RegisteredPasskey[]);
  }

  useEffect(() => {
    let active = true;

    void authClient.passkey.listUserPasskeys().then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error.message || "暂时无法读取通行密钥。");
      } else {
        setPasskeys((result.data ?? []) as RegisteredPasskey[]);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleAddPasskey() {
    if (isAdding) return;
    setIsAdding(true);
    setMessage("");
    setError("");

    try {
      const result = await authClient.passkey.addPasskey({
        name: "我的设备",
      });
      if (result.error) {
        setError(result.error.message || "通行密钥创建没有完成。");
        return;
      }
      await loadPasskeys();
      setMessage("通行密钥已添加。现在可以在登录页使用它登录。 ");
    } catch {
      setError("通行密钥创建没有完成，请确认浏览器支持后重试。");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeletePasskey(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) {
        setError(result.error.message || "删除通行密钥失败。");
        return;
      }
      setPasskeys((current) => current.filter((item) => item.id !== id));
      setMessage("通行密钥已删除。");
    } catch {
      setError("删除通行密钥失败，请稍后重试。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="security-page">
      <section className="security-card">
        <Link className="security-back-link" href="/characters">
          <span aria-hidden="true">←</span> 返回角色选择
        </Link>

        <div className="security-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7.5 14a5.5 5.5 0 1 1 4.79-2.8L22 11.2V15h-2.5v2.5H17V20h-4v-4.29A5.48 5.48 0 0 1 7.5 14Zm0-3A2.5 2.5 0 1 0 7.5 6a2.5 2.5 0 0 0 0 5Z" />
          </svg>
        </div>

        <p className="security-eyebrow">ACCOUNT SECURITY</p>
        <h1>通行密钥</h1>
        <p className="security-description">
          使用手机指纹、面容或电脑 PIN 登录，不需要再次输入密码。
        </p>

        {error && <p className="security-feedback is-error" role="alert">{error}</p>}
        {message && <p className="security-feedback is-success">{message}</p>}

        <button
          className="security-add-button"
          type="button"
          onClick={() => void handleAddPasskey()}
          disabled={isAdding}
        >
          {isAdding ? "正在等待设备确认..." : "在此设备添加通行密钥"}
        </button>

        <div className="security-passkey-list">
          <h2>已添加的通行密钥</h2>
          {isLoading ? (
            <p className="security-empty">正在读取...</p>
          ) : passkeys.length === 0 ? (
            <p className="security-empty">还没有添加通行密钥。</p>
          ) : (
            passkeys.map((item) => (
              <article className="security-passkey-item" key={item.id}>
                <div>
                  <strong>{item.name || "通行密钥"}</strong>
                  <span>
                    {item.backedUp ? "已同步到密码管理器" : "保存在此设备"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeletePasskey(item.id)}
                  disabled={deletingId !== null}
                >
                  {deletingId === item.id ? "删除中..." : "删除"}
                </button>
              </article>
            ))
          )}
        </div>

        <p className="security-note">
          建议至少保留邮箱密码作为备用登录方式。通行密钥仅能在 HTTPS 网站或本机 localhost 使用。
        </p>
      </section>
    </main>
  );
}
