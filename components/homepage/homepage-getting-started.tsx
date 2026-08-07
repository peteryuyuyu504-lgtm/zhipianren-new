import Link from "next/link";
import styles from "./homepage.module.css";

const steps = [
  {
    index: "01",
    title: "创建账号",
    copy: "简单注册，保存只属于你的陪伴空间。",
  },
  {
    index: "02",
    title: "选择AI男友",
    copy: "从性格、声音与相处方式里，找到让你心动的他。",
  },
  {
    index: "03",
    title: "开始聊天",
    copy: "说一句你好，让你们的故事从此刻开始。",
  },
];

export function HomepageGettingStarted() {
  return (
    <section
      className={`${styles.marketingSection} ${styles.gettingStartedSection}`}
      id="getting-started"
      aria-labelledby="getting-started-title"
    >
      <div className={styles.gettingStartedHeader}>
        <div>
          <p className={styles.eyebrow}>START YOUR STORY</p>
          <h2 id="getting-started-title">三步开启你的专属陪伴</h2>
        </div>
        <p>无需复杂设置，选好想认识的人，就可以自然地聊起第一句话。</p>
      </div>

      <div className={styles.processPanel}>
        <div className={styles.processGrid}>
          {steps.map((step) => (
            <article className={styles.processStep} key={step.index}>
              <span className={styles.processIndex}>{step.index}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.processAction}>
          <span>准备好认识他了吗？</span>
          <Link className={styles.primaryCta} href="/register">
            创建账号 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
