"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { characters } from "@/data/characters";
import { homepageCharacterShowcases } from "./homepage-character-showcase-data";
import styles from "./homepage.module.css";

const theaterRoles = homepageCharacterShowcases.map((showcase) => {
  const character = characters.find(
    (candidate) => candidate.id === showcase.characterId,
  );

  if (!character) {
    throw new Error(`Homepage character not found: ${showcase.characterId}`);
  }

  return { ...showcase, character };
});

type TheaterStyle = CSSProperties & {
  "--theater-accent": string;
};

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function HomepageCharacterTheater() {
  const [selectedId, setSelectedId] = useState(theaterRoles[0].character.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selectedRole =
    theaterRoles.find((role) => role.character.id === selectedId) ??
    theaterRoles[0];

  function selectRole(characterId: string) {
    if (characterId === selectedId) return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setSelectedId(characterId);
  }

  async function toggleVoice() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  }

  const theaterStyle: TheaterStyle = {
    "--theater-accent": selectedRole.character.accent,
  };

  return (
    <section
      className={`${styles.hero} ${styles.characterTheater}`}
      aria-labelledby="homepage-hero-title"
      style={theaterStyle}
    >
      <div className={styles.theaterStage}>
        <div className={styles.theaterBackdrop} key={selectedRole.character.id}>
          <Image
            src={selectedRole.sceneImage}
            alt=""
            fill
            priority
            sizes="(max-width: 680px) 100vw, 1320px"
          />
        </div>
        <div className={styles.theaterVeil} aria-hidden="true" />

        <div className={styles.theaterContent}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.liveDot} aria-hidden="true" />
              先选一个，听听他会怎样和你打招呼
            </p>
            <div className={styles.heroPositioning} aria-label="产品定位">
              <span>AI 男友</span>
              <span>专属声音</span>
              <span>情境陪伴</span>
            </div>
            <h1 id="homepage-hero-title">
              会聊天、会回应，
              <em>也有声音的 AI 男友。</em>
            </h1>
            <p className={styles.heroDescription}>
              选择喜欢的角色，先认识他的性格、声音和生活片段。登录后，就能开始属于你们的真实对话。
            </p>

            <div className={styles.selectedRoleSummary} key={selectedRole.character.id}>
              <span>{selectedRole.sceneLabel}</span>
              <strong>
                {selectedRole.character.name}
                <small>{selectedRole.character.occupation}</small>
              </strong>
              <p>{selectedRole.character.tagline}</p>
            </div>

            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/register">
                和{selectedRole.character.name}免费聊天
                <span aria-hidden="true">↗</span>
              </Link>
              <Link className={styles.secondaryCta} href="#characters">
                查看全部角色 <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className={styles.heroNote}>
              <span className={styles.noteMark} aria-hidden="true">✓</span>
              <span>当前区域为角色展示，真实聊天将在登录后开始</span>
            </div>
          </div>

          <article
            className={styles.showcasePanel}
            aria-label={`${selectedRole.character.name}的角色展示`}
          >
            <div className={styles.showcaseHeader}>
              <div className={styles.showcaseAvatar}>
                <Image
                  src={selectedRole.character.image}
                  alt={`${selectedRole.character.name}的头像`}
                  fill
                  sizes="52px"
                />
              </div>
              <div>
                <strong>{selectedRole.character.name}</strong>
                <span><i aria-hidden="true" />在线</span>
              </div>
              <small>角色片段</small>
            </div>

            <div className={styles.showcasePrompt}>{selectedRole.userPrompt}</div>

            <div className={styles.showcaseReply}>
              <div className={styles.replyAvatar} aria-hidden="true">
                {selectedRole.character.initial}
              </div>
              <div>
                <p>{selectedRole.introduction}</p>
                <span className={styles.voiceLabel}>AI 合成语音</span>
                <button
                  className={styles.voicePlayer}
                  type="button"
                  onClick={toggleVoice}
                  aria-label={`${isPlaying ? "暂停" : "播放"}${selectedRole.character.name}的声音样例`}
                >
                  <span className={styles.voicePlayerIcon} aria-hidden="true">
                    {isPlaying ? "Ⅱ" : "▶"}
                  </span>
                  <span className={styles.voicePlayerTrack} aria-hidden="true">
                    <span style={{ width: `${progress * 100}%` }} />
                    <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </span>
                  <small>{formatDuration(duration)}</small>
                </button>
              </div>
            </div>

            <p className={styles.stageDirection}>{selectedRole.stageDirection}</p>

            <figure className={styles.showcaseScene} key={selectedRole.sceneImage}>
              <Image
                src={selectedRole.sceneImage}
                alt={`${selectedRole.character.name}的 AI 情境照片：${selectedRole.sceneCaption}`}
                fill
                sizes="(max-width: 680px) 86vw, 390px"
              />
              <figcaption>
                <span>{selectedRole.sceneCaption}</span>
                <small>▣ AI 情境照片</small>
              </figcaption>
            </figure>

            <audio
              key={selectedRole.voiceUrl}
              ref={audioRef}
              src={selectedRole.voiceUrl}
              preload="metadata"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setProgress(0)}
              onTimeUpdate={(event) => {
                const audio = event.currentTarget;
                setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
              }}
            />
          </article>
        </div>

        <div className={styles.roleSelector} aria-label="选择要预览的角色">
          {theaterRoles.map((role) => {
            const isSelected = role.character.id === selectedRole.character.id;
            return (
              <button
                key={role.character.id}
                className={styles.roleSelectorCard}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectRole(role.character.id)}
              >
                <Image
                  src={role.character.image}
                  alt=""
                  fill
                  sizes="(max-width: 680px) 44vw, 300px"
                />
                <span aria-hidden="true" />
                <strong>{role.character.name}</strong>
                <small>{role.character.occupation}</small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
