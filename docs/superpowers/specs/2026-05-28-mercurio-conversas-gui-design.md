# Mercurio Conversas GUI — Design Spec

**Status:** Approved 2026-05-28
**Repo afetado:** `gucancado/agentes-beeads` (console Next.js em `agentes.beeads.com.br`)
**Escopo:** UI da página de projeto em `/agentes/[agent]/projetos/[slug]` — substitui o card "Mensagens recentes" por uma vista de conversas com drill-in.

## Problema

A vista atual de mensagens (`RecentMessagesCard` em [page.tsx:284](../../../src/app/(app)/agentes/[agent]/projetos/[slug]/page.tsx)) lista as últimas 20 mensagens cronologicamente, misturando todos os leads. Não permite:

- Ver de relance quem está conversando agora com o agente
- Acompanhar o fluxo de uma conversa específica
- Auditar custo/modelo por turno e por conversa

Sem essas três coisas, a aba Operação serve pra observar **volume**, não pra auditar **qualidade ou custo** das interações.

## Objetivos

1. Lista de conversas (1 por lead) ordenada por última msg.
2. Drill-in para thread completa de uma conversa.
3. Em cada msg outbound: modelo, custo do turno, latência, intent classificada.
4. No topo do thread: total da conversa.
5. URL deeplinkable (compartilhável, browser back funciona).
6. Responsivo: desktop master/detail, mobile stacked.

## Não-objetivos

- Responder pelo painel (só leitura por enquanto)
- Busca/filtros na lista (V1)
- Indicadores real-time (typing, online, novo)
- Backfill de `message_id` em rows `llm_metrics` antigas
- Edição/anotação de mensagens

## Arquitetura

### Rotas (Next.js app router)

```
/agentes/[agent]/projetos/[slug]
├── page.tsx                              ← aba Operação + nova aba Conversas
└── conversas/
    ├── layout.tsx                        ← split master/detail responsivo
    ├── page.tsx                          ← /conversas — só lista + empty state à direita
    └── [identifier]/
        └── page.tsx                      ← /conversas/[id] — lista + thread selecionada
```

O `layout.tsx` aplica o split:
- `lg:` grid `[360px_1fr]` mostrando lista + thread
- `< lg`: stacked. Em `/conversas` mostra só lista; em `/conversas/[id]` mostra só thread com link voltar.

Em desktop, navegar pra `/conversas/[id]` mantém a lista visível com a row correspondente destacada. Isso é "navigation as state": o router controla qual conversa está selecionada.

### Tab Conversas vs. aba existente

A página `[slug]/page.tsx` hoje usa `Tabs` do `@beeads/ui` com `Operação | Configuração | Agendamento`. Adicionar **Conversas** entre Operação e Configuração:

```
[Operação] [Conversas ← nova] [Configuração] [Agendamento]
```

`RecentMessagesCard` é **removido** da aba Operação (não duplica). `fetchRecentMessages` é removido das chamadas paralelas em `Promise.all`.

### Identifier na URL

O identifier é formato E.164 (`+5531xxxxxxxx`). Vai URL-encoded como `%2B5531xxxxxxxx`. Next.js dynamic route extrai com `decodeURIComponent`. Nada exótico.

## Camada de dados

### Worker DB (semente-worker-postgres)

A console já faz queries direto via `getPool()` no `lib/queries.ts`. Mesmo padrão pras novas queries.

**Tabelas envolvidas:**
- `messages` (id, agent, project, channel, identifier, direction, text, tier, model, provider, classifier_intent, cost_usd, latency_ms, created_at)
- `llm_metrics` (id, agent, message_id, task, model, cost_usd, latency_ms, cache_read_tokens, tokens_in, tokens_out, created_at)
- `webhook_logs` (push_name é a fonte do nome do lead)

### Novas funções em `src/lib/queries.ts`

**`getConversations(pool, agent, project)`** — retorna lista de conversas.

```sql
SELECT
  m.identifier,
  (SELECT wl.push_name FROM webhook_logs wl
     WHERE wl.agent = m.agent AND wl.channel = m.channel
       AND wl.identifier = m.identifier AND wl.push_name IS NOT NULL
     ORDER BY wl.created_at DESC LIMIT 1) AS push_name,
  COUNT(*) AS msg_count,
  MAX(m.created_at) AS last_message_at
FROM messages m
WHERE m.agent = $1 AND m.project = $2
GROUP BY m.identifier
ORDER BY MAX(m.created_at) DESC;
```

Retorna `{ identifier, pushName, msgCount, lastMessageAt }[]`.

**`getConversationThread(pool, agent, project, identifier)`** — retorna messages com custo turn-level.

