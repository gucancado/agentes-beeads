'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import {
  instanceStatusAction,
  requestQrAction,
  logoutInstanceAction,
  persistConnectedNumberAction,
} from './actions';

type State = 'open' | 'connecting' | 'close' | 'unknown';

type InstanceInfo = {
  name: string | null;
  owner: string | null;
  ownerNumber: string | null;
  profileName: string | null;
  state: State;
};

async function callStatus(instance: string): Promise<InstanceInfo | null> {
  const fd = new FormData();
  fd.set('instance', instance);
  const r = await instanceStatusAction(null, fd);
  if (r.ok) return r.info;
  return null;
}

async function callRequestQr(instance: string) {
  const fd = new FormData();
  fd.set('instance', instance);
  return requestQrAction(null, fd);
}

async function callLogout(instance: string) {
  const fd = new FormData();
  fd.set('instance', instance);
  return logoutInstanceAction(null, fd);
}

async function callPersist(agent: string, slug: string, instance: string) {
  const fd = new FormData();
  fd.set('agent', agent);
  fd.set('slug', slug);
  fd.set('instance', instance);
  return persistConnectedNumberAction(null, fd);
}

export function InstanceQrPanel({
  agent,
  slug,
  instance,
  initialNumber,
}: {
  agent: string;
  slug: string;
  instance: string;
  initialNumber: string | null;
}) {
  const [info, setInfo] = useState<InstanceInfo | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [persistedNumber, setPersistedNumber] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const i = await callStatus(instance);
    if (i) setInfo(i);
  }, [instance]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  // Polling enquanto está aguardando scan
  useEffect(() => {
    if (info?.state !== 'connecting') return;
    const id = setInterval(async () => {
      const i = await callStatus(instance);
      if (i) setInfo(i);
      if (i?.state === 'open') {
        // Limpa QR e auto-persiste número se mudou
        setQrBase64(null);
        setPairingCode(null);
        if (i.ownerNumber && i.ownerNumber !== initialNumber) {
          const r = await callPersist(agent, slug, instance);
          if (r.ok && r.number) setPersistedNumber(r.number);
        }
      }
    }, 2500);
    return () => clearInterval(id);
  }, [info?.state, instance, agent, slug, initialNumber]);

  function requestQr() {
    setError(null);
    setQrBase64(null);
    setPairingCode(null);
    startTransition(async () => {
      const r = await callRequestQr(instance);
      if (r.ok) {
        setQrBase64(r.qrBase64);
        setPairingCode(r.pairingCode);
        await refreshStatus();
      } else setError(r.error);
    });
  }

  function logoutThenConnect() {
    setError(null);
    setQrBase64(null);
    setPairingCode(null);
    startTransition(async () => {
      const lg = await callLogout(instance);
      if (!lg.ok) { setError(lg.error); return; }
      const r = await callRequestQr(instance);
      if (r.ok) {
        setQrBase64(r.qrBase64);
        setPairingCode(r.pairingCode);
        await refreshStatus();
      } else setError(r.error);
    });
  }

  const state = info?.state ?? 'unknown';
  const stateColor: Record<State, string> = {
    open: 'text-ok',
    connecting: 'text-warn',
    close: 'text-err',
    unknown: 'text-ink-mute',
  };
  const stateLabel: Record<State, string> = {
    open: 'conectado',
    connecting: 'aguardando QR',
    close: 'desconectado',
    unknown: '—',
  };

  return (
    <div className="px-5 py-5 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-mute">estado</div>
          <div className={`font-display text-lg font-medium mt-1 ${stateColor[state]}`}>{stateLabel[state]}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-mute">número conectado</div>
          <div className="font-mono text-sm text-ink mt-1">{info?.ownerNumber ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-mute">profile WhatsApp</div>
          <div className="font-mono text-sm text-ink mt-1">{info?.profileName ?? '—'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-mute">instância</div>
          <div className="font-mono text-xs text-ink-soft mt-1 break-all">{instance}</div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        <button
          type="button"
          onClick={requestQr}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-sm bg-ink text-white px-3.5 py-2 font-display text-sm font-medium hover:bg-honey-deep disabled:opacity-60 cursor-pointer group"
        >
          {pending ? 'Conectando…' : 'Gerar QR (reconectar)'}
          <span className="inline-block size-1.5 rounded-full bg-honey group-hover:bg-white transition" />
        </button>
        <button
          type="button"
          onClick={logoutThenConnect}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-card text-ink px-3.5 py-2 font-display text-sm font-medium hover:border-honey disabled:opacity-60 cursor-pointer"
        >
          Trocar número (logout + QR)
        </button>
        <button
          type="button"
          onClick={refreshStatus}
          disabled={pending}
          className="text-[11px] text-ink underline-honey cursor-pointer disabled:opacity-50"
        >
          atualizar status
        </button>
      </div>

      {error && (
        <p className="text-xs text-err">erro: {error}</p>
      )}
      {persistedNumber && (
        <p className="text-xs text-ok">
          ✓ número <code className="text-honey-deep bg-honey-soft px-1.5 py-0.5 rounded-[2px]">{persistedNumber}</code> persistido em agents.yml — rebuild em ~90s.
        </p>
      )}

      {qrBase64 && (
        <div className="rounded-md border border-line bg-paper p-4 inline-flex flex-col items-center gap-3 max-w-[280px]">
          <img
            src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
            alt="QR code Evolution"
            width={240}
            height={240}
            className="block"
          />
          <p className="text-[10px] text-center text-ink-soft leading-snug">
            No WhatsApp do número desejado → <b>Aparelhos conectados</b> → <b>Conectar um aparelho</b> → escaneia o QR.<br />
            Atualiza automático quando conectar.
          </p>
        </div>
      )}
      {pairingCode && !qrBase64 && (
        <div className="rounded-md border border-line bg-paper p-3 inline-block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-mute">pairing code</span>
          <div className="font-mono text-xl font-medium text-ink tracking-widest mt-1">{pairingCode}</div>
        </div>
      )}
    </div>
  );
}
