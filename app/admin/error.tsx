"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="admin-panel admin-error" role="alert">
      <h2>后台页面加载失败</h2>
      <p>请检查数据库连接后重试。</p>
      <button className="admin-button" type="button" onClick={reset}>重新加载</button>
    </section>
  );
}

