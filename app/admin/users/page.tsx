import Link from "next/link";
import { getUsersPage } from "@/lib/admin-data";

type UsersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/admin/users?${params}`;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10) || 1;
  const outcome = await getUsersPage(query, requestedPage)
    .then((result) => ({ result, error: "" }))
    .catch((cause: unknown) => ({
      result: null,
      error: cause instanceof Error ? cause.message : "读取用户失败。",
    }));

  if (!outcome.result) {
    return (
      <>
        <header className="admin-header"><div><p className="admin-kicker">Users</p><h1>用户管理</h1></div></header>
        <section className="admin-panel admin-error" role="alert"><h2>用户列表暂时不可用</h2><p>{outcome.error}</p></section>
      </>
    );
  }

  const result = outcome.result;
  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Users</p>
          <h1>用户管理</h1>
          <p>搜索用户名称或邮箱。列表严格使用现有 users schema。</p>
        </div>
        <span className="admin-role">共 {result.total} 位用户</span>
      </header>
      <div className="admin-capability-strip">
        字段映射：name → username · created_at 与 status 当前不存在，暂不开放编辑
      </div>
      <section className="admin-panel">
        <div className="admin-toolbar">
          <form className="admin-search" action="/admin/users">
            <input name="q" defaultValue={query} aria-label="搜索用户" placeholder="搜索 username 或 email" />
            <button className="admin-button" type="submit">搜索</button>
          </form>
          <span className="admin-filter-disabled" title="users 表没有 status 字段">状态筛选未接入</span>
        </div>
        {result.items.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-mark">0</span>
            <h2>没有匹配的用户</h2>
            <p>请尝试更短的名称或邮箱关键词。</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>ID</th><th>名称</th><th>邮箱</th><th>创建时间</th><th>状态</th></tr></thead>
                <tbody>
                  {result.items.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{user.username || "未填写"}</td>
                      <td>{user.email}</td>
                      <td className="admin-unsupported">schema 未提供</td>
                      <td className="admin-unsupported">schema 未提供</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="admin-pagination">
              <span>第 {result.page} / {result.totalPages} 页</span>
              <div>
                <Link className="admin-page-link" href={pageHref(query, result.page - 1)} aria-disabled={result.page <= 1}>上一页</Link>
                <Link className="admin-page-link" href={pageHref(query, result.page + 1)} aria-disabled={result.page >= result.totalPages}>下一页</Link>
              </div>
            </footer>
          </>
        )}
      </section>
    </>
  );
}
