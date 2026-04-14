# Plano de Limpeza — Agon

Status das fases de sanitização do codebase. Cada task é commitável separadamente (`chore(cleanup): <descrição>`).

---

## ✅ Fase 1 — Concluída

- [x] **1.1** Remover `apps/web/src/hooks/useRealtimeOrders.example.tsx`
- [x] **1.2** Remover task `lint` órfã de `turbo.json`
- [x] **1.3** Remover `scripts/audit-results.json` e `scripts/audit-report.md`

---

## ✅ Fase 2 — Concluída (parcial)

- [x] **2.1** Removido `analytics.ts`, `GoogleAnalytics.tsx`, imports em `layout.tsx` e `ProductCard.tsx`
- [x] **2.2** Removidos `console.log` de request tracking em `middleware.ts` (mantido `console.error`). Redução de logs em `create-order` e webhook Mercado Pago pendente — requer decisão sobre observabilidade.
- [x] **2.3** Removido `scripts/diagnose-checkout.mjs`

## ✅ Fase 3 — Concluída (parcial)

- [~] **3.1** Nenhum `.skip()` encontrado nos testes. Arquivos `checkout-502-error-fix.test.ts`/`checkout-502-error.test.ts` mencionados no plano não existem (nomes reais são `.preservation.test.ts`/`.bugcondition.test.ts`, que passam). Nada a remover sem avaliação manual dos `bugcondition.test.ts`.
- [x] **3.2** `RESEND_API_KEY` removido de `.env.example` (zero uso no código). `NEXT_PUBLIC_API_URL` adicionado.

## ✅ Fase 4 — Parcial

- [x] **4.2** `packages/config`, `packages/types`, `packages/utils` removidos (zero imports). Workspace entry `packages/*` removida do `package.json` raiz. `npm install` OK.
- [ ] **4.1** `apps/api` — MANTIDO. `nginx.conf` proxeia `/api` → `localhost:3333`; remover quebraria produção.
- [~] **4.3** `COMANDOS-DEPLOY.sh` e `CREATE-PRODUCT-IMAGE-FALLBACKS.sh` (one-offs) removidos. `deploy.sh` e `deploy-to-vps.sh` mantidos — ambíguo qual é canônico (DEPLOY-GUIDE.md referencia `deploy-to-vps.sh`).

## ✅ Testes
- `npm test` em `apps/web`: **230/230 passando** após todas as remoções.

### Task 2.1 — Remover Google Analytics morto
- Grep por `import.*analytics` e `GA_TRACKING_ID` / `NEXT_PUBLIC_GA_ID`
- Deletar `apps/web/src/lib/analytics.ts`
- Remover imports e chamadas
- **Verificar:** `npx tsc --noEmit && npm test`

### Task 2.2 — Limpar `console.log` client-side
- **Manter** `console.error` em API routes e webhooks (observabilidade de produção)
- **Remover** `console.log` / `console.debug` em:
  - `apps/web/src/middleware.ts` (logs restantes de request tracking)
  - Client components em geral
- **Reduzir** logs informativos (manter só erros) em:
  - `apps/web/src/app/api/checkout/create-order/route.ts`
  - `apps/web/src/app/api/webhooks/mercadopago/route.ts`
- **Verificar:** `npx tsc --noEmit && npm test`

### Task 2.3 — Remover diagnóstico de checkout obsoleto
- Deletar `scripts/diagnose-checkout.mjs` (one-off pós-correção)
- **Verificar:** `npx tsc --noEmit`

---

## ⚠️ Fase 3 — Risco Médio

### Task 3.1 — Remover testes obsoletos
- Deletar testes com `.skip()` de bugs já corrigidos:
  - `apps/web/src/__tests__/checkout-502-error-fix.test.ts`
  - `apps/web/src/__tests__/checkout-502-error.test.ts`
- Avaliar `*.bugcondition.test.ts` cujos bugs já foram corrigidos (preservation test correspondente passa) e remover
- **Verificar:** `npm test`

### Task 3.2 — Consolidar `.env.example`
- Adicionar `NEXT_PUBLIC_API_URL` (presente em `.env.production`, faltando no template)
- Remover `RESEND_API_KEY` se grep confirmar que não está em uso
- Remover qualquer referência a `NEXT_PUBLIC_GA_ID`
- **Verificar:** `cd apps/web && npm run check:env`

---

## 🚨 Fase 4 — Risco Alto (exige confirmação)

### Task 4.1 — Remover `apps/api` (stub)
- Deletar diretório `apps/api/` inteiro
- Remover de `workspaces` no `package.json` raiz
- Confirmar que CI/deploy não referenciam
- **Verificar:** `npm install && npm run build`

### Task 4.2 — Avaliar `packages/*`
- Grep `@agon/config`, `@agon/types`, `@agon/utils` em `apps/web/`
- Se zero imports → deletar `packages/config/`, `packages/types/`, `packages/utils/` e entradas de workspace
- Se só 1 app sobrar, considerar remover Turborepo inteiro
- **Verificar:** `npm install && npx tsc --noEmit && npm test`

### Task 4.3 — Limpar scripts shell de deploy
- Identificar deploy real (VPS? Vercel?)
- Deletar scripts não usados dentre:
  - `deploy.sh`
  - `deploy-to-vps.sh`
  - `COMANDOS-DEPLOY.sh`
  - `CREATE-PRODUCT-IMAGE-FALLBACKS.sh`
- **Verificar:** pipeline de deploy continua funcional

---

## ❓ Perguntas Bloqueantes (Fase 4)

1. Qual é o caminho real de deploy hoje? Quais scripts `.sh` estão em uso?
2. `RESEND_API_KEY` está conectado em algum lugar? (CLAUDE.md menciona Resend, grep não achou uso)
3. `apps/api` pode ser deletado ou é placeholder para feature futura?
4. `packages/*` pode ser deletado se não houver imports?

---

## 🛠 Tooling Sugerido

```bash
npx knip                                               # unused files/exports/deps
npx ts-prune                                           # unused TS exports
npx depcheck apps/web                                  # unused dependencies
npx eslint . --rule 'no-console: error' --no-eslintrc  # surface console.*
```
