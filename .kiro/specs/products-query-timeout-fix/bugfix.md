# Bugfix Requirements Document

## Introduction

A query `getProducts` está apresentando timeout de 10 segundos no primeiro carregamento da página inicial em produção, especificamente na seção "Equipamentos da Seleção". Após o timeout, o usuário precisa clicar em "Tentar Novamente" para que os produtos sejam carregados com sucesso. Este comportamento indica um problema de cold start do Supabase combinado com possível falta de otimização na query (índices ausentes ou query ineficiente).

O impacto é crítico para a experiência do usuário, pois a primeira impressão da loja é uma tela de loading seguida de erro, exigindo interação manual para visualizar os produtos.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a página inicial é carregada pela primeira vez (cold start) THEN a query `getProducts` excede o timeout de 10 segundos e retorna erro "[getProducts] Query timeout"

1.2 WHEN o timeout ocorre THEN o usuário vê uma mensagem de erro "Erro ao carregar produtos" com botão "Tentar Novamente" ao invés dos produtos

1.3 WHEN o usuário clica em "Tentar Novamente" após o timeout THEN a query executa com sucesso e os produtos são exibidos (porque o Supabase já está "aquecido")

### Expected Behavior (Correct)

2.1 WHEN a página inicial é carregada pela primeira vez THEN a query `getProducts` SHALL completar em menos de 10 segundos e retornar os produtos com sucesso

2.2 WHEN a query está em execução THEN o sistema SHALL exibir um indicador de loading apropriado sem timeout

2.3 WHEN ocorrer um timeout inevitável (problemas de rede, servidor) THEN o sistema SHALL implementar retry automático antes de exibir erro ao usuário

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a query `getProducts` é executada com filtros (search, categoryId, minPrice, maxPrice, minRating) THEN o sistema SHALL CONTINUE TO aplicar todos os filtros corretamente

3.2 WHEN a query `getProducts` é executada com paginação (page, limit) THEN o sistema SHALL CONTINUE TO retornar os produtos paginados corretamente

3.3 WHEN a query `getProducts` é executada com ordenação (sortBy: latest, oldest, price_asc, price_desc) THEN o sistema SHALL CONTINUE TO ordenar os produtos corretamente

3.4 WHEN a query `getProducts` retorna dados THEN o sistema SHALL CONTINUE TO transformar os dados de snake_case para camelCase corretamente

3.5 WHEN a query `getProducts` é executada com busca textual (search) THEN o sistema SHALL CONTINUE TO usar full-text search em português nos campos name e description

3.6 WHEN produtos soft-deleted existem na base THEN o sistema SHALL CONTINUE TO excluí-los dos resultados (deleted_at IS NULL)

3.7 WHEN a query `getProducts` falha por erro do Supabase (não timeout) THEN o sistema SHALL CONTINUE TO lançar erro com mensagem apropriada

3.8 WHEN múltiplas queries `getProducts` são executadas com filtros diferentes THEN o sistema SHALL CONTINUE TO cachear os resultados independentemente (React Query)
