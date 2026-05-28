import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  serializeWorkingHours,
  WorkingHoursState,
  DEFAULT_WORKING_HOURS_STATE,
} from '../../src/lib/working-hours.js';

// ── COPY OF WORKER SCHEMA (semente-platform-worker/src/admin/schemas.ts) ──
// Mantém em sync manualmente. Mudou o worker? Espelha aqui ou esse test
// quebra propositalmente.

const TimeRangeRegex = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;
const TimeRange = z.string().regex(TimeRangeRegex, 'use HH:MM-HH:MM 24h');

const WorkerWorkingHoursSchema = z
  .object({
    mon: z.array(TimeRange).optional(),
    tue: z.array(TimeRange).optional(),
    wed: z.array(TimeRange).optional(),
    thu: z.array(TimeRange).optional(),
    fri: z.array(TimeRange).optional(),
    sat: z.array(TimeRange).optional(),
    sun: z.array(TimeRange).optional(),
    timezone: z.string().min(1),
  })
  .refine(
    (h) => !!(h.mon || h.tue || h.wed || h.thu || h.fri || h.sat || h.sun),
    'pelo menos 1 dia da semana com janela'
  );

// ── Fixtures: 3 cenários cobertos ──────────────────────────────────────

const fixtures: { name: string; state: WorkingHoursState }[] = [
  {
    name: 'típico seg-sex (default)',
    state: DEFAULT_WORKING_HOURS_STATE,
  },
  {
    name: 'só fim de semana',
    state: {
      days: {
        sat: [{ start: '10:00', end: '14:00' }],
        sun: [{ start: '10:00', end: '12:00' }],
      },
      timezone: 'UTC',
    },
  },
  {
    name: 'dia único com 3 janelas',
    state: {
      days: {
        wed: [
          { start: '08:00', end: '10:00' },
          { start: '11:00', end: '13:00' },
          { start: '15:00', end: '18:00' },
        ],
      },
      timezone: 'America/Manaus',
    },
  },
];

for (const { name, state } of fixtures) {
  test(`contract: ${name} — editor → JSON → worker Zod passa`, () => {
    const json = serializeWorkingHours(state);
    const parsed = WorkerWorkingHoursSchema.safeParse(json);
    assert.equal(parsed.success, true, JSON.stringify(parsed));
  });
}

test('contract: estado sem nenhum dia → worker Zod rejeita', () => {
  const json = serializeWorkingHours({ days: {}, timezone: 'UTC' });
  const parsed = WorkerWorkingHoursSchema.safeParse(json);
  assert.equal(parsed.success, false);
});

test('contract: janela mal formatada → worker Zod rejeita', () => {
  const bad = { mon: ['9-12'], timezone: 'UTC' };
  const parsed = WorkerWorkingHoursSchema.safeParse(bad);
  assert.equal(parsed.success, false);
});
