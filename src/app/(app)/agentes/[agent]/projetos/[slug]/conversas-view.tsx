import { fetchConversations } from '@/lib/stats-service';
import { ConversationsList } from './conversations-list';
import { ConversationThread } from './conversation-thread';

export async function ConversasView({
  agent,
  slug,
  selectedConv,
}: {
  agent: string;
  slug: string;
  selectedConv?: string;
}) {
  const conversations = await fetchConversations(agent, slug);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] border border-border rounded-md bg-card overflow-hidden min-h-[60vh]">
      <aside className="border-b lg:border-b-0 lg:border-r border-border overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-280px)]">
        <ConversationsList conversations={conversations} selectedConv={selectedConv} />
      </aside>

      <main className="min-w-0">
        {selectedConv ? (
          <ConversationThread agent={agent} slug={slug} identifier={selectedConv} />
        ) : (
          <EmptyState hasAny={conversations.length > 0} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
      <div className="font-display italic text-4xl text-honey-deep/40 mb-4">conversas</div>
      <p className="text-sm text-muted-fg max-w-xs">
        {hasAny
          ? 'Selecione uma conversa à esquerda pra ver o thread completo, custo e modelo por turno.'
          : 'Nenhuma conversa ainda neste projeto. Quando o agente trocar mensagens com um lead, aparece aqui.'}
      </p>
    </div>
  );
}
