/**
 * Utilities puras para o working_hours JSON. Sem dependência de React.
 * O regex e o shape do JSON devem bater EXATAMENTE com o WorkingHoursSchema
 * do worker (src/admin/schemas.ts no semente-platform-worker).
 *
 * Contrato JSON serializado (ver spec 1B § "Contrato JSON serializado"):
 *   {
 *     "mon": ["09:00-12:00", "14:00-18:00"],
 *     ...
 *     "timezone": "America/Sao_Paulo"
 *   }
 *
 * - Dias inativos: chave AUSENTE (não array vazio).
 * - Pelo menos 1 dia presente.
 * - Cada janela é "HH:MM-HH:MM" 24h.
 */

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

export type Window = { start: string; end: string }; // "HH:MM" cada
export type WorkingHoursState = {
  /** Map de dia → janelas. Dia inativo = key ausente. */
  days: Partial<Record<Day, Window[]>>;
  timezone: string;
};

export type WorkingHoursJSON = Partial<Record<Day, string[]>> & {
  timezone: string;
};

export const TIME_RANGE_REGEX = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;
export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const BR_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Bahia',
  'America/Recife',
  'America/Belem',
  'America/Fortaleza',
  'UTC',
] as const;

export const DAY_LABELS_PT: Record<Day, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

/** Default sane: seg-sex 09:00-12:00 + 14:00-18:00 (sexta 14:00-17:00) em BRT. */
export const DEFAULT_WORKING_HOURS_STATE: WorkingHoursState = {
  days: {
    mon: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    tue: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    wed: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    thu: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    fri: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
  },
  timezone: 'America/Sao_Paulo',
};

/** Converte estado interno do editor pro JSON do contrato. Ordena janelas por start. */
export function serializeWorkingHours(state: WorkingHoursState): WorkingHoursJSON {
  const out: WorkingHoursJSON = { timezone: state.timezone };
  for (const day of DAYS) {
    const windows = state.days[day];
    if (!windows || windows.length === 0) continue; // dia inativo = key ausente
    const sorted = [...windows].sort((a, b) => a.start.localeCompare(b.start));
    out[day] = sorted.map((w) => `${w.start}-${w.end}`);
  }
  return out;
}

/** Inversa: lê JSON do worker e popula estado pro editor. */
export function deserializeWorkingHours(json: WorkingHoursJSON): WorkingHoursState {
  const state: WorkingHoursState = { days: {}, timezone: json.timezone };
  for (const day of DAYS) {
    const ranges = json[day];
    if (!ranges) continue;
    state.days[day] = ranges.map((r) => {
      const [start, end] = r.split('-');
      return { start: start!, end: end! };
    });
  }
  return state;
}

/** Validação client-side. Retorna lista de erros (vazio = válido). */
export function validateWorkingHours(state: WorkingHoursState): string[] {
  const errors: string[] = [];
  const activeDays = DAYS.filter((d) => (state.days[d]?.length ?? 0) > 0);
  if (activeDays.length === 0) {
    errors.push('Pelo menos 1 dia da semana precisa ter janela.');
  }
  if (!state.timezone || state.timezone.length === 0) {
    errors.push('Selecione um fuso horário.');
  }
  for (const day of activeDays) {
    const windows = state.days[day]!;
    windows.forEach((w, i) => {
      if (!TIME_HHMM_REGEX.test(w.start) || !TIME_HHMM_REGEX.test(w.end)) {
        errors.push(`${DAY_LABELS_PT[day]} janela ${i + 1}: formato inválido (use HH:MM).`);
        return;
      }
      if (w.start >= w.end) {
        errors.push(`${DAY_LABELS_PT[day]} janela ${i + 1}: início deve ser antes do fim.`);
      }
    });
  }
  return errors;
}
