import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { characters } from "@/data/characters";
import styles from "./homepage.module.css";

export function HomepageCharacterEntry() {
  return (
    <section className={styles.characterSection} id="characters" aria-labelledby="characters-title">
      <div className={styles.sectionIntroInline}>
        <div>
          <p className={styles.eyebrow}>MEET YOUR COMPANION</p>
          <h2 id="characters-title">先选一个，<br />让他记住你。</h2>
        </div>
        <Link className={styles.sectionLink} href="/login?next=/characters">
          查看全部角色 <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className={styles.characterGrid}>
        {characters.map((character, index) => (
          <Link
            className={styles.characterCard}
            href="/login?next=/characters"
            key={character.id}
            style={{ "--character-accent": character.accent } as CSSProperties}
          >
            <div className={styles.characterPortrait}>
              <Image
                src={character.image}
                alt={`${character.name}的角色头像`}
                fill
                priority={index === 0}
                sizes="(max-width: 680px) 42vw, 220px"
              />
              <span className={styles.characterStatus}>
                <i />{character.isOnline ? "在线" : "稍后见"}
              </span>
            </div>
            <div className={styles.characterCopy}>
              <span>{character.occupation}</span>
              <h3>{character.name}</h3>
              <p>{character.tagline}</p>
              <div className={styles.characterTags}>
                {character.tags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
