import { signIn } from '@/lib/auth';
import { HexLogo } from '@/components/hex-logo';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <HexLogo size={28} />
          <span className="font-display text-2xl font-medium tracking-tight text-ink">
            agentes<span className="italic text-honey-deep">·</span>beeads
          </span>
        </div>
        <div className="rounded-md border border-line bg-card p-6 shadow-[0_1px_0_rgba(10,10,10,0.04),0_4px_14px_rgba(10,10,10,0.04)]">
          <h1 className="mb-4 font-display text-lg font-medium tracking-tight">Entrar</h1>
          <form
            action={async (formData: FormData) => {
              'use server';
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirectTo: '/agentes',
              });
            }}
            className="flex flex-col gap-3"
          >
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-mute">
              email
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-honey focus:ring-1 focus:ring-honey font-mono normal-case tracking-normal"
              />
            </label>
            <label className="text-[10px] uppercase tracking-[0.2em] text-ink-mute">
              senha
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-honey focus:ring-1 focus:ring-honey font-mono normal-case tracking-normal"
              />
            </label>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-sm bg-ink px-4 py-2.5 font-display text-sm font-medium text-white hover:bg-honey-deep transition group cursor-pointer"
            >
              <span>Entrar</span>
              <span className="inline-block size-1.5 rounded-full bg-honey group-hover:bg-white transition" />
            </button>
          </form>
        </div>
        <p className="mt-4 text-[10px] text-ink-mute tracking-wide">
          single-user console &middot; plataforma Semente
        </p>
      </div>
    </main>
  );
}
