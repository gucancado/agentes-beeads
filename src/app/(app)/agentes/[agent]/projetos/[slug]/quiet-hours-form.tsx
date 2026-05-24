'use client';

import { useActionState } from 'react';
import { saveQuietHoursAction } from './actions';

export function QuietHoursForm({
  agent,
  slug,
  initialEnabled,
  initialStart,
  initialEnd,
  initialTz,
}: {
  agent: string;
  slug: string;
  initialEnabled: boolean;
  initialStart: string; // HH:MM ou HH:MM:SS
  initialEnd: string;
  initialTz: string;
}) {
  const [state, formAction, pending] = useActionState(saveQuietHoursAction, null);

  // <input type="time"> espera HH:MM, descarta segundos
  const startHHMM = initialStart.slice(0, 5);
  const endHHMM = initialEnd.slice(0, 5);

  return (
    <form action={formAction} className="px-5 py-4 space-y-4">
      <input type="hidden" name="agent" value={agent} />
      <input type="hidden" name="slug" value={slug} />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initialEnabled}
          className="size-4 accent-honey-deep"
        />
        <span className="text-sm text-ink">
          Ativar quiet hours
          <span className="text-ink-soft text-[11px] ml-2">
            (agente não responde nessa janela; enfileira pra responder no fim)
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-mute">Início</span>
          <input
            type="time"
            name="start"
            defaultValue={startHHMM}
            required
            className="mt-1 block w-full bg-paper text-ink font-mono text-sm px-3 py-2 border border-line rounded-sm focus:border-honey-deep focus:bg-white outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-mute">Fim</span>
          <input
            type="time"
            name="end"
            defaultValue={endHHMM}
            required
            className="mt-1 block w-full bg-paper text-ink font-mono text-sm px-3 py-2 border border-line rounded-sm focus:border-honey-deep focus:bg-white outline-none"
          />
        </label>
      </div>

      <p className="text-[11px] text-ink-soft">
        Fuso horário: <code>{initialTz}</code>. Janelas cruzando meia-noite (ex: 23:00 → 07:00) são
        suportadas.
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-[11px] text-ink-soft">
          Aplica imediatamente. Para testar com agente respondendo na hora, desligue temporariamente.
        </div>
        <div className="flex items-center gap-3">
          {state?.ok && <span className="text-ok text-xs">✓ salvo</span>}
          {state && !state.ok && <span className="text-err text-xs">erro: {state.error}</span>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-sm bg-ink text-white px-4 py-2 font-display text-sm font-medium hover:bg-honey-deep disabled:opacity-60 transition cursor-pointer group"
          >
            <span>{pending ? 'Salvando…' : 'Salvar'}</span>
            <span className="inline-block size-1.5 rounded-full bg-honey group-hover:bg-white transition" />
          </button>
        </div>
      </div>
    </form>
  );
}
