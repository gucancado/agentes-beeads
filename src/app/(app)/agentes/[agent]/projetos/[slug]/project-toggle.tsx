'use client';

import { useActionState } from 'react';
import { toggleProjectEnabledAction } from './actions';

export function ProjectToggle({
  agent,
  slug,
  initialEnabled,
}: {
  agent: string;
  slug: string;
  initialEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(toggleProjectEnabledAction, null);
  const current = state?.ok && typeof state.enabled === 'boolean' ? state.enabled : initialEnabled;
  const next = !current;

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="agent" value={agent} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="enabled" value={String(next)} />
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide border ${
          current
            ? 'text-ok border-ok/30'
            : 'text-muted-fg border-border bg-muted'
        }`}
        style={current ? { background: 'rgba(31,122,58,0.08)' } : undefined}
      >
        <span
          className={
            current
              ? 'status-pulse size-1.5 rounded-full bg-ok shadow-[0_0_0_3px_rgba(31,122,58,0.15)]'
              : 'size-1.5 rounded-full bg-ink-mute'
          }
        />
        {current ? 'agente ativo' : 'pausado'}
      </span>
      <button
        type="submit"
        disabled={pending}
        className="text-[11px] text-fg underline-honey cursor-pointer disabled:opacity-50"
        title={current ? 'Pausar o agente apenas neste projeto' : 'Reativar o agente para este projeto'}
      >
        {pending ? '...' : current ? 'pausar' : 'reativar'}
      </button>
      {state && !state.ok && (
        <span className="text-[10px] text-err">{state.error}</span>
      )}
    </form>
  );
}
