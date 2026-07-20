import { notFound } from "next/navigation";
import { characters, getCharacter } from "@/data/characters";
import ChatRoom from "./chat-room";

export function generateStaticParams() {
  return characters.map((character) => ({ id: character.id }));
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = getCharacter(id);

  if (!character) notFound();

  return <ChatRoom character={character} />;
}
