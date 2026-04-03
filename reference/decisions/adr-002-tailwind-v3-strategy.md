# ADR 002: Decisão de Manutenção do Tailwind CSS v3.4

## Status
Aceito

## Contexto
Durante a implementação das refinações visuais e transição para o módulo modular de Checkout, houve uma tentativa de utilização do Tailwind CSS v4. No entanto, a versão 4+ introduz mudanças profundas no parser PostCSS (exigindo `@tailwindcss/postcss`) e descarta compatibilidades com diretivas `@layer` legadas sem configurações externas complexas.

Além disso, o Next.js 14.2.3 utilizado no monorepo Agon apresentou conflitos de compilação com a classe utilitária dinâmica `border-border` no estágio inicial de parse do CSS.

## Decisão
Decidimos fixar e manter a versão **Tailwind CSS v3.4.19** para o frontend `apps/web`.

## Consequências
- **Estabilidade**: O build volta a ser previsível e compatível com o ecossistema Shadcn/UI e PostCSS padrão.
- **Desenvolvimento**: Agentes e desenvolvedores devem utilizar a sintaxe oficial da v3 (configuração via `tailwind.config.js` em vez de `@theme` no CSS).
- **Performance**: Manutenção do runtime JIT maduro da v3.

## Regras de Implementação
1. Não realizar o upgrade para v4 sem uma migração completa documentada de todos os arquivos `.css`.
2. Utilizar `border-color: hsl(var(--border))` em seletores globais para evitar ambiguidades no parser.
