import styles from "./homepage.module.css";

const experienceSteps = [
  {
    label: "先认识",
    title: "从一句问候开始",
    copy: "不用准备话题，也不用组织得很完整。你的第一句话，就是对话的入口。",
  },
  {
    label: "再靠近",
    title: "让他记住你的语气",
    copy: "每个角色都有自己的性格、节奏和回应方式，陪伴会慢慢变得熟悉。",
  },
  {
    label: "随时回来",
    title: "把想说的话留在这里",
    copy: "文字或语音，开心的事和低落的时刻，都可以在同一段关系里继续。",
  },
];

export function HomepageExperience() {
  return (
    <section className={styles.experienceSection} id="experience" aria-labelledby="experience-title">
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrow}>THE EXPERIENCE</p>
        <h2 id="experience-title">陪伴不需要复杂的说明书。</h2>
        <p>把 AI 从一个工具，变成一个你愿意回来找的人。</p>
      </div>

      <div className={styles.experienceBoard}>
        <div className={styles.chatPreview}>
          <div className={styles.chatPreviewHeader}>
            <span className={styles.chatAvatar}>舟</span>
            <span><strong>沈清舟</strong><small>独立书店主理人 · 在线</small></span>
            <span className={styles.chatSignal} aria-label="在线" />
          </div>
          <div className={styles.chatBubble}>今天过得怎么样？不用急，慢慢告诉我。</div>
          <div className={`${styles.chatBubble} ${styles.chatBubbleUser}`}>有点累，但现在好多了。</div>
          <div className={styles.chatBubble}>那今晚先把速度放慢一点。你想从哪件小事说起？</div>
          <span className={styles.chatTime}>刚刚</span>
        </div>

        <div className={styles.experienceSteps}>
          {experienceSteps.map((step, index) => (
            <article className={styles.experienceStep} key={step.label}>
              <span className={styles.stepIndex}>0{index + 1}</span>
              <div>
                <p>{step.label}</p>
                <h3>{step.title}</h3>
                <span>{step.copy}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
