import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeWorkingHours,
  deserializeWorkingHours,
  validateWorkingHours,
  DEFAULT_WORKING_HOURS_STATE,
} from '../../src/lib/working-hours.js';

test('serializeWorkingHours: dia inativo vira key ausente', () => {
  const out = serializeWorkingHours({
    days: {
      mon: [{ start: '09:00', end: '12:00' }],
    },
    timezone: 'America/Sao_Paulo',
  });
  assert.deepEqual(out, { mon: ['09:00-12:00'], timezone: 'America/Sao_Paulo' });
  assert.ok(!('tue' in out));
});

test('serializeWorkingHours: ordena janelas por start ASC', () => {
  const out = serializeWorkingHours({
    days: {
      mon: [
        { start: '14:00', end: '18:00' },
        { start: '09:00', end: '12:00' },
      ],
    },
    timezone: 'UTC',
  });
  assert.deepEqual(out.mon, ['09:00-12:00', '14:00-18:00']);
});

test('serializeWorkingHours: array vazio omite o dia', () => {
  const out = serializeWorkingHours({
    days: { mon: [], tue: [{ start: '10:00', end: '11:00' }] },
    timezone: 'UTC',
  });
  assert.ok(!('mon' in out));
  assert.deepEqual(out.tue, ['10:00-11:00']);
});

test('deserializeWorkingHours: roundtrip do default', () => {
  const json = serializeWorkingHours(DEFAULT_WORKING_HOURS_STATE);
  const state = deserializeWorkingHours(json);
  const json2 = serializeWorkingHours(state);
  assert.deepEqual(json2, json);
});

test('validateWorkingHours: vazio → erro', () => {
  const errs = validateWorkingHours({ days: {}, timezone: 'America/Sao_Paulo' });
  assert.equal(errs.length, 1);
  assert.match(errs[0]!, /Pelo menos 1 dia/);
});

test('validateWorkingHours: start >= end → erro', () => {
  const errs = validateWorkingHours({
    days: { mon: [{ start: '18:00', end: '12:00' }] },
    timezone: 'America/Sao_Paulo',
  });
  assert.equal(errs.length, 1);
  assert.match(errs[0]!, /início deve ser antes do fim/);
});

test('validateWorkingHours: timezone vazia → erro', () => {
  const errs = validateWorkingHours({
    days: { mon: [{ start: '09:00', end: '12:00' }] },
    timezone: '',
  });
  assert.equal(errs.length, 1);
  assert.match(errs[0]!, /Selecione um fuso/);
});

test('validateWorkingHours: default state válido', () => {
  const errs = validateWorkingHours(DEFAULT_WORKING_HOURS_STATE);
  assert.deepEqual(errs, []);
});
