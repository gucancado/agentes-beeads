'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@beeads/ui';
import { deactivateAgendaAction } from './scheduling-actions';
import { AgendaTestAccessButton } from './agenda-test-access-button';
import { AgendaFormModal } from './agenda-form-modal';
import type { SchedulingAgenda } from '@/lib/worker-admin-client';
import { DAY_LABELS_PT, type Day } from '@/lib/working-hours';

function summarizeHours(wh: SchedulingAgenda['working_hours']): string {
  const days: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const active = days.filter((d) => wh[d] && (wh[d] as string[]).length > 0);
  if (active.length === 0) return 'Nenhum dia configurado';
  const summary = active
    .map((d) => `${DAY_LABELS_PT[d].slice(0, 3)} ${(wh[d] as string[]).join(', ')}`)
    .join(' • ');
  return `${summary} (${wh.timezone})`;
}

export function AgendaCard({
  agent,
  slug,
  agenda,
  googleConnected,
}: {
  agent: string;
  slug: string;
  agenda: SchedulingAgenda;
  googleConnected: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeactivate() {
    setDeactivateError(null);
    startTransition(async () => {
      const result = await deactivateAgendaAction(agent, slug, agenda.id, agenda.updated_at);
      if (result.ok) {
        setConfirmOpen(false);
      } else {
        setDeactivateError(
          result.error === 'stale_write'
            ? 'Esta agenda foi editada por outra pessoa. Recarregue a página.'
            : result.error === 'worker_timeout' || result.error === 'worker_unreachable'
              ? 'Serviço de agendamento indisponível. Tente novamente.'
              : `Erro: ${result.error}`
        );
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-fg">
            {agenda.person_name} <span className="text-muted-fg">— {agenda.person_email}</span>
          </h4>
          <p className="text-xs text-muted-fg">
            Aparece pro lead como: &quot;{agenda.display_label}&quot;
          </p>
          <p className="text-xs text-muted-fg">{summarizeHours(agenda.working_hours)}</p>
          <p className="text-xs text-muted-fg">
            {agenda.meeting_duration_min}min • antec. {agenda.min_advance_hours}h–
            {agenda.max_advance_business_days}d úteis
          </p>
          <div className="pt-2">
            <AgendaTestAccessButton
              agent={agent}
              slug={slug}
              agendaId={agenda.id}
              personEmail={agenda.person_email}
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Desativar
          </Button>
        </div>
      </div>

      <AgendaFormModal
        agent={agent}
        slug={slug}
        mode="edit"
        agenda={agenda}
        googleConnected={googleConnected}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar agenda?</AlertDialogTitle>
            <AlertDialogDescription>
              A agenda fica oculta pro agente, mas histórico de reuniões agendadas é preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deactivateError && (
            <div className="rounded border border-danger bg-danger/5 p-3 text-sm text-danger" role="alert">
              {deactivateError}
            </div>
          )}
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button onClick={handleDeactivate} disabled={isPending}>{isPending ? 'Desativando...' : 'Desativar'}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
