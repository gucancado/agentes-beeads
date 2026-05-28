import type { AgendaCreateBody, AgendaPatchBody } from './worker-admin-client.js';
import type { WorkingHoursJSON } from './working-hours.js';

/**
 * Lê FormData de <AgendaForm> e devolve payload pronto pra worker.
 * Modo "create" devolve AgendaCreateBody; "edit" devolve AgendaPatchBody + agendaId.
 *
 * Lança Error se algum campo obrigatório está vazio ou inválido — server action
 * pega e devolve { ok:false, error:'invalid_form' }. Validação detalhada acontece
 * no Zod do worker (defesa em profundidade).
 */
export function parseAgendaForm(formData: FormData): {
  mode: 'create';
  body: AgendaCreateBody;
} | {
  mode: 'edit';
  agendaId: number;
  body: AgendaPatchBody;
} {
  const agendaIdRaw = formData.get('agenda_id');
  const agendaId = agendaIdRaw ? Number(agendaIdRaw) : null;

  const person_name = String(formData.get('person_name') ?? '').trim();
  const person_email = String(formData.get('person_email') ?? '').trim();
  const display_label = String(formData.get('display_label') ?? '').trim();
  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const description: string | null = descriptionRaw.length > 0 ? descriptionRaw : null;
  const workingHoursRaw = String(formData.get('working_hours') ?? '');
  if (!workingHoursRaw) throw new Error('working_hours ausente');
  const working_hours = JSON.parse(workingHoursRaw) as WorkingHoursJSON;

  const meeting_duration_min = Number(formData.get('meeting_duration_min') ?? 30);
  const min_advance_hours = Number(formData.get('min_advance_hours') ?? 4);
  const max_advance_business_days = Number(formData.get('max_advance_business_days') ?? 10);

  if (agendaId) {
    const if_match_updated_at = String(formData.get('if_match_updated_at') ?? '') || undefined;
    return {
      mode: 'edit',
      agendaId,
      body: {
        person_name,
        person_email,
        display_label,
        description,
        working_hours,
        meeting_duration_min,
        min_advance_hours,
        max_advance_business_days,
        if_match_updated_at,
      },
    };
  }

  return {
    mode: 'create',
    body: {
      person_name,
      person_email,
      display_label,
      description,
      working_hours,
      meeting_duration_min,
      min_advance_hours,
      max_advance_business_days,
    },
  };
}
