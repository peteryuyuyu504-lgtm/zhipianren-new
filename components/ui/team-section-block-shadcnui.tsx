import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { characters } from "@/data/characters";

type TeamSectionBlockProps = {
  variant?: "preview" | "selection";
};

export function TeamSectionBlock({
  variant = "selection",
}: TeamSectionBlockProps) {
  const isPreview = variant === "preview";

  return (
    <div
      className={`companion-team-block companion-team-block-${variant}`}
      aria-label={isPreview ? "陪伴角色预览" : "选择陪伴角色"}
    >
      <div className="companion-team-grid">
        {characters.map((character, index) => {
          const content = (
            <>
              <div className="companion-team-portrait">
                <Image
                  src={character.image}
                  alt={`${character.name}的角色肖像`}
                  fill
                  priority={index < 2}
                  sizes={
                    isPreview
                      ? "(max-width: 520px) 38vw, 150px"
                      : "(max-width: 560px) 42vw, (max-width: 900px) 50vw, 25vw"
                  }
                />
                <span className="companion-team-shade" aria-hidden="true" />
                <span
                  className={`companion-team-status ${
                    character.isOnline ? "online" : "offline"
                  }`}
                >
                  <i aria-hidden="true" />
                  {character.isOnline ? "在线" : "稍后见"}
                </span>
              </div>

              <div className="companion-team-copy">
                <p>{character.occupation}</p>
                <h2>{character.name}</h2>
                {!isPreview && <blockquote>{character.tagline}</blockquote>}
                <div className="companion-team-tags" aria-label="性格标签">
                  {character.tags.slice(0, isPreview ? 1 : 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              {!isPreview && (
                <span className="companion-team-enter">
                  进入会话 <span aria-hidden="true">↗</span>
                </span>
              )}
            </>
          );

          const style = {
            "--team-accent": character.accent,
            "--team-index": index,
          } as CSSProperties;

          return isPreview ? (
            <article
              className="companion-team-card"
              key={character.id}
              style={style}
            >
              {content}
            </article>
          ) : (
            <Link
              className="companion-team-card"
              href={`/chat/${character.id}`}
              key={character.id}
              style={style}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
