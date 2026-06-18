import { notFound } from 'next/navigation';
import { getPool } from '@/lib/db';
import { getAuthUser, getRawCookieHeader } from '@/lib/auth';
import { assembleWorkspaceMemory } from '@/lib/memory-service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@beeads/ui';
import { FactsView } from './facts-view';
import { EpisodesList } from '@/components/episodes-list';

export default async function WorkspaceMemoryPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await getAuthUser();
  if (!user) return null; // layout já protege; guarda defensiva
  const cookie = await getRawCookieHeader();
  const data = await assembleWorkspaceMemory(getPool(), cookie, workspaceId);
  if (!data) notFound();

  const vig = data.facts.filter((f) => f.invalid_at == null).length;
  const sup = data.facts.length - vig;

  return (
    <div className="space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <p className="text-sm text-muted-fg">
          {vig} fatos vigentes · {sup} no histórico · {data.episodes.length} reuniões
        </p>
      </header>
      <Tabs defaultValue="fatos">
        <TabsList>
          <TabsTrigger value="fatos">Fatos</TabsTrigger>
          <TabsTrigger value="episodios">Reuniões</TabsTrigger>
        </TabsList>
        <TabsContent value="fatos">
          <div className="rounded-md border border-border bg-card p-4">
            <FactsView facts={data.facts} workspaceId={workspaceId} />
          </div>
        </TabsContent>
        <TabsContent value="episodios">
          <div className="rounded-md border border-border bg-card p-4">
            <EpisodesList workspaceId={workspaceId} episodes={data.episodes} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
