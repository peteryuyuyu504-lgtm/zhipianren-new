import CharacterSelection from "@/components/character-selection";
import AuthGuard from "@/components/auth-guard";

export default function CharactersPage() {
  return (
    <AuthGuard>
      <CharacterSelection />
    </AuthGuard>
  );
}
