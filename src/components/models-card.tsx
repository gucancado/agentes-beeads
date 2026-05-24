'use client';

import { useActionState, useState } from 'react';
import type { AgentModels } from '@/lib/registry';
import { MODELS, findModel } from '@/lib/models-catalog';
import { updateAgentModelsAction } from '@/app/(app)/agentes/[agent]/actions';
import { SectionCard } from './section-card';

type Slot = {
  key: keyof AgentModels;
  label: string;
  desc: string;
  swatch: 'classifier' | 'baixo' | 'medio' | 'alto';
};

const SLOTS: Slot[] = [
  { key: 'classifier',      label: 'classifier',       desc: 'JSON estruturado · intent+BANT', swatch: 'classifier' },
  { key: 'responder_baixo', label: 'responder · baixo', desc: 'saudação, escolha de horário, confirmação', swatch: 'baixo' },
  { key: 'responder_medio', label: 'responder · médio', desc: 'conversa geral, perguntas abertas',        swatch: 'medio' },
  { key: 'responder_alto',  label: 'responder · alto',  desc: 'objeções, complexidade alta, lead difícil', swatch: 'alto' },
];

function swatchClass(s: Slot['swatch']) {
  switch (s) {
    case 'classifier': return 'bg-ink';
    case 'baixo':      return 'bg-honey-soft border border-honey';
    case 'medio':      return 'bg-honey';
    case 'alto':       return 'bg-ink border-2 border-honey';
  }
}

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: 'Anthropic',
  google: 'Google',
};

export function ModelsCard({
  agentName,
  models,
}: {
  agentName: string;
  models: AgentModels | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateAgentModelsAction, null);

  if (!models) {
    return (
      <SectionCard title="Modelos por" titleAccent="tier" meta="não configurado">
        <p className="px-5 py-4 text-sm text-ink-soft">
          Adicione a chave <code>models:</code> em <code>agents.yml</code>.
        </p>
      </SectionCard>
    );
  }

  if (!editing) {
    return (
      <SectionCard
        title="Modelos por"
        titleAccent="tier"
        action={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-ink underline-honey cursor-pointer"
          >
            editar →
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {SLOTS.map((s) => {
            const id = models[s.key];
            const info = findModel(id);
            return (
              <div key={s.key} className="flex flex-col gap-1.5 px-5 py-4 border-r border-line last:border-r-0 border-b xl:border-b-0 last:border-b-0">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-mute">
                  <span className={`size-2 rounded-[2px] ${swatchClass(s.swatch)}`} />
                  {s.label}
                </span>
                <span className="font-display italic text-[17px] font-medium leading-tight tracking-tight text-ink">
                  {id}
                </span>
                <span className="text-[11px] text-ink-soft">{s.desc}</span>
                {info && (
                  <span className="text-[10px] text-ink-soft tabular-nums">
                    {PROVIDER_LABEL[info.provider]} · ${info.pricing.in.toFixed(2)}/${info.pricing.out.toFixed(2)} per 1M
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {state?.ok && (
          <div className="px-5 py-2 border-t border-line text-[11px] text-ok bg-ok/5">
            ✓ modelos atualizados em agents.yml — rebuild Coolify (~90s) pra a app pegar a versão nova.
          </div>
        )}
      </SectionCard>
    );
  }

  // edit mode
  return (
    <SectionCard
      title="Modelos por"
      titleAccent="tier · editar"
      meta="muda o agents.yml + auto-deploy"
    >
      <form action={formAction} onSubmit={() => setTimeout(() => setEditing(false), 300)}>
        <input type="hidden" name="agent" value={agentName} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {SLOTS.map((s) => (
            <div key={s.key} className="flex flex-col gap-2 px-5 py-4 border-r border-line last:border-r-0 border-b xl:border-b-0 last:border-b-0">
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-mute">
                <span className={`size-2 rounded-[2px] ${swatchClass(s.swatch)}`} />
                {s.label}
              </span>
              <select
                name={s.key}
                defaultValue={models[s.key]}
                className="font-mono text-xs bg-paper border border-line rounded-sm px-2 py-1.5 outline-none focus:border-honey focus:ring-1 focus:ring-honey text-ink"
              >
                <optgroup label="Anthropic">
                  {MODELS.filter((m) => m.provider === 'anthropic').map((m) => (
                    <option key={m.id} value={m.id}>{m.id} (${m.pricing.in}/${m.pricing.out})</option>
                  ))}
                </optgroup>
                <optgroup label="Google">
                  {MODELS.filter((m) => m.provider === 'google').map((m) => (
                    <option key={m.id} value={m.id}>{m.id} (${m.pricing.in}/${m.pricing.out})</option>
                  ))}
                </optgroup>
              </select>
              <span className="text-[11px] text-ink-soft">{s.desc}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-line gap-3 flex-wrap text-[11px] text-ink-soft">
          <span>
            Salvar commita em <code className="text-honey-deep bg-honey-soft px-1.5 py-0.5 rounded-[2px]">main</code> do agentes-beeads. Coolify reaplica em ~90 s.
          </span>
          <div className="flex items-center gap-2">
            {state && !state.ok && (
              <span className="text-err text-xs">erro: {state.error}</span>
            )}
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs px-3 py-2 text-ink-soft hover:text-ink cursor-pointer"
              disabled={pending}
            >
              cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-sm bg-ink text-white px-4 py-2 font-display text-sm font-medium hover:bg-honey-deep disabled:opacity-60 transition cursor-pointer group"
            >
              <span>{pending ? 'Salvando…' : 'Salvar modelos'}</span>
              <span className="inline-block size-1.5 rounded-full bg-honey group-hover:bg-white transition" />
            </button>
          </div>
        </div>
      </form>
    </SectionCard>
  );
}
