'use client';

import { useActionState } from 'react';
import { saveBriefingAction } from './actions';
import { Button } from '@/components/ui/button';

export function BriefingForm({
  agent,
  slug,
  initialContent,
}: {
  agent: string;
  slug: string;
  initialContent: string;
}) {
  const [state, formAction, pending] = useActionState(saveBriefingAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="agent" value={agent} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="content"
        defaultValue={initialContent}
        rows={26}
        spellCheck
        className="w-full rounded border bg-white p-3 font-mono text-xs leading-5 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Markdown bruto. Commit direto em <code>master</code>; Coolify auto-deploya o agente.
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar briefing'}
        </Button>
      </div>
      {state?.ok && (
        <p className="text-xs text-emerald-600">Salvo e commitado.</p>
      )}
      {state && !state.ok && (
        <p className="text-xs text-rose-600">Erro: {state.error}</p>
      )}
    </form>
  );
}
