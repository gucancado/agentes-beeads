import { Suspense } from 'react';
import { Button } from '@beeads/ui';
import { getAuthUser } from '@/lib/auth';
import {
  getProjectDetail,
  createProject,
  WorkerAdminError,
  type SchedulingAgenda,
  type ProjectGoal,
} from '@/lib/worker-admin-client';
import {
  enableSchedulingAction,
  disableSchedulingAction,
} from './scheduling-actions';
import { AgendaForm } from './agenda-form';
import { AgendaCard } from './agenda-card';
import { SchedulingErrorBoundary } from './scheduling-error-boundary';
import { GoogleConnectionCard } from './google-connection-card';
import type { GoogleConnectionPublic } from '@/lib/worker-admin-client';

type Props = { agent: string; slug: string; displayName: string };

async function ensureProjectExists(
  agent: string,
  slug: string,
  displayName: string,
  actingUser: string | null
): Promise<{ goals: ProjectGoal[]; agendas: SchedulingAgenda[]; google_connection: GoogleConnectionPublic | null }> {
  // Tenta GET primeiro; só cria se 404. Evita writes em loads repetidos.
  try {
    const detail = await getProjectDetail(agent, slug, { actingUser: actingUser ?? undefined });
    return { goals: detail.goals, agendas: detail.agendas, google_connection: detail.google_connection };
  } catch (e) {
    if (e instanceof WorkerAdminError && e.status === 404) {
      await createProject({ agent, slug, display_name: displayName }, { actingUser: actingUser ?? undefined });
      const detail = await getProjectDetail(agent, slug, { actingUser: actingUser ?? undefined });
      return { goals: detail.goals, agendas: detail.agendas, google_connection: detail.google_connection };
    }
    throw e;
  }
}

async function SchedulingTabInner({ agent, slug, displayName }: Props) {
  const user = await getAuthUser();
  const actingUser = user?.email ?? null;

  const { goals, agendas, google_connection } = await ensureProjectExists(agent, slug, displayName, actingUser);

  const schedulingGoal = goals.find((g) => g.goal_type === 'scheduling' && g.enabled);
  const activeAgendas = agendas.filter((a) => a.active);

  // ── Estado 1: goal não habilitado ──
  if (!schedulingGoal) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <h3 className="text-base font-medium text-fg">
              Agendamento de reuniões via WhatsApp
            </h3>
          </div>
          <p className="text-sm text-muted-fg">
            Permite que o agente proponha horários e marque reuniões diretamente no Google Calendar.
          </p>
          <ul className="text-sm text-muted-fg space-y-1 pl-4">
            <li>• Agente lê freebusy do calendar do profissional</li>
            <li>• Cria evento com Google Meet automaticamente</li>
            <li>• Envia convite por email pro lead</li>
          </ul>
          <form
            action={async () => {
              'use server';
              await enableSchedulingAction(agent, slug);
            }}
          >
            <Button type="submit">Habilitar agendamento</Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Estado 2: goal habilitado, zero agendas ativas ──
  if (activeAgendas.length === 0) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h3 className="text-base font-medium text-fg">Você habilitou agendamento</h3>
          <p className="text-sm text-muted-fg">
            Agora cadastre quem vai atender as reuniões.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <AgendaForm agent={agent} slug={slug} mode="create" />
        </div>
      </div>
    );
  }

  // ── Estado 3: goal habilitado + agendas ativas ──
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
            Agendamento ativo
          </span>
        </div>
        <form
          action={async () => {
            'use server';
            await disableSchedulingAction(agent, slug, schedulingGoal.updated_at);
          }}
        >
          <Button variant="ghost" size="sm" type="submit">
            Desabilitar goal
          </Button>
        </form>
      </div>

      <GoogleConnectionCard agent={agent} slug={slug} connection={google_connection} />

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-fg">Agendas</h3>
        {activeAgendas.map((agenda) => (
          <AgendaCard key={agenda.id} agent={agent} slug={slug} agenda={agenda} />
        ))}
      </div>
    </div>
  );
}

export function SchedulingTab(props: Props) {
  return (
    <SchedulingErrorBoundary>
      <Suspense fallback={<div className="text-sm text-muted-fg">Carregando agendamento...</div>}>
        <SchedulingTabInner {...props} />
      </Suspense>
    </SchedulingErrorBoundary>
  );
}
