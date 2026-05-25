import { signOut } from '@/lib/auth';

export function Topbar({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-muted px-6 py-3">
      <div className="text-[11px] text-muted-fg tracking-wide">
        Console da plataforma <span className="text-fg">Semente</span>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-[11px] text-muted-fg">
            <span className="text-muted-fg">logado:</span> <span className="text-fg">{userEmail}</span>
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
            className="font-display text-sm text-fg underline-honey cursor-pointer"
          >
            sair →
          </button>
        </form>
      </div>
    </header>
  );
}
