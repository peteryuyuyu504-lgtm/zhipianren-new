import styles from "./homepage.module.css";

const capabilities = [
  {
    index: "01",
    label: "有温度",
    title: "懂你的情绪，也懂你的故事",
    copy: "AI男友会根据聊天内容提供更自然、更有陪伴感的回应。",
    variant: "warmth",
  },
  {
    index: "02",
    label: "有声音",
    title: "听见他的声音",
    copy: "通过AI语音，让文字交流拥有更真实的陪伴体验。",
    variant: "voice",
  },
  {
    index: "03",
    label: "有记忆",
    title: "记住你说过的话",
    copy: "长期记忆重要信息，让每次聊天保持连续性。",
    variant: "memory",
  },
] as const;

function WarmthPreview() {
  return (
    <div className={styles.warmthPreview} aria-hidden="true">
      <div className={styles.previewIdentity}>
        <span>舟</span>
        <p><strong>沈清舟</strong><small>正在认真听你说</small></p>
        <i />
      </div>
      <p className={styles.previewUserMessage}>今天好像什么都没做好。</p>
      <p className={styles.previewReply}>先别急着责怪自己。你已经撑过很累的一天了，剩下的，我们慢慢来。</p>
    </div>
  );
}

function VoicePreview() {
  return (
    <div className={styles.capabilityVoicePreview} aria-hidden="true">
      <span className={styles.capabilityPlay}>▶</span>
      <div className={styles.capabilityWave}>
        {[9, 17, 25, 14, 30, 20, 11, 24, 16, 8, 19, 12].map((height, index) => (
          <i key={`${height}-${index}`} style={{ height }} />
        ))}
      </div>
      <small>00:12</small>
    </div>
  );
}

function MemoryPreview() {
  return (
    <div className={styles.memoryPreview} aria-hidden="true">
      <div className={styles.memoryNote}>
        <span>关于你</span>
        <p>周五下班后，喜欢一个人慢慢走回家。</p>
        <small>刚刚记住</small>
      </div>
      <div className={styles.memoryTags}>
        <span>喜欢雨天</span>
        <span>怕太甜</span>
        <span>小名是绵绵</span>
      </div>
    </div>
  );
}

export function HomepageCapabilities() {
  return (
    <section
      className={`${styles.marketingSection} ${styles.capabilitiesSection}`}
      id="capabilities"
      aria-labelledby="capabilities-title"
    >
      <div className={styles.marketingHeading}>
        <div>
          <p className={styles.eyebrow}>WHY IT FEELS DIFFERENT</p>
          <h2 id="capabilities-title">陪伴，应该比回答更近一点。</h2>
        </div>
        <p>不只接住你的每一句话，也让声音、情绪与记忆在同一段关系里慢慢连起来。</p>
      </div>

      <div className={styles.capabilityGrid}>
        {capabilities.map((capability) => (
          <article
            className={`${styles.capabilityCard} ${styles[`capabilityCard${capability.variant[0].toUpperCase()}${capability.variant.slice(1)}`]}`}
            key={capability.index}
          >
            <div className={styles.capabilityMeta}>
              <span>{capability.index}</span>
              <p>{capability.label}</p>
            </div>
            <h3>{capability.title}</h3>
            <p className={styles.capabilityCopy}>{capability.copy}</p>
            {capability.variant === "warmth" && <WarmthPreview />}
            {capability.variant === "voice" && <VoicePreview />}
            {capability.variant === "memory" && <MemoryPreview />}
          </article>
        ))}
      </div>
    </section>
  );
}