```sql
SELECT
  m.id, m.direction, m.text, m.created_at,
  m.tier, m.model, m.classifier_intent, m.latency_ms,
  m.cost_usd AS respond_cost,
  COALESCE(c.cost_usd, 0) AS classify_cost,
  (m.cost_usd + COALESCE(c.cost_usd, 0)) AS turn_cost
FROM messages m
LEFT JOIN LATERAL (
  SELECT cost_usd FROM llm_metrics lm
  WHERE lm.agent = m.agent
    AND lm.task = 'classify'
    AND lm.message_id IS NULL
    AND lm.created_at < m.created_at
    AND lm.created_at > m.created_at - INTERVAL '60 seconds'
  ORDER BY lm.created_at DESC LIMIT 1
) c ON m.direction = 'outbound'
WHERE m.agent = $1 AND m.project = $2 AND m.identifier = $3
ORDER BY m.created_at ASC;
```

Retorna `{ id, direction, text, createdAt, tier, model, classifierIntent, latencyMs, respondCost, classifyCost, turnCost }[]`.

**Por que LATERAL JOIN heurístico:** classify rows não têm `message_id`, mas a sequência de eventos é sempre `classify → respond` em <30s (ver [process-tick-message.js:455-503](../../../../../../agente-mercurio/scripts/process-tick-message.js)). O LATERAL pega o classify mais próximo antes do outbound, mesma janela. Para outbounds tipo `handoff` (sem classify? — não, sempre tem classify), o `LEFT JOIN` resolve com 0.

**Edge cases tratados:**
- Inbound msgs: `LEFT JOIN ... ON m.direction='outbound'` impede match irrelevante; `classify_cost=0`, `turn_cost=cost_usd=null`.
- Outbound sem classify na janela (dados antigos antes do design atual): `classify_cost=0`. Sub-relata custo, mas honesto (a UI mostra "$0.0070" sem inflar).
- Conversa só com inbound: total $0 (nunca houve outbound = sem custo).

### Helpers em `lib/stats-service.ts`

Mirroring padrão atual:

```ts
export async function fetchConversations(agent: string, project: string) {
  if (useMock()) return m.mockConversations();
  return q.getConversations(getPool(), agent, project);
}

export async function fetchConversationThread(
  agent: string, project: string, identifier: string
) {
  if (useMock()) return m.mockConversationThread(identifier);
  return q.getConversationThread(getPool(), agent, project, identifier);
}
```

Mocks em `lib/mocks.ts` pra desenvolvimento sem DB.

## Componentes

### `conversas/layout.tsx`

Recebe `params: { agent, slug }` + `children`. Faz fetch da lista **uma vez** no layout (cache no Next.js evita re-fetch entre /conversas e /conversas/[id]). Renderiza:

```tsx
<div className="grid lg:grid-cols-[360px_1fr] gap-0 border border-border">
  <aside className="hidden lg:block border-r border-border overflow-y-auto max-h-[calc(100vh-200px)]">
    <ConversationsList conversations={list} agent={agent} slug={slug} />
  </aside>
  <main className="min-w-0">
    {children}
  </main>
</div>
```

Em mobile (< lg), o `aside` esconde. A `page.tsx` raiz (`/conversas`) detecta via CSS e mostra a lista; `[identifier]/page.tsx` mostra só thread.

### `conversas/conversations-list.tsx` (client component, `'use client'`)

Cliente porque precisa marcar a row selecionada com base em `usePathname()`. Server component renderizaria a lista mas client é necessário pro highlight reativo sem reload.

```
+-------------------------------+
| Nupad Rosangela  +03  10:42 4 |  ← Link to /conversas/+5531xxx
| Gustavo Cançado  +21  17:28 4 |
| Rodrigo BeeAds   +96  25/05 10|  
+-------------------------------+
```

Cada row é `<Link href={\`/conversas/${encodeURIComponent(identifier)}\`}>`. Selected row pega bg honey-soft + border-left honey.

Empty state: "Nenhuma conversa ainda. Quando o agente conversar com um lead, aparece aqui."

### `conversas/page.tsx` (lista raiz)

Server component. No desktop, o layout já renderiza a lista; este page é o conteúdo do `<main>`. Mostra empty state:

```
              💬

   Selecione uma conversa
        à esquerda
```

No mobile, o layout esconde o aside; este page mostra a lista inline (reusa `ConversationsList` em variante `mobileStandalone`).

### `conversas/[identifier]/page.tsx`

Server component. Recebe `params: { agent, slug, identifier }`. Faz fetch do thread, renderiza:

**Header:**
```
Nupad Rosangela
+5531 9164-8003 · 4 msgs · total $0.0137 · última 27/05 10:43        [↻]
```

Botão `↻` (reload) é um Server Action que dá `revalidatePath` na rota.

**Thread:**

