import Image from "next/image";
import Link from "next/link";
import { characters } from "@/data/characters";

export default function CharacterSelection() {
  return (
    // 角色选择组件负责展示四位角色，并将用户带入对应的一对一聊天页。
    <main className="selection-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="selection-shell">
        <header className="selection-header">
          <p className="eyebrow">选择倾听者</p>
          <h1>今天想让谁陪你说话？</h1>
          <p className="intro">4 位角色当前使用 Mock 数据。选择一位进入聊天页，发出你的第一句话。</p>
        </header>

        <div className="character-grid" aria-label="可选择的角色">
          {characters.map((character, index) => (
            <Link
              className="character-card"
              href={`/chat/${character.id}`}
              key={character.id}
              style={{ "--accent": character.accent, "--delay": `${index * 70}ms` } as React.CSSProperties}
            >
              <div className="portrait">
                <Image
                  src={character.image}
                  alt={`${character.name}的角色肖像`}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 560px) 118px, (max-width: 900px) 50vw, 25vw"
                />
              </div>
              {/* 当前仅展示静态状态，后续再替换为真实在线状态。 */}
              <span className={`availability-badge ${character.isOnline ? "online" : "offline"}`}>
                <i aria-hidden="true" />
                {character.isOnline ? "在线" : "离线"}
              </span>
              <div className="card-copy">
                <p className="occupation">{character.occupation}</p>
                <h2>{character.name}</h2>
                <p className="tagline">{character.tagline}</p>
                <div className="tags" aria-label="性格标签">
                  {character.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <span className="enter-label">和他聊聊 <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>

        <footer className="selection-footer">
          <span className="status-dot" />
          角色与回复当前均为本地 Mock 数据
        </footer>
      </section>
    </main>
  );
}
