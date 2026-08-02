import AuthGuard from "@/components/auth-guard";
import PasskeyManager from "@/components/passkey-manager";

export default function AccountSecurityPage() {
  return (
    <AuthGuard>
      <PasskeyManager />
    </AuthGuard>
  );
}
