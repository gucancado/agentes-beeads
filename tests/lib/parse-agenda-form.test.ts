import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgendaForm } from '../../src/lib/parse-agenda-form.js';

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
}

const validHoursJson = JSON.stringify({
  mon: ['09:00-12:00'],
  timezone: 'America/Sao_Paulo',
});

test('parseAgendaForm: mode create', () => {
  const result = parseAgendaForm(
    fd({
      person_name: 'Rodrigo',
      person_email: 'r@x.com',
      display_label: 'time',
      description: '',
      working_hours: validHoursJson,
      meeting_duration_min: '30',
      min_advance_hours: '4',
      max_advance_business_days: '10',
    })
  );
  assert.equal(result.mode, 'create');
  assert.equal(result.body.person_name, 'Rodrigo');
  assert.equal(result.body.description, null); // vazio vira null
});

test('parseAgendaForm: mode edit com agenda_id e if_match_updated_at', () => {
  const result = parseAgendaForm(
    fd({
      agenda_id: '42',
      person_name: 'Rodrigo',
      person_email: 'r@x.com',
      display_label: 'time',
      description: 'desc',
      working_hours: validHoursJson,
      meeting_duration_min: '45',
      min_advance_hours: '4',
      max_advance_business_days: '10',
      if_match_updated_at: '2026-05-28T10:00:00.000Z',
    })
  );
  assert.equal(result.mode, 'edit');
  if (result.mode === 'edit') {
    assert.equal(result.agendaId, 42);
    assert.equal(result.body.if_match_updated_at, '2026-05-28T10:00:00.000Z');
    assert.equal(result.body.description, 'desc');
    assert.equal(result.body.meeting_duration_min, 45);
  }
});

test('parseAgendaForm: working_hours JSON deserializa corretamente', () => {
  const result = parseAgendaForm(
    fd({
      person_name: 'A',
      person_email: 'a@x.com',
      display_label: 'L',
      description: '',
      working_hours: validHoursJson,
      meeting_duration_min: '30',
      min_advance_hours: '4',
      max_advance_business_days: '10',
    })
  );
  assert.deepEqual(result.body.working_hours, {
    mon: ['09:00-12:00'],
    timezone: 'America/Sao_Paulo',
  });
});

test('parseAgendaForm: working_hours ausente lança Error', () => {
  assert.throws(
    () =>
      parseAgendaForm(
        fd({
          person_name: 'A',
          person_email: 'a@x.com',
          display_label: 'L',
          description: '',
          meeting_duration_min: '30',
          min_advance_hours: '4',
          max_advance_business_days: '10',
        })
      ),
    /working_hours ausente/
  );
});
