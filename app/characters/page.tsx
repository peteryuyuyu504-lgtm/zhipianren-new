import CharacterSelection from "@/components/character-selection";
import MockAuthGuard from "@/components/mock-auth-guard";

export default function CharactersPage() {
  return (
    <MockAuthGuard>
      <CharacterSelection />
    </MockAuthGuard>
  );
}
