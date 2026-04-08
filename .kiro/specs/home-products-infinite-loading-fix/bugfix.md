# Bugfix Requirements Document

## Introduction

Na página inicial do site (`apps/web/src/app/page.tsx`), os produtos não carregam e o componente fica em estado de loading infinito. O hook `useProducts({ limit: 4, sortBy: 'latest' })` nunca retorna dados, enquanto outras páginas que usam o mesmo hook funcionam normalmente. Os dados existem no Supabase e são acessíveis em outras rotas (produtos individuais, carrinho), indicando que o problema está isolado à query específica da home page.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a página inicial (`/`) é carregada THEN o componente `useProducts({ limit: 4, sortBy: 'latest' })` nunca retorna dados e permanece em estado `isLoading: true` indefinidamente

1.2 WHEN a query do React Query é executada com os filtros `{ limit: 4, sortBy: 'latest' }` THEN a promise do `getProducts()` nunca resolve nem rejeita, causando timeout silencioso

1.3 WHEN o usuário acessa a página inicial THEN o componente `Loader2` fica girando infinitamente sem exibir produtos ou mensagem de erro

1.4 WHEN a query falha silenciosamente THEN nenhum erro é capturado pelo React Query ou exibido no console do navegador

### Expected Behavior (Correct)

2.1 WHEN a página inicial (`/`) é carregada THEN o sistema SHALL executar a query `getProducts({ limit: 4, sortBy: 'latest' })` e retornar os 4 produtos mais recentes em até 10 segundos

2.2 WHEN a query do React Query é executada com os filtros `{ limit: 4, sortBy: 'latest' }` THEN o sistema SHALL resolver a promise com sucesso ou rejeitar com erro tratável dentro do timeout configurado

2.3 WHEN os produtos são carregados com sucesso THEN o sistema SHALL exibir os 4 produtos mais recentes no grid da home page

2.4 WHEN a query falha por timeout ou erro de conexão THEN o sistema SHALL capturar o erro, registrar no console e exibir mensagem de erro amigável ao usuário

### Unchanged Behavior (Regression Prevention)

3.1 WHEN outras páginas (produtos individuais, carrinho, catálogo completo) usam `useProducts` ou `useProduct` THEN o sistema SHALL CONTINUE TO carregar os dados corretamente sem afetar essas rotas

3.2 WHEN a query é executada sem os filtros `{ limit: 4, sortBy: 'latest' }` (ex: catálogo completo) THEN o sistema SHALL CONTINUE TO funcionar normalmente

3.3 WHEN o usuário adiciona produtos ao carrinho em outras páginas THEN o sistema SHALL CONTINUE TO persistir os dados no Supabase corretamente

3.4 WHEN a query do React Query usa cache válido (staleTime não expirado) THEN o sistema SHALL CONTINUE TO retornar dados do cache sem fazer nova requisição ao Supabase

3.5 WHEN o Supabase retorna dados válidos para outras queries THEN o sistema SHALL CONTINUE TO transformar e exibir os dados corretamente usando `transformProductRow()`
