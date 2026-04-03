# ADR 001 - Stack Arquitetural Inicial

* **Data:** 03 de Abril de 2026
* **Status:** Aceito

## Contexto e Problema
O e-commerce legado e back-office de gestão do projeto apresentava altos resquícios e dependências desestabilizadas e fragmentadas (código sujo) impedindo rodar os painéis de forma minimalista. Precisávamos de uma base tecnológica simples, extremamente moderna e resiliente para atuar como alicerce duradouro do Agon, focada na alta produtividade, fácil validação por outros agentes de IA e unificação segura em ambiente local.

## Decisão
Implementar uma infraestrutura baseada ativamente em monorepo com suporte de ponta-a-ponta a Server Actions (Next.js App Router). Extinção total de dependências velhas. Adotou-se Typescript onipresente.

### Adições Cruciais de Ferramentas:
- Roteamento nativo Server components.
- Delegação de estados UI com Radix e Tailwind Merge (design componentizado puro).
- Limpeza e recodificação modular isolada sob a `src/*`.

## Motivos
- A infraestrutura serverless/full-js permite ao mantenedor controlar a jornada completa de compra dentro da mesma base segura, barateando a hospedagem local (isolar servidor, mockar pagamentos em env) e o desenvolvimento corporativo via Turborepo escalará naturalmente caso precisemos injetar outros frontends B2B sem duplicação de pacotes nucleares.

## Alternativas Consideradas 
1. **Front-End SPA + Backend Microservices Isolado.**
   * _Negado_ porque a redundância de types entre frontend e os múltiplos backends exige um overhead e custos de implantação drásticos para o primeiro release, fragmentando o repasse e compreensão das inteligências trabalhando na stack original.
2. **Reuso direto do motor Frontend Antigo com dependências forçadas.**
   * _Fortemente Negado._ Tentava salvar lógicas quebradas por `legacy-peer-deps`. Destruía o critério de "Isolamento limpo e minimalista" ordenado nas regras originais pelo arquiteto (SDD requirement). Eliminamos dependências velhas e limpamos as rotas corrompidas.
