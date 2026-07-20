import Link from "next/link";
import { characters } from "@/data/characters";

export default function Home() {
  return (
    <main className="selection-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="selection-shell">
        <header className="selection-header">
          <p className="eyebrow">PAPER HEART · 01</p>
          <h1>今晚，想和谁聊聊？</h1>
          <p className="intro">四种不同的心事回音。选一个人，把今天慢慢说完。</p>
        </header>

        <div className="character-grid" aria-label="可选择的角色">
          {characters.map((character, index) => (
            <Link
              className="character-card"
              href={`/chat/${character.id}`}
              key={character.id}
              style={{ "--accent": character.accent, "--delay": `${index * 70}ms` } as React.CSSProperties}
            >
              <div className="portrait" aria-hidden="true">
                <span>{character.initial}</span>
              </div>
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
          四个人都在等你
        </footer>
      </section>
    </main>
  );
}