Lista vertical de bubbles. **Inbound (lead) à esquerda, outbound (agente) à direita** — convenção de ferramentas de CRM/SDR (HubSpot, Intercom, Zendesk): cliente vem da "esquerda do mundo", agente é "nosso lado" à direita.

**Bubble inbound:**
```
┌─────────────┐
│ Bom dia     │
└─────────────┘
10:42
```

**Bubble outbound:**
```
                ┌──────────────────────────────────────────┐
                │ Oi, Rosangela! Aqui é da equipe BeeAds.. │
                │ ──────────────────────────────────────── │
                │ haiku-4-5 · $0.0093 · 1.6s · saudacao_…  │  ← pill cinza, text-xs
                └──────────────────────────────────────────┘
                                                      10:43
```

Auto-scroll para a última msg no mount (client component wrapper com `useEffect`).

Empty state (conversation existe mas sem msgs — improvável): "Sem mensagens nesta conversa ainda."

## UX details

### Responsivo

- **`< 1024px` (mobile/tablet small):** stacked. `/conversas` mostra lista; `/conversas/[id]` mostra thread com header link "← Conversas".
- **`≥ 1024px` (lg+):** side-by-side. Selected highlight sincroniza com URL.
- **`≥ 1700px` (3xl):** lista pode crescer pra ~400px se houver espaço; thread ganha mais margem.

### Hierarquia visual

Reusa tokens do `@beeads/ui`:
- `bg-paper` no container
- `border-border` em separadores
- `bg-honey-soft` em outbound bubbles (cor da identidade do agente)
- `bg-bg` neutro em inbound bubbles
- `text-muted-fg` em metadata pills
- `font-mono` em telefone/custo
- `font-display italic` em nomes (consistência com pages existentes)

### Loading

Suspense boundary no thread page → skeleton: 3-4 bubbles cinza shimmer.

### Errors

`error.tsx` no layout: "Não consegui carregar as conversas. Tenta de novo daqui a pouco?" + botão reload.

### Acessibilidade

- Cada row da lista é `<Link>` (foco nativo).
- Selected row tem `aria-current="page"`.
- Bubbles têm `<article aria-label="Mensagem de Rosangela às 10:42 — Bom dia">`.
- Pill de metadata é `<dl>` semântica (model, cost, latência como pares).

## Refresh

V1: SSR per page load + botão manual `↻` que faz `revalidatePath`. Sem polling.

V2 (fora do escopo): considerar Server-Sent Events ou polling de 30s pra refletir novas mensagens chegando.

## Migration plan resumido

(Detalhamento vai no plano de implementação via writing-plans.)

1. Backend (queries.ts + stats-service.ts + mocks.ts) — independente, testável isolado.
2. Componente list + thread separadamente.
3. Layout + routes.
4. Remover `RecentMessagesCard` + `fetchRecentMessages` do page.tsx.
5. Smoke test local com mocks (`USE_MOCK_STATS=true`).
6. Deploy + validação com dados reais (Rosangela e Gustavo já estão no DB).

## Testes

- **Unit (queries.ts):** mock `Querier`, valida SQL via dependency injection. Os testes existentes em `tests/` seguem esse padrão.
- **Component:** sem framework de component test instalado hoje; pular V1.
- **E2E manual:** após deploy, abrir `/agentes/mercurio/projetos/metido-a-gente/conversas`, ver lista, clicar Rosangela, conferir custo $0.0137 (sabido).

## Riscos

| Risco | Mitigação |
|---|---|
| LATERAL JOIN não acha classify (data antiga, sem ordem clara) | `LEFT JOIN` resolve com 0; UI mostra custo deflacionado mas não quebra |
| Conversa com 1000+ msgs trava o render | V1 sem virtualização; aceitar até ~500. Backlog: react-window se passar disso |
| URL com `+` em identifier malformado | encodeURIComponent/decodeURIComponent — Next.js já lida; testar manual com lead real |
| Push_name muda no meio da conversa (lead troca foto/nome WhatsApp) | Query pega o mais recente non-null — comportamento ok |
| `cost_usd` pode estar NULL em msgs antigas | `COALESCE(.., 0)` no SQL |

## Open questions

Nenhuma. Decisões fechadas via brainstorming.

## Referências

- Página atual: [src/app/(app)/agentes/[agent]/projetos/[slug]/page.tsx](../../../src/app/(app)/agentes/[agent]/projetos/[slug]/page.tsx)
- Queries existentes: [src/lib/queries.ts](../../../src/lib/queries.ts) (`getRecentMessages` linha 213)
- Worker schema: [semente-platform-worker/migrations/005_messages_and_metrics.sql](../../../../../../semente-platform-worker/migrations/005_messages_and_metrics.sql), [006_messages_project.sql](../../../../../../semente-platform-worker/migrations/006_messages_project.sql)
- Design system: `@beeads/ui` (ver CLAUDE.md global em `~/.claude/`)
