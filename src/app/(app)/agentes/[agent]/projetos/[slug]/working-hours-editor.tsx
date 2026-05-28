'use client';

import { useState } from 'react';
import {
  DAYS,
  DAY_LABELS_PT,
  BR_TIMEZONES,
  type Day,
  type WorkingHoursState,
  type WorkingHoursJSON,
  serializeWorkingHours,
  deserializeWorkingHours,
  validateWorkingHours,
  DEFAULT_WORKING_HOURS_STATE,
} from '@/lib/working-hours';

export function WorkingHoursEditor({
  initialValue,
  name,
}: {
  /** Estado inicial (JSON do worker). Se undefined, usa DEFAULT_WORKING_HOURS_STATE. */
  initialValue?: WorkingHoursJSON;
  /** Nome do hidden input que carrega o JSON serializado pro form. Default "working_hours". */
  name?: string;
}) {
  const inputName = name ?? 'working_hours';
  const [state, setState] = useState<WorkingHoursState>(() =>
    initialValue ? deserializeWorkingHours(initialValue) : DEFAULT_WORKING_HOURS_STATE
  );

  const serialized = JSON.stringify(serializeWorkingHours(state));
  const errors = validateWorkingHours(state);

  function toggleDay(day: Day) {
    setState((s) => {
      const days = { ...s.days };
      if (days[day]) {
        delete days[day];
      } else {
        days[day] = [{ start: '09:00', end: '12:00' }];
      }
      return { ...s, days };
    });
  }

  function addWindow(day: Day) {
    setState((s) => {
      const days = { ...s.days };
      const current = days[day] ?? [];
      days[day] = [...current, { start: '09:00', end: '12:00' }];
      return { ...s, days };
    });
  }

  function removeWindow(day: Day, idx: number) {
    setState((s) => {
      const days = { ...s.days };
      const current = (days[day] ?? []).filter((_, i) => i !== idx);
      if (current.length === 0) {
        delete days[day];
      } else {
        days[day] = current;
      }
      return { ...s, days };
    });
  }

  function updateWindow(day: Day, idx: number, field: 'start' | 'end', value: string) {
    setState((s) => {
      const days = { ...s.days };
      const current = [...(days[day] ?? [])];
      current[idx] = { ...current[idx]!, [field]: value };
      days[day] = current;
      return { ...s, days };
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={serialized} />

      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        {DAYS.map((day) => {
          const windows = state.days[day];
          const active = !!windows && windows.length > 0;
          return (
            <div key={day} className="flex items-start gap-3 py-1">
              <label className="flex items-center gap-2 w-28 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleDay(day)}
                  className="size-4 accent-honey-deep"
                  aria-label={`Ativar ${DAY_LABELS_PT[day]}`}
                />
                <span className={`text-sm ${active ? 'text-fg' : 'text-muted-fg'}`}>
                  {DAY_LABELS_PT[day]}
                </span>
              </label>

              <div className="flex-1 space-y-1">
                {!active && <span className="text-xs text-muted-fg italic">desativado</span>}
                {active &&
                  windows!.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={w.start}
                        onChange={(e) => updateWindow(day, idx, 'start', e.target.value)}
                        className="rounded border border-border bg-paper px-2 py-1 text-sm text-fg"
                        aria-label={`Início da janela ${idx + 1} de ${DAY_LABELS_PT[day]}`}
                      />
                      <span className="text-muted-fg text-sm">→</span>
                      <input
                        type="time"
                        value={w.end}
                        onChange={(e) => updateWindow(day, idx, 'end', e.target.value)}
                        className="rounded border border-border bg-paper px-2 py-1 text-sm text-fg"
                        aria-label={`Fim da janela ${idx + 1} de ${DAY_LABELS_PT[day]}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeWindow(day, idx)}
                        className="text-muted-fg hover:text-fg text-sm px-2"
                        aria-label={`Remover janela ${idx + 1} de ${DAY_LABELS_PT[day]}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                {active && (
                  <button
                    type="button"
                    onClick={() => addWindow(day)}
                    className="text-xs text-honey hover:underline"
                  >
                    + adicionar janela
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="tz-select" className="text-sm text-fg">
          Fuso horário:
        </label>
        <select
          id="tz-select"
          value={state.timezone}
          onChange={(e) => setState((s) => ({ ...s, timezone: e.target.value }))}
          className="rounded border border-border bg-paper px-2 py-1 text-sm text-fg"
        >
          {BR_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-danger space-y-1" role="alert">
          {errors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
