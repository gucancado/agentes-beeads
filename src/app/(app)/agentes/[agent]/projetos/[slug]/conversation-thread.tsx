import { fetchConversationThread } from '@/lib/stats-service';
import type { ConversationMessage } from '@/lib/queries';
import { ThreadScrollContainer } from './thread-scroll-container';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCost(cost: number): string {
  if (cost === 0) return '$0';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatLatency(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function shortModel(model: string | null): string | null {
  if (!model) return null;
  return model.replace(/^claude-/, '');
}

export async function ConversationThread({
  agent,
  slug,
  identifier,
}: {
  agent: string;
  slug: string;
  identifier: string;
}) {
  const thread = await fetchConversationThread(agent, slug, identifier);
  const { messages, totalCost, pushName } = thread;

  const lastMessageAt = messages.length > 0 ? messages[messages.length - 1].createdAt : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="border-b border-border px-5 py-3 bg-card flex-shrink-0">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-medium text-fg truncate">
              {pushName ?? '(sem nome)'}
            </h2>
            <p className="text-[11px] font-mono text-muted-fg mt-0.5">{identifier}</p>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.18em] text-muted-fg">
            <div>
              {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
            </div>
            <div className="mt-0.5 text-honey-deep tabular-nums">total {formatCost(totalCost)}</div>
            {lastMessageAt && (
              <div className="mt-0.5 normal-case tracking-normal">
                última {formatDate(lastMessageAt)} {formatTime(lastMessageAt)}
              </div>
            )}
          </div>
        </div>
      </header>

      <ThreadScrollContainer dataKey={identifier}>
        {messages.length === 0 ? (
          <li className="text-center text-sm text-muted-fg">Sem mensagens nesta conversa.</li>
        ) : (
          messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
      </ThreadScrollContainer>
    </div>
  );
}

function Bubble({ message }: { message: ConversationMessage }) {
  const isOutbound = message.direction === 'outbound';
  const align = isOutbound ? 'justify-end' : 'justify-start';
  const bubbleClass = isOutbound
    ? 'bg-honey/15 border-honey/40 text-fg rounded-tr-sm'
    : 'bg-card border-border text-fg rounded-tl-sm';
  const time = formatTime(message.createdAt);

  return (
    <li className={`flex ${align}`}>
      <div className={`max-w-[80%] space-y-1.5`}>
        <div className={`rounded-lg border px-3.5 py-2.5 ${bubbleClass}`}>
          <p className="text-sm leading-snug whitespace-pre-wrap">{message.text}</p>
          {isOutbound && message.model && (
            <div className="mt-2 pt-1.5 border-t border-honey/20 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-fg font-mono">
              <span>{shortModel(message.model)}</span>
              <span aria-hidden>·</span>
              <span className="text-honey-deep tabular-nums">{formatCost(message.turnCost)}</span>
              {message.latencyMs != null && (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{formatLatency(message.latencyMs)}</span>
                </>
              )}
              {message.classifierIntent && (
                <>
                  <span aria-hidden>·</span>
                  <span>{message.classifierIntent}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={`text-[10px] text-muted-fg ${isOutbound ? 'text-right' : 'text-left'}`}>
          {time}
        </div>
      </div>
    </li>
  );
}
