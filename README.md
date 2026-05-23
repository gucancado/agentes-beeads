# agentes-beeads

Console web cross-agente da plataforma Semente. Stats por agente/projeto e edição de configs (PROJECT.md, cadência, guardrails) — single-user.

Spec: `c:/Users/gusta/Projetos/agente-semente/docs/superpowers/specs/2026-05-22-agentes-beeads-design.md`.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- next-auth v5 (Credentials provider, single-user)
- Registry de agentes em `agents.yml` (parser zod-validated)

## Dev local

1. Copiar env:

   ```bash
   cp .env.example .env.local
   ```

   Preencher `AUTH_SECRET` (`pnpm dlx auth secret`) e `ADMIN_PASSWORD`.

2. Instalar deps:

   ```bash
   pnpm install
   ```

3. Rodar:

   ```bash
   pnpm dev
   ```

4. Acessar `http://localhost:3000` — vai redirecionar pro login. Logar com `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

## Testes

```bash
pnpm test
```

Cobertura: parser do `agents.yml`. UI sem testes no v1.

## Status

Sub-tarefa B (scaffold) concluída. Próximas: C (stats reais via Postgres do worker), D (editores de PROJECT.md / cadência / guardrails), E (deploy Coolify + DNS).
