'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Conversation } from '@/lib/queries';

function shortIdentifier(id: string): string {
  if (!id.startsWith('+')) return id;
  return '+' + id.slice(-5);
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function ConversationsList({
  conversations,
  selectedConv,
}: {
  conversations: Conversation[];
  selectedConv?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();

  if (conversations.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-muted-fg">
        Nenhuma conversa ainda. Quando o agente conversar com um lead, aparece aqui.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((c) => {
        const isActive = selectedConv === c.identifier;
        const params = new URLSearchParams(sp?.toString() ?? '');
        params.set('tab', 'conversas');
        params.set('conv', c.identifier);
        const href = `${pathname}?${params.toString()}`;
        return (
          <li key={c.identifier}>
            <Link
              href={href}
              scroll={false}
              aria-current={isActive ? 'page' : undefined}
              className={
                'grid grid-cols-[1fr_60px_50px_28px] gap-3 px-4 py-3 items-baseline text-sm transition-colors ' +
                (isActive
                  ? 'bg-honey/10 border-l-2 border-honey-deep'
                  : 'border-l-2 border-transparent hover:bg-bg/60')
              }
            >
              <span className="font-display italic text-fg truncate">
                {c.pushName ?? '(sem nome)'}
              </span>
              <span className="text-[11px] font-mono text-honey/80 text-right tabular-nums">
                {shortIdentifier(c.identifier)}
              </span>
              <span className="text-[10px] text-muted-fg tracking-wide text-right">
                {shortTime(c.lastMessageAt)}
              </span>
              <span className="text-[10px] text-muted-fg tabular-nums text-right">
                {c.msgCount}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
