export default function AdminOrdersPage() {
  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Orders</p>
          <h1>订单管理</h1>
          <p>订单模块入口已纳入统一后台，但当前数据库尚未定义订单数据模型。</p>
        </div>
        <span className="admin-role">数据待接入</span>
      </header>
      <div className="admin-capability-strip">
        未创建虚假订单数据或接口；接入真实 orders schema 后可沿用本页的查询与表格结构。
      </div>
      <section className="admin-panel admin-empty">
        <span className="admin-empty-mark">—</span>
        <h2>尚无可读取的订单表</h2>
        <p>当前 Drizzle schema 只有 users 表，因此订单号、关联用户、金额、状态、创建时间和详情都无法可靠展示或编辑。</p>
      </section>
    </>
  );
}

