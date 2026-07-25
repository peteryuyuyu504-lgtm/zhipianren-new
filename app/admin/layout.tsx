import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/login?next=/admin");

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link className="admin-brand" href="/admin">
            纸片人男友
            <small>Operations console</small>
          </Link>
          <nav className="admin-nav" aria-label="后台导航">
            <Link href="/admin"><i className="admin-nav-mark" />概览</Link>
            <Link href="/admin/users"><i className="admin-nav-mark" />用户管理</Link>
            <Link href="/admin/orders"><i className="admin-nav-mark" />订单管理</Link>
          </nav>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
