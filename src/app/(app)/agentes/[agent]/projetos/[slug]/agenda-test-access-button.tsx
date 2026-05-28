'use client';

import { useState, useTransition } from 'react';
import { Button } from '@beeads/ui';
import { testAgendaAccessAction } from './scheduling-actions';
import { GoogleShareInstructionsModal } from './google-share-instructions-modal';
import type { TestAccessResult } from '@/lib/worker-admin-client';

type Props = {
  agent: string;
  slug: string;
  agendaId: number;
  personEmail: string;
};

export function AgendaTestAccessButton({ agent, slug, agendaId, personEmail }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<TestAccessResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  function handleTest() {
    setResult(null);
    setActionError(null);
    startTransition(async () => {
      const r = await testAgendaAccessAction(agent, slug, agendaId);
      if (r.ok) setResult(r.details);
      else setActionError(r.error);
    });
  }

  const agentEmail =
    result && !result.ok && 'agent_email' in result ? result.agent_email ?? '' : '';

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={handleTest} disabled={isPending}>
        {isPending ? 'Testando...' : 'Testar acesso'}
      </Button>

      {result?.ok && (
        <p className="text-xs text-green-600" role="status">
          ✓ Calendar acessível ({result.calendar_metadata.summary})
        </p>
      )}

      {result && !result.ok && result.error === 'not_shared' && (
        <div className="text-xs space-y-1 text-danger" role="alert">
          <p>✗ Calendar não compartilhado com o agente.</p>
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="underline text-honey hover:text-honey-deep"
          >
            Como compartilhar?
          </button>
        </div>
      )}

      {result && !result.ok && result.error === 'not_found' && (
        <p className="text-xs text-danger" role="alert">
          ✗ Calendar não encontrado — verifique se o email está correto.
        </p>
      )}

      {result && !result.ok && result.error === 'auth' && (
        <p className="text-xs text-danger" role="alert">
          ✗ Token Google revogado. Reconecte no card acima.
        </p>
      )}

      {result && !result.ok && result.error === 'unknown' && (
        <p className="text-xs text-danger" role="alert">
          ✗ Erro inesperado: {result.detail?.slice(0, 100)}
        </p>
      )}

      {actionError && (
        <p className="text-xs text-danger" role="alert">
          {actionError === 'worker_unreachable' || actionError === 'worker_timeout'
            ? 'Serviço indisponível.'
            : `Erro: ${actionError}`}
        </p>
      )}

      <GoogleShareInstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        agentEmail={agentEmail}
        personEmail={personEmail}
      />
    </div>
  );
}
