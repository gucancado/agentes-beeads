'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@beeads/ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class SchedulingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[SchedulingErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-warning bg-warning/5 p-4 space-y-3">
          <h3 className="text-sm font-medium text-fg">Agendamento temporariamente indisponível</h3>
          <p className="text-sm text-muted-fg">
            Não foi possível carregar as configurações de agendamento. O resto da página continua
            funcionando. Tente recarregar em alguns segundos.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
          >
            Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
