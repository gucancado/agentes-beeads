'use client';

import { useEffect, useState, useTransition } from 'react';
import { listCalendarsAction } from './scheduling-actions';
import type { GoogleCalendarOption } from '@/lib/worker-admin-client';

type Props = {
  agent: string;
  slug: string;
  name: string; // nome do campo no FormData
  initialValue?: string; // email atual da agenda (modo edit)
  googleConnected: boolean; // se false, mostra apenas o input livre + aviso
};

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; calendars: GoogleCalendarOption[] }
  | { kind: 'err'; message: string };

/**
 * Picker de calendar. Quando OAuth conectado, carrega calendars acessíveis e
 * mostra <select>. Se OAuth não conectado, cai pro input livre. Permite
 * digitar email manualmente via toggle (útil pra debug ou casos legacy).
 */
export function CalendarPicker({ agent, slug, name, initialValue, googleConnected }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();
  const [manual, setManual] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');

  useEffect(() => {
    if (!googleConnected) return;
    setState({ kind: 'loading' });
    startTransition(async () => {
      const result = await listCalendarsAction({ agent, slug });
      if (result.ok) {
        setState({ kind: 'ok', calendars: result.calendars });
        // Se initial value não está na lista, força manual mode
        if (initialValue && !result.calendars.some((c) => c.id === initialValue)) {
          setManual(true);
        }
      } else {
        setState({ kind: 'err', message: result.error });
      }
    });
  }, [agent, slug, googleConnected, initialValue]);

  if (!googleConnected) {
    return (
      <div className="space-y-1">
        <input
          type="email"
          name={name}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        />
        <p className="text-xs text-muted-fg">
          Conecte uma conta Google primeiro pra listar calendars disponíveis.
        </p>
      </div>
    );
  }

  if (state.kind === 'loading' || pending) {
    return (
      <div className="space-y-1">
        <div className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-muted-fg">
          Carregando calendars…
        </div>
        <input type="hidden" name={name} value={value} />
      </div>
    );
  }

  if (state.kind === 'err') {
    return (
      <div className="space-y-1">
        <input
          type="email"
          name={name}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        />
        <p className="text-xs text-danger">
          Erro carregando lista de calendars ({state.message}). Digite o ID manualmente.
        </p>
      </div>
    );
  }

  if (state.kind === 'ok') {
    const writable = state.calendars.filter((c) => c.writable);
    const readonly = state.calendars.filter((c) => !c.writable);

    if (manual) {
      return (
        <div className="space-y-1">
          <input
            type="email"
            name={name}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="email@dominio.com ou xxx@group.calendar.google.com"
            className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
          />
          <button
            type="button"
            onClick={() => setManual(false)}
            className="text-xs text-muted-fg underline hover:text-fg"
          >
            Voltar pra dropdown
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <select
          name={name}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
        >
          <option value="" disabled>
            Selecione um calendar…
          </option>
          {writable.length > 0 && (
            <optgroup label="Calendars com permissão de escrita (recomendado)">
              {writable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.summary} {c.primary ? '(primário)' : ''} — {c.id}
                </option>
              ))}
            </optgroup>
          )}
          {readonly.length > 0 && (
            <optgroup label="Calendars somente leitura (agente não conseguirá criar eventos)">
              {readonly.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.summary} — {c.id}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <p className="text-xs text-muted-fg">
          Recomendado: calendar com permissão de escrita (writer/owner).{' '}
          <button
            type="button"
            onClick={() => setManual(true)}
            className="underline hover:text-fg"
          >
            Digitar ID manualmente
          </button>
        </p>
      </div>
    );
  }

  return null;
}
