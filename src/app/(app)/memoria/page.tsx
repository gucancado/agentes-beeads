import { getPool } from '@/lib/db';
import { getAuthUser, getRawCookieHeader } from '@/lib/auth';
import { assembleMemoryIndex } from '@/lib/memory-service';
import { SectionCard } from '@/components/section-card';
import { MemoryIndexList } from '@/components/memory-index-list';

export default async function MemoriaPage() {
  const user = await getAuthUser();
  if (!user) return null; // layout já protege; guarda defensiva
  const cookie = await getRawCookieHeader();
  const items = await assembleMemoryIndex(getPool(), cookie);
  const totalNr = items.reduce((s, i) => s + Number(i.row.needs_review), 0);
  return (
    <div className="space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Memória</h1>
        <p className="text-sm text-muted-fg">
          {items.length} workspaces com memória{totalNr > 0 ? ` · ${totalNr} fatos a revisar` : ''}.
        </p>
      </header>
      <SectionCard title="Projetos">
        <MemoryIndexList items={items} />
      </SectionCard>
    </div>
  );
}
