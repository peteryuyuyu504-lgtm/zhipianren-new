import { getUserCount } from "@/lib/admin-data";

export default async function AdminDashboardPage() {
  let userCount: number | null = null;
  let error = "";

  try {
    userCount = await getUserCount();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "读取数据失败。";
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Overview</p>
          <h1>运营概览</h1>
          <p>基于当前数据库结构展示可验证的运营数据，不补造缺失指标。</p>
        </div>
        <span className="admin-role">管理员</span>
      </header>
      <div className="admin-capability-strip">
        数据能力：用户表已接入 · 时间、状态、订单与金额字段尚未接入
      </div>
      {error ? (
        <section className="admin-panel admin-error" role="alert">
          <h2>概览数据暂时不可用</h2>
          <p>{error}</p>
        </section>
      ) : (
        <section className="admin-grid" aria-label="运营指标">
          <article className="admin-stat"><span>用户总数</span><strong>{userCount}</strong><small>来自 users 表</small></article>
          <article className="admin-stat is-unavailable"><span>最近新增用户</span><strong>未接入</strong><small>缺少 created_at 字段</small></article>
          <article className="admin-stat is-unavailable"><span>订单总数</span><strong>未接入</strong><small>当前 schema 没有订单表</small></article>
          <article className="admin-stat is-unavailable"><span>成交额</span><strong>未接入</strong><small>当前 schema 没有金额字段</small></article>
        </section>
      )}
    </>
  );
}

