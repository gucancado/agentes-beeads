import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function Topbar({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <span className="text-sm font-medium text-slate-700">agentes-beeads</span>
      <div className="flex items-center gap-3">
        {userEmail && <span className="text-xs text-slate-500">{userEmail}</span>}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
