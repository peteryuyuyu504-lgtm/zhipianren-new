import Link from "next/link";
import { characters, getCharacter } from "@/data/characters";
import AuthGuard from "@/components/auth-guard";
import ChatRoom from "./chat-room";

export function generateStaticParams() {
  return characters.map((character) => ({ id: character.id }));
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = getCharacter(id);

  return (
    <AuthGuard>
      {character ? (
        <ChatRoom character={character} />
      ) : (
        <main className="not-found-page">
          <p>没有找到这个角色。</p>
          <Link href="/characters">返回角色选择页</Link>
        </main>
      )}
    </AuthGuard>
  );
}
