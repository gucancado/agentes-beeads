import { signOut } from '@/lib/auth';

export function Topbar({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-paper-2 px-6 py-3">
      <div className="text-[11px] text-ink-soft tracking-wide">
        Console da plataforma <span className="text-ink">Semente</span>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-[11px] text-ink-soft">
            <span className="text-ink-mute">logado:</span> <span className="text-ink">{userEmail}</span>
          </span>
        )}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="font-display text-sm text-ink underline-honey cursor-pointer"
          >
            sair →
          </button>
        </form>
      </div>
    </header>
  );
}
