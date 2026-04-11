# Skill: Tech Stack Rules

## Objetivo
Aplicar decisões técnicas do projeto sem inventar soluções fora da stack definida.

## Stack oficial
- Next.js 14 (App Router), React 18, TypeScript.
- Supabase (Postgres + Auth + Realtime).
- React Query para fetching/cache.
- Tailwind CSS + componentes UI existentes.

## Regras por tecnologia
- TypeScript:
  - Sem `any` sem justificativa.
  - Tipagem explícita em fronteiras de módulo.
- Next.js:
  - Server Components por padrão; Client quando necessário.
  - Rotas API com validação e tratamento de erro consistente.
- Supabase:
  - Preferir políticas RLS + RPC para operações críticas.
  - Não confiar em validação exclusiva de frontend.
- React Query:
  - `queryKey` estável.
  - Invalidação/otimização apenas no escopo necessário.

## Anti-patterns proibidos
- Regras de negócio diretamente no componente.
- Duplicação de schema (sem usar contracts).
- Consulta em tabela sensível sem política adequada.
- Fluxo crítico sem caminho de rollback/erro.
