import type { AgentModels } from '@/lib/registry';
import { SectionCard } from './section-card';

const ROLES: Array<{
  key: keyof AgentModels;
  label: string;
  desc: string;
  swatch: 'classifier' | 'baixo' | 'medio' | 'alto';
}> = [
  { key: 'classifier', label: 'classifier', desc: 'JSON estruturado · intent+BANT', swatch: 'classifier' },
  { key: 'responder_baixo', label: 'responder · baixo', desc: 'saudação, escolha de horário, confirmação', swatch: 'baixo' },
  { key: 'responder_medio', label: 'responder · médio', desc: 'conversa geral, perguntas abertas', swatch: 'medio' },
  { key: 'responder_alto', label: 'responder · alto', desc: 'objeções, complexidade alta, lead difícil', swatch: 'alto' },
];

function swatchClass(s: string) {
  switch (s) {
    case 'classifier': return 'bg-ink';
    case 'baixo': return 'bg-honey-soft border border-honey';
    case 'medio': return 'bg-honey';
    case 'alto':  return 'bg-ink border-2 border-honey';
    default: return 'bg-ink-mute';
  }
}

export function ModelsCard({ models, agentSlug }: { models: AgentModels | undefined; agentSlug: string }) {
  if (!models) {
    return (
      <SectionCard title="Modelos por" titleAccent="tier" meta="não configurado">
        <p className="px-5 py-4 text-sm text-ink-soft">
          Adicione a chave <code>models:</code> em <code>agents.yml</code> pra exibir aqui.
        </p>
      </SectionCard>
    );
  }
  return (
    <SectionCard
      title="Modelos por"
      titleAccent="tier"
      action={
        <a
          href={`https://github.com/gucancado/agentes-beeads/blob/main/agents.yml`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-ink underline-honey"
        >
          editar agents.yml →
        </a>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <div key={r.key} className="flex flex-col gap-1.5 px-5 py-4 border-r border-line last:border-r-0 border-b xl:border-b-0 last:border-b-0">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-mute">
              <span className={`size-2 rounded-[2px] ${swatchClass(r.swatch)}`} />
              {r.label}
            </span>
            <span className="font-display italic text-[17px] font-medium leading-tight tracking-tight text-ink">
              {models[r.key]}
            </span>
            <span className="text-[11px] text-ink-soft">{r.desc}</span>
            <span className="self-start mt-1 text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-paper-2 border border-line rounded-[2px] text-ink-soft">
              {agentSlug === 'mercurio' ? 'default' : 'config'}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
