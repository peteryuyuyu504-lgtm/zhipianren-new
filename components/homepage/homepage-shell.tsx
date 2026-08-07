import Link from "next/link";
import { HomepageHero } from "./homepage-hero";
import { HomepageCapabilities } from "./homepage-capabilities";
import { HomepageCharacterEntry } from "./homepage-character-entry";
import { HomepageGettingStarted } from "./homepage-getting-started";
import { HomepageRelationshipGrowth } from "./homepage-relationship-growth";
import { HomepageVisualMoment } from "./homepage-visual-moment";
import styles from "./homepage.module.css";

export function HomepageShell() {
  return (
    <main className={styles.homepage}>
      <div className={styles.ambientGlow} aria-hidden="true" />

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="纸片人男友首页">
          <span className={styles.brandMark} aria-hidden="true">◒</span>
          <span>
            <strong>纸片人男友</strong>
            <small>V-BOYFRIEND / ONLINE</small>
          </span>
        </Link>

        <nav className={styles.headerNav} aria-label="首页导航">
          <a href="#capabilities">核心能力</a>
          <a href="#relationship">关系成长</a>
          <a href="#characters">选择角色</a>
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.textAction} href="/login">登录</Link>
          <Link className={styles.smallCta} href="/register">开始体验</Link>
        </div>
      </header>

      <HomepageHero />
      <HomepageCapabilities />
      <HomepageVisualMoment />
      <HomepageRelationshipGrowth />
      <HomepageGettingStarted />
      <HomepageCharacterEntry />

      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <p className={styles.eyebrow}>A QUIET PLACE TO TALK</p>
        <h2 id="final-cta-title">今天，想让谁陪你说说话？</h2>
        <Link className={styles.primaryCta} href="/register">
          创建你的陪伴空间 <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
