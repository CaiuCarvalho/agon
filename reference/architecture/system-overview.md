# Visão Geral do Sistema

## Entidades e Separação Arquitetônica
O Agon baseia-se numa arquitetura híbrida de Monorepo (orquestrado via Turborepo) com o foco central na orquestração de ecossistemas web limpos através de Server Components.

### Aplicações ativas (`apps/`)
1. **Frontend / Web App:**
   - Aplicação Next.js (App Router) englobando tanto o ecossistema do cliente (Storefront) quanto as rotas sub-área administrativas (`/admin`). O frontend lida com Server Side Rendering (SSR) dinâmico onde necessário (fichas de produtos, carrinhos).

### Bibliotecas Globais (`packages/`)
- Módulos encapsulados que não dependem diretamente de `apps/web`. Compartilham design systems, lógicas de hooks vitais ou validadores Zod. 

## Como se comunicam
- **Interface e Servidor Next.js (Server Actions):** O cliente lida com intenções ou formulários via mutações controladas que acertam as Actions de Servidor embutidas de maneira segura e tipada. Não possuímos APIs puramente "desacompladas" dentro do frontend web no momento; o App Router e `services/` cumprem este papel.
- **Servidor Next.js e Mundo Externo:** O BFF (Backend For Frontend) do ecossistema bate no Banco de Dados via ORM isolado ou provedores REST como Stripe / Melhor Envio e Gateway de Emails, fazendo Proxy de segurança para o usuário final.
