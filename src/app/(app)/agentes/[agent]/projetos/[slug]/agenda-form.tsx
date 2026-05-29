'use client';

import { useActionState, useEffect } from 'react';
import { saveAgendaAction, type ActionResult } from './scheduling-actions';
import { WorkingHoursEditor } from './working-hours-editor';
import { CalendarPicker } from './calendar-picker';
import type { SchedulingAgenda } from '@/lib/worker-admin-client';

type Props = {
  agent: string;
  slug: string;
  mode: 'create' | 'edit';
  agenda?: SchedulingAgenda;
  googleConnected: boolean;
  onSuccess?: () => void;
};

export function AgendaForm({ agent, slug, mode, agenda, googleConnected, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveAgendaAction,
    null
  );

  useEffect(() => {
    if (state?.ok && onSuccess) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4 px-5 py-4">
      <input type="hidden" name="agent" value={agent} />
      <input type="hidden" name="slug" value={slug} />
      {mode === 'edit' && agenda && (
        <>
          <input type="hidden" name="agenda_id" value={agenda.id} />
          <input type="hidden" name="if_match_updated_at" value={agenda.updated_at} />
        </>
      )}

      <div className="space-y-1">
        <label htmlFor="person_name" className="text-sm font-medium text-fg">
          Nome interno
        </label>
        <input
          id="person_name"
          name="person_name"
          type="text"
          required
          minLength={1}
          maxLength={200}
          defaultValue={agenda?.person_name ?? ''}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        />
        <p className="text-xs text-muted-fg">Uso administrativo. Não aparece no chat.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="person_email" className="text-sm font-medium text-fg">
          Calendar Google
        </label>
        <CalendarPicker
          agent={agent}
          slug={slug}
          name="person_email"
          initialValue={agenda?.person_email}
          googleConnected={googleConnected}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="display_label" className="text-sm font-medium text-fg">
          Como o agente se refere a essa pessoa no chat
        </label>
        <input
          id="display_label"
          name="display_label"
          type="text"
          required
          minLength={1}
          maxLength={200}
          defaultValue={agenda?.display_label ?? ''}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        />
        <p className="text-xs text-muted-fg">Ex: &quot;o time comercial&quot;, &quot;nossa Dra. Ana&quot;.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium text-fg">
          Descrição (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={agenda?.description ?? ''}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        />
        <p className="text-xs text-muted-fg">
          Reservado pra uso futuro (round_robin/by_specialty). No modo single, não tem efeito.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-fg">Horários de trabalho</label>
        <WorkingHoursEditor initialValue={agenda?.working_hours} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="meeting_duration_min" className="text-sm font-medium text-fg">
            Duração (min)
          </label>
          <input
            id="meeting_duration_min"
            name="meeting_duration_min"
            type="number"
            min={5}
            max={480}
            defaultValue={agenda?.meeting_duration_min ?? 30}
            className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="min_advance_hours" className="text-sm font-medium text-fg">
            Antec. mín. (h)
          </label>
          <input
            id="min_advance_hours"
            name="min_advance_hours"
            type="number"
            min={0}
            max={168}
            defaultValue={agenda?.min_advance_hours ?? 4}
            className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="max_advance_business_days" className="text-sm font-medium text-fg">
            Antec. máx. (dias úteis)
          </label>
          <input
            id="max_advance_business_days"
            name="max_advance_business_days"
            type="number"
            min={1}
            max={60}
            defaultValue={agenda?.max_advance_business_days ?? 10}
            className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
          />
        </div>
      </div>

      {state && !state.ok && (
        <div className="rounded border border-danger bg-danger/5 p-3 text-sm text-danger" role="alert">
          {state.error === 'stale_write' && (
            <span>
              Esta agenda foi editada por outra pessoa enquanto você estava aqui. Recarregue
              pra ver a versão atual.
            </span>
          )}
          {state.error === 'worker_timeout' && (
            <span>Agendamento indisponível agora. Tente novamente em alguns segundos.</span>
          )}
          {state.error === 'worker_unreachable' && (
            <span>Não foi possível contactar o serviço de agendamento.</span>
          )}
          {state.error === 'validation_failed' && (
            <span>Algum campo está inválido. Confira os horários e tente de novo.</span>
          )}
          {!['stale_write', 'worker_timeout', 'worker_unreachable', 'validation_failed'].includes(
            state.error
          ) && <span>Erro: {state.error}</span>}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-honey-deep px-4 py-2 text-sm font-medium text-paper hover:bg-honey disabled:opacity-50"
        >
          {pending ? 'Salvando...' : mode === 'create' ? 'Cadastrar agenda' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
