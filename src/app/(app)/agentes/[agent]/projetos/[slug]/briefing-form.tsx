'use client';

import { useActionState } from 'react';
import { saveBriefingAction } from './actions';

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
    <form action={formAction}>
      <input type="hidden" name="agent" value={agent} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="content"
        defaultValue={initialContent}
        rows={22}
        spellCheck
        className="block w-full bg-paper text-ink font-mono text-xs leading-7 px-5 py-4 outline-none resize-y min-h-[260px] border-b border-border focus:bg-white"
      />
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-[11px] text-muted-fg flex-wrap">
        <span>
          commit direto em{' '}
          <code className="text-honey-deep bg-honey-soft px-1.5 py-0.5 rounded-[2px]">master</code>
          {' '}· auto-deploy ≈ 90 s
        </span>
        <div className="flex items-center gap-3">
          {state?.ok && <span className="text-ok text-xs">✓ salvo e commitado</span>}
          {state && !state.ok && <span className="text-err text-xs">erro: {state.error}</span>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-sm bg-ink text-white px-4 py-2 font-display text-sm font-medium hover:bg-honey-deep disabled:opacity-60 transition cursor-pointer group"
          >
            <span>{pending ? 'Salvando…' : 'Salvar briefing'}</span>
            <span className="inline-block size-1.5 rounded-full bg-honey group-hover:bg-white transition" />
          </button>
        </div>
      </div>
    </form>
  );
}
