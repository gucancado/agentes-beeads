'use client';

import { useEffect, useState } from 'react';
import { listCalendarsAction } from './scheduling-actions';
import type { GoogleCalendarOption } from '@/lib/worker-admin-client';

type Props = {
  agent: string;
  slug: string;
  name: string;
  initialValue?: string;
  googleConnected: boolean;
};

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; calendars: GoogleCalendarOption[] }
  | { kind: 'err'; message: string };

/**
 * Input de calendar com sugestões. Sempre mostra um input de texto livre
 * (permite digitar ID qualquer), e abaixo lista chips com calendars
 * acessíveis pela conexão OAuth — clicar preenche o input.
 */
export function CalendarPicker({ agent, slug, name, initialValue, googleConnected }: Props) {
  const [value, setValue] = useState(initialValue ?? '');
  const [state, setState] = useState<LoadState>({ kind: 'idle' });

  useEffect(() => {
    if (!googleConnected) return;
    let cancelled = false;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const result = await listCalendarsAction({ agent, slug });
        if (cancelled) return;
        if (result.ok) {
          setState({ kind: 'ok', calendars: result.calendars });
        } else {
          setState({ kind: 'err', message: result.error });
        }
      } catch (err) {
        if (cancelled) return;
        setState({ kind: 'err', message: (err as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agent, slug, googleConnected]);

  const writable =
    state.kind === 'ok' ? state.calendars.filter((c) => c.writable) : [];
  const readonly =
    state.kind === 'ok' ? state.calendars.filter((c) => !c.writable) : [];
  const valueInList =
    state.kind === 'ok' && state.calendars.some((c) => c.id === value);

  return (
    <div className="space-y-2">
      <input
        type="text"
        name={name}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="email@dominio.com ou xxx@group.calendar.google.com"
        className="w-full rounded border border-border bg-paper px-3 py-2 text-sm text-fg"
      />

      {!googleConnected && (
        <p className="text-xs text-muted-fg">
          Conecte uma conta Google primeiro pra ver calendars disponíveis.
        </p>
      )}

      {state.kind === 'loading' && (
        <p className="text-xs text-muted-fg">Buscando calendars disponíveis…</p>
      )}

      {state.kind === 'err' && (
        <p className="text-xs text-danger">
          Erro buscando calendars ({state.message}). Você pode digitar o ID manualmente.
        </p>
      )}

      {state.kind === 'ok' && value && !valueInList && (
        <p className="text-xs text-warning">
          ⚠ O calendar atual (<code>{value}</code>) não está entre os acessíveis pela
          conexão. Pode estar incorreto ou sem permissão de escrita.
        </p>
      )}

      {state.kind === 'ok' && state.calendars.length === 0 && (
        <p className="text-xs text-muted-fg">
          Nenhum calendar encontrado pra esta conta. Verifique o acesso no Google Calendar.
        </p>
      )}

      {state.kind === 'ok' && state.calendars.length > 0 && (
        <div className="space-y-1.5">
          {writable.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-fg">
                ✓ Calendars com permissão de escrita
              </p>
              <div className="flex flex-wrap gap-1.5">
                {writable.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue(c.id)}
                    className={`rounded border px-2 py-1 text-xs hover:bg-paper-deep ${
                      value === c.id
                        ? 'border-honey-deep bg-honey/10 text-fg'
                        : 'border-border bg-paper text-fg'
                    }`}
                    title={c.id}
                  >
                    {c.summary || c.id}
                    {c.primary && ' ★'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {readonly.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-fg">
                Calendars só leitura (agente não consegue criar eventos)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {readonly.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue(c.id)}
                    className={`rounded border px-2 py-1 text-xs hover:bg-paper-deep ${
                      value === c.id
                        ? 'border-warning bg-warning/10 text-fg'
                        : 'border-border bg-paper text-muted-fg'
                    }`}
                    title={c.id}
                  >
                    {c.summary || c.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
