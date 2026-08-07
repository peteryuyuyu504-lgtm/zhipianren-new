import styles from "./homepage.module.css";

const features = [
  {
    mark: "01",
    title: "有性格的回应",
    copy: "每个角色都有自己的语气、生活和相处节奏，不是换一张头像而已。",
  },
  {
    mark: "02",
    title: "文字，也可以有声音",
    copy: "想认真打字时就打字，想听听他的声音时，也可以切换到语音陪伴。",
  },
  {
    mark: "03",
    title: "在你的节奏里",
    copy: "不催促、不打断。把每次聊天留给你真正想说的事情。",
  },
];

export function HomepageFeatures() {
  return (
    <section className={styles.featuresSection} id="features" aria-labelledby="features-title">
      <div className={styles.featuresHeading}>
        <p className={styles.eyebrow}>MADE FOR SMALL MOMENTS</p>
        <h2 id="features-title">一些让关系变得自然的细节。</h2>
      </div>
      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <article className={styles.featureCard} key={feature.mark}>
            <span className={styles.featureMark}>{feature.mark}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
