export default function AdminLoading() {
  return (
    <>
      <header className="admin-header"><div><p className="admin-kicker">Loading</p><h1>正在读取后台数据</h1></div></header>
      <section className="admin-panel admin-empty" aria-live="polite">
        <div className="admin-skeleton" style={{ width: 260 }} />
        <div className="admin-skeleton" style={{ width: 180, marginTop: 12 }} />
      </section>
    </>
  );
}

