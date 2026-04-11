# Skill: Architecture Guardrails

## Objetivo
Impedir deriva arquitetural e garantir consistência com a estrutura existente.

## Fontes obrigatórias
- `reference/system.md`
- `reference/frontend.md`
- `reference/api.md`
- `reference/database.md`

## Regras rígidas
- Não criar novo padrão de pasta sem justificativa explícita.
- Services permanecem puros (sem UI).
- Hooks fazem orquestração de estado/UI.
- Componentes não implementam regra de negócio complexa.
- Banco sempre protegido por RLS e validação no domínio.

## Mapa de colocação de código
- Regra de negócio: `apps/web/src/modules/*/services`
- Contratos Zod: `apps/web/src/modules/*/contracts.ts`
- Orquestração React Query: `apps/web/src/modules/*/hooks`
- UI de domínio: `apps/web/src/modules/*/components`
- Integrações de banco: Supabase client/server conforme contexto.

## Checklist de arquitetura
- [ ] O arquivo está no módulo correto.
- [ ] Não há acoplamento indevido entre UI e service.
- [ ] Tipos e contratos foram atualizados.
- [ ] Documentação foi ajustada se estrutura mudou.
