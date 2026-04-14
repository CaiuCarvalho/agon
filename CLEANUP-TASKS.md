# Plano de Limpeza — Agon

Status das fases de sanitização do codebase.

---

## ✅ Fase 1 — Concluída

- [x] **1.1** Remover `apps/web/src/hooks/useRealtimeOrders.example.tsx`
- [x] **1.2** Remover task `lint` órfã de `turbo.json`
- [x] **1.3** Remover `scripts/audit-results.json` e `scripts/audit-report.md`

---

## ✅ Fase 2 — Concluída

- [x] **2.1** Removido `analytics.ts`, `GoogleAnalytics.tsx`. Tracking agora via GTM hardcoded em `layout.tsx` (ID: `GTM-MCVPTPL3`). Imports removidos de `layout.tsx` e `ProductCard.tsx`.
- [x] **2.2** Removidos `console.log` de request tracking em `middleware.ts` (mantido `console.error`). Logs de `create-order` e webhook Mercado Pago — deixados como estão (observabilidade de produção).
- [x] **2.3** Removido `scripts/diagnose-checkout.mjs`

---

## ✅ Fase 3 — Concluída

- [x] **3.1** Nenhum `.skip()` encontrado nos testes. Arquivos `checkout-502-error-fix.test.ts` / `checkout-502-error.test.ts` não existem (os nomes reais são `.preservation.test.ts` / `.bugcondition.test.ts`, que passam). Nada removido.
- [x] **3.2** `RESEND_API_KEY` removido de `.env.example`. `NEXT_PUBLIC_API_URL` adicionado.

---

## ✅ Fase 4 — Concluída (com exceções documentadas)

- [x] **4.2** `packages/config`, `packages/types`, `packages/utils` removidos (zero imports). Workspace entry `packages/*` removida do `package.json` raiz.
- [~] **4.1** `apps/api` — **MANTIDO INTENCIONALMENTE.** `nginx.conf` proxeia `/api` → `localhost:3333`. Remover quebraria produção. Decisão: não mexer sem confirmar o pipeline de deploy.
- [x] **4.3** `COMANDOS-DEPLOY.sh` e `CREATE-PRODUCT-IMAGE-FALLBACKS.sh` removidos. `deploy.sh` e `deploy-to-vps.sh` mantidos (DEPLOY-GUIDE.md referencia `deploy-to-vps.sh`).

---

## ✅ Testes

- `npm test` em `apps/web`: **230/230 passando** após todas as remoções.

---

## Pendências Abertas

| # | Item | Risco | Decisão necessária |
|---|------|-------|--------------------|
| P1 | `apps/api` pode ser deletado? | Alto | Confirmar se `nginx.conf` de produção ainda proxeia `/api` |
| P2 | `deploy.sh` vs `deploy-to-vps.sh` — qual é canônico? | Baixo | Remover o obsoleto após confirmar |
| P3 | `RESEND_API_KEY` — Resend está ativo? | Baixo | Grep de uso real; se inativo, remover da env schema também |

---

## Ferramentas úteis para próxima rodada

```bash
npx knip                                               # unused files/exports/deps
npx ts-prune                                           # unused TS exports
npx depcheck apps/web                                  # unused dependencies
npx eslint . --rule 'no-console: error' --no-eslintrc  # surface console.*
```
