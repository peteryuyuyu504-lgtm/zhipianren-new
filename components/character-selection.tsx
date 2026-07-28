import Link from "next/link";
import { TeamSectionBlock } from "@/components/ui/team-section-block-shadcnui";

export default function CharacterSelection() {
  return (
    // 角色选择组件负责展示四位角色，并将用户带入对应的一对一聊天页。
    <main className="selection-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="selection-shell">
        <nav className="selection-topbar" aria-label="页面导航">
          <Link className="selection-login-link" href="/login">
            <span aria-hidden="true">←</span>
            返回首页
          </Link>
          <span className="selection-brand">纸片人男友 · ONLINE</span>
        </nav>

        <header className="selection-header">
          <p className="eyebrow">选择倾听者</p>
          <h1>今天想让谁陪你说话？</h1>
        </header>

        <TeamSectionBlock />

      </section>
    </main>
  );
}
