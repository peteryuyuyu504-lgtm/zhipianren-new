import Image from "next/image";
import styles from "./homepage.module.css";

export function HomepageVisualMoment() {
  return (
    <section
      className={`${styles.marketingSection} ${styles.visualMomentSection}`}
      id="visual-moment"
      aria-labelledby="visual-moment-title"
    >
      <div className={styles.visualMomentHeading}>
        <div>
          <p className={styles.eyebrow}>A MOMENT FROM HIS DAY</p>
          <span className={styles.visualMomentLabel}>有画面</span>
          <h2 id="visual-moment-title">他不只是回复你，<br />也会分享他的此刻。</h2>
        </div>
        <p>根据聊天内容生成属于他的生活瞬间，让虚拟陪伴更加真实。</p>
      </div>

      <div className={styles.visualMomentCase}>
        <div className={styles.visualMomentCaseHeader}>
          <div><i /><span>产品能力示意</span></div>
          <p>角色设定 <i /> 当前对话 <i /> 场景描述</p>
          <small>CONTEXT TO IMAGE</small>
        </div>

        <div className={styles.visualMomentLayout}>
          <div className={styles.visualMomentChat}>
            <div className={styles.visualChatIdentity}>
              <span>舟</span>
              <div><strong>沈清舟</strong><small>独立书店主理人 · 在线</small></div>
              <i aria-label="在线" />
            </div>

            <div className={styles.visualChatStream}>
              <div className={styles.visualUserMessage}>
                <small>你</small>
                <p>你现在在干嘛？</p>
              </div>
              <div className={styles.visualAiMessage}>
                <span>舟</span>
                <div><small>沈清舟</small><p>刚忙完，在咖啡店坐了一会。</p></div>
              </div>
              <div className={styles.visualGeneratingNote}>
                <span aria-hidden="true">✦</span>
                <p><strong>他发来一张照片</strong><small>根据刚刚的聊天生成</small></p>
              </div>
            </div>

            <div className={styles.visualContextTags} aria-label="图片生成参考信息">
              <span>角色外貌</span>
              <span>日常穿着</span>
              <span>雨后咖啡店</span>
            </div>
          </div>

          <div className={styles.visualMomentConnector} aria-hidden="true">
            <span>由此刻生成</span>
            <i>→</i>
          </div>

          <figure className={styles.visualMomentImage}>
            <Image
              src="/homepage/scenes/shen-qingzhou.png"
              alt="沈清舟独自在雨后书店咖啡空间里休息的生活情境"
              fill
              sizes="(max-width: 680px) calc(100vw - 56px), 680px"
            />
            <div className={styles.visualImageBadge}>
              <i /> AI 情境图片
            </div>
            <figcaption>
              <div><strong>沈清舟的此刻</strong><span>雨后的书店，刚结束一天的工作</span></div>
              <small>刚刚分享</small>
            </figcaption>
          </figure>
        </div>
      </div>

      <p className={styles.visualMomentFootnote}>
        <span aria-hidden="true">◒</span>
        每一张画面都围绕 AI 角色本人生成，延续他的外貌、性格与正在发生的对话。
      </p>
    </section>
  );
}
