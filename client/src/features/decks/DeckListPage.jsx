import { useAuth } from '@/features/auth/AuthContext.jsx';
import { useLogout } from '@/features/auth/api.js';
import { Button } from '@/components/ui/button';

export default function DeckListPage() {
  const { user } = useAuth();
  const logout = useLogout();
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Your Decks</h1>
      <p className="text-muted-foreground">
        Signed in as {user?.displayName} ({user?.email})
      </p>
      <Button variant="outline" onClick={() => logout.mutate()}>
        Log out
      </Button>
    </div>
  );
}
