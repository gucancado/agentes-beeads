'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@beeads/ui';
import {
  startGoogleOAuthAction,
  disconnectGoogleAction,
  testGoogleConnectionAction,
} from './scheduling-actions';
import type { GoogleConnectionPublic, GoogleTestResult } from '@/lib/worker-admin-client';

type Props = {
  agent: string;
  slug: string;
  connection: GoogleConnectionPublic | null;
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h atrás`;
  return `${Math.floor(h / 24)} d atrás`;
}

export function GoogleConnectionCard({ agent, slug, connection }: Props) {
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<GoogleTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  function handleConnect() {
    startTransition(async () => {
      const r = await startGoogleOAuthAction(agent, slug);
      if (r.ok) {
        window.location.href = r.url;
      } else {
        setTestError(`Falha ao iniciar OAuth: ${r.error}`);
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectGoogleAction(agent, slug);
      setConfirmDisconnect(false);
    });
  }

  function handleTest() {
    setTestResult(null);
    setTestError(null);
    startTransition(async () => {
      const r = await testGoogleConnectionAction(agent, slug);
      if (r.ok) setTestResult(r.details);
      else setTestError(r.error);
    });
  }

  // ── Desconectado ──
  if (!connection) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <p className="text-sm text-fg">Google Calendar + Gmail:</p>
        <Button onClick={handleConnect} disabled={isPending}>
          {isPending ? 'Abrindo...' : 'Conectar Google'}
        </Button>
        {testError && (
          <p className="text-sm text-danger" role="alert">{testError}</p>
        )}
      </div>
    );
  }

  // ── Conectado com erro ──
  if (connection.last_error) {
    return (
      <div className="rounded-lg border border-danger bg-danger/5 p-4 space-y-2">
        <p className="text-sm text-fg">
          ⚠ Token Google revogado ({connection.google_email})
        </p>
        <p className="text-xs text-muted-fg">
          Último erro: {connection.last_error.slice(0, 100)} (
          {connection.last_refresh_at ? relativeTime(connection.last_refresh_at) : '—'})
        </p>
        <div className="flex gap-2">
          <Button onClick={handleConnect} disabled={isPending}>
            Reconectar
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDisconnect(true)} disabled={isPending}>
            Desconectar
          </Button>
        </div>
      </div>
    );
  }

  // ── Conectado, sem erro ──
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <p className="text-sm text-fg">
        ✓ Conectado como <strong>{connection.google_email}</strong>
      </p>
      <p className="text-xs text-muted-fg">
        Scopes: {connection.scopes.map((s) => s.split('/').pop()).join(', ')}
      </p>
      <p className="text-xs text-muted-fg">
        Conectado {relativeTime(connection.connected_at)}
        {connection.last_refresh_at && ` • último refresh ${relativeTime(connection.last_refresh_at)}`}
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleTest} disabled={isPending}>
          {isPending ? 'Testando...' : 'Testar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirmDisconnect(true)} disabled={isPending}>
          Desconectar
        </Button>
      </div>

      {testResult && (
        <div className={`rounded border p-3 text-sm ${testResult.ok ? 'border-border bg-card' : 'border-danger bg-danger/5'}`} role="status">
          <p>Calendar: {testResult.calendar_ok ? '✓' : `✗ ${testResult.calendar_error}`}</p>
          <p>Gmail: {testResult.gmail_ok ? '✓' : `✗ ${testResult.gmail_error}`}</p>
          {testResult.scope_warnings.length > 0 && (
            <p className="text-xs text-warning mt-1">
              Scopes faltando: {testResult.scope_warnings.map((s) => s.split('/').pop()).join(', ')}
            </p>
          )}
        </div>
      )}

      {testError && (
        <p className="text-sm text-danger" role="alert">{testError}</p>
      )}

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Google?</AlertDialogTitle>
            <AlertDialogDescription>
              O refresh token será revogado e apagado. Pra usar Calendar/Gmail de novo, você
              precisa reconectar. Agendas cadastradas continuam salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDisconnect(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleDisconnect} disabled={isPending}>
              {isPending ? 'Desconectando...' : 'Desconectar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
