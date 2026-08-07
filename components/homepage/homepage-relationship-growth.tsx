import styles from "./homepage.module.css";

const relationshipFeatures = [
  {
    index: "01",
    label: "长期记忆",
    copy: "记住你分享的喜好、习惯和重要信息。",
    detail: "你提过的小事，不必从头再说",
    variant: "memory",
  },
  {
    index: "02",
    label: "关系阶段",
    copy: "从初识、熟悉到默契，让AI陪伴具有成长感。",
    detail: "每一次对话，都在让彼此更熟悉",
    variant: "stages",
  },
  {
    index: "03",
    label: "专属陪伴",
    copy: "专属角色、聊天记录、共同回忆。",
    detail: "一段只属于你们的陪伴空间",
    variant: "companion",
  },
] as const;

function GrowthVisual({ variant }: { variant: (typeof relationshipFeatures)[number]["variant"] }) {
  if (variant === "memory") {
    return (
      <div className={styles.growthMemoryVisual} aria-hidden="true">
        <span>你说过</span>
        <p>“其实我更喜欢安静一点的周末。”</p>
        <small>已加入长期记忆</small>
      </div>
    );
  }

  if (variant === "stages") {
    return (
      <div className={styles.growthStagesVisual} aria-hidden="true">
        <div><i /><span>初识</span></div>
        <div><i /><span>熟悉</span></div>
        <div><i /><span>默契</span></div>
      </div>
    );
  }

  return (
    <div className={styles.growthCompanionVisual} aria-hidden="true">
      <span className={styles.growthAvatar}>舟</span>
      <div><strong>和沈清舟的第 28 天</strong><small>147 条聊天 · 12 个共同回忆</small></div>
      <i>♡</i>
    </div>
  );
}

export function HomepageRelationshipGrowth() {
  return (
    <section
      className={`${styles.marketingSection} ${styles.relationshipSection}`}
      id="relationship"
      aria-labelledby="relationship-title"
    >
      <div className={styles.relationshipIntro}>
        <p className={styles.eyebrow}>A RELATIONSHIP THAT CONTINUES</p>
        <h2 id="relationship-title">不止聊天，<br />让关系慢慢成长。</h2>
        <p>今天说过的话，会成为明天更懂你的开始。陪伴不是一次性的回答，而是持续积累的相处。</p>
      </div>

      <div className={styles.relationshipCanvas}>
        <div className={styles.relationshipThread} aria-hidden="true"><span /><i /><i /><i /></div>
        <div className={styles.relationshipGrid}>
          {relationshipFeatures.map((feature) => (
            <article className={styles.relationshipCard} key={feature.index}>
              <div className={styles.relationshipCardTop}>
                <span>{feature.index}</span>
                <small>{feature.detail}</small>
              </div>
              <GrowthVisual variant={feature.variant} />
              <h3>{feature.label}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
