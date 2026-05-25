# Migração agentes-beeads → @beeads/*

**Status:** aguardando publicação `@beeads/*@0.1.0` no npm.

Quando os pacotes estiverem publicados (ver `c:/Users/gusta/Projetos/beeads-ui/docs/PUBLISH_CHECKLIST.md`), execute os passos abaixo:

## 1. Instalar pacotes

```bash
cd "c:/Users/gusta/Projetos/agentes-beeads"
pnpm add @beeads/tokens @beeads/fonts @beeads/ui @beeads/charts
```

## 2. Remover deps duplicadas

Estas vão vir como deps transitivas via @beeads/ui:

```bash
pnpm remove @base-ui/react class-variance-authority clsx tailwind-merge next-themes sonner
```

(Mantenha lucide-react se você usa direto em componentes app-specific.)

## 3. Substituir globals.css

Editar `src/app/globals.css` — substituir o conteúdo por:

```css
@import "@beeads/tokens/theme.css";
@import "@beeads/ui/styles.css";
@import "@beeads/charts/styles.css";

/* App-specific overrides ficam abaixo (raros) */
```

## 4. Atualizar layout.tsx

Em `src/app/layout.tsx`:

```tsx
import { fraunces, geistMono } from "@beeads/fonts";
import { ThemeProvider, Toaster } from "@beeads/ui";

// (remover import local de Fraunces/Geist_Mono do next/font/google)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## 5. Substituir imports de componentes locais

Buscar:
```bash
cd "c:/Users/gusta/Projetos/agentes-beeads"
pnpm exec grep -rn 'from "@/components/ui/' src --include="*.tsx" --include="*.ts"
```

Substituir todos:
- `from "@/components/ui/button"` → `from "@beeads/ui"`
- `from "@/components/ui/card"` → `from "@beeads/ui"`
- `from "@/components/ui/input"` → `from "@beeads/ui"`
- `from "@/lib/utils"` (só o cn) → `from "@beeads/ui"`

## 6. Deletar arquivos locais redundantes

```bash
rm src/components/ui/button.tsx
rm src/components/ui/card.tsx
rm src/components/ui/input.tsx
# Manter components/ui/ se outros componentes app-specific moram lá
```

Substituir `src/lib/utils.ts` por re-export:

```ts
export { cn } from "@beeads/ui";
```

## 7. (Opcional) Substituir charts custom

Se há charts em `src/components/cost-timeseries-chart.tsx`, `tier-breakdown-donut.tsx`, etc., considerar usar `@beeads/charts`:

```tsx
import { AreaChart, ChartFrame, DonutChart } from "@beeads/charts";
```

## 8. Build e validação visual

```bash
pnpm build
pnpm dev
```

Em http://localhost:3000 (ou porta do projeto):
- Botões parecem iguais ao de antes (paleta honey preservada)
- Cards parecem iguais
- Fontes Fraunces (títulos) e Geist Mono (corpo) carregadas
- Dark mode se ainda não tinha, agora pode adicionar com toggle do next-themes

## 9. Commit

```bash
git add . ; git commit -m "refactor: migrate to @beeads/* design system v0.1.0"
```

## 10. Capturar aprendizados

Em `c:/Users/gusta/Projetos/beeads-ui/docs/migrations/agentes-beeads-notes.md`, listar:
- Componentes/variantes que faltaram no @beeads/ui
- Tokens que faltaram no @beeads/tokens
- DX issues
- Para cada gap: criar issue no repo beeads-ui

```bash
cd "c:/Users/gusta/Projetos/beeads-ui" ; gh issue create --title "<gap>" --body "<contexto da migração agentes-beeads>"
```
