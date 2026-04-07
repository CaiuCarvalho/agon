# Bugfix Requirements Document

## Introduction

Este documento descreve a correção de 4 problemas críticos identificados na aplicação Agon que impedem funcionalidades essenciais de e-commerce: navegação autenticada, adição de produtos ao carrinho, visualização de histórico de pedidos e gerenciamento de endereços de entrega.

Estes bugs afetam diretamente a experiência do usuário e a capacidade de completar o fluxo de compra, resultando em perda de conversão e frustração dos clientes.

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: Redirecionamento Incorreto do Botão "Juntar-se à Elite"

1.1 WHEN um usuário autenticado clica no botão "Juntar-se à Elite" na página inicial THEN o sistema redireciona para `/cadastro` (página de registro)

1.2 WHEN um usuário autenticado acessa `/cadastro` THEN o sistema permite acesso à página de registro mesmo já estando logado

#### Bug 2: Falha ao Adicionar Itens ao Carrinho

1.3 WHEN um usuário clica em "Adicionar ao Carrinho" em qualquer produto THEN o sistema não adiciona o item ao carrinho

1.4 WHEN a função `add_to_cart_atomic` é chamada no Supabase THEN o sistema pode falhar silenciosamente se a função RPC não existir ou tiver erro de execução

#### Bug 3: Loading Infinito no Histórico de Pedidos

1.5 WHEN um usuário acessa a seção "Histórico de Pedidos" no perfil THEN o sistema exibe "Buscando seu histórico..." indefinidamente

1.6 WHEN a query do Supabase para buscar pedidos falha THEN o sistema não exibe mensagem de erro apropriada ao usuário

#### Bug 4: Loading Infinito ao Adicionar Endereço

1.7 WHEN um usuário preenche o formulário de endereço e clica em "Salvar" THEN o botão fica em estado de loading indefinidamente

1.8 WHEN o insert de endereço no Supabase falha (por RLS ou outro erro) THEN o sistema não exibe feedback de erro ao usuário

### Expected Behavior (Correct)

#### Bug 1: Redirecionamento Inteligente Baseado em Autenticação

2.1 WHEN um usuário autenticado clica no botão "Juntar-se à Elite" na página inicial THEN o sistema SHALL redirecionar para `/perfil` ou `/products`

2.2 WHEN um usuário não autenticado clica no botão "Juntar-se à Elite" THEN o sistema SHALL redirecionar para `/cadastro`

#### Bug 2: Adição Bem-Sucedida ao Carrinho

2.3 WHEN um usuário clica em "Adicionar ao Carrinho" THEN o sistema SHALL adicionar o item ao carrinho com sucesso e exibir toast de confirmação

2.4 WHEN a função `add_to_cart_atomic` é chamada THEN o sistema SHALL executar a operação atômica corretamente ou retornar erro específico

2.5 WHEN a função RPC não existe no banco de dados THEN o sistema SHALL exibir mensagem de erro clara ao usuário

#### Bug 3: Carregamento Correto do Histórico de Pedidos

2.6 WHEN um usuário acessa "Histórico de Pedidos" THEN o sistema SHALL carregar e exibir a lista de pedidos ou mensagem "Nenhum pedido encontrado"

2.7 WHEN a query do Supabase falha THEN o sistema SHALL exibir mensagem de erro específica (ex: "Erro ao carregar histórico. Tente novamente.")

2.8 WHEN não há pedidos para o usuário THEN o sistema SHALL exibir estado vazio com mensagem apropriada

#### Bug 4: Salvamento Bem-Sucedido de Endereço

2.9 WHEN um usuário salva um endereço válido THEN o sistema SHALL inserir no banco de dados e exibir toast de sucesso

2.10 WHEN o insert falha por RLS ou validação THEN o sistema SHALL exibir mensagem de erro específica ao usuário

2.11 WHEN o insert falha por erro de rede THEN o sistema SHALL permitir retry e exibir feedback apropriado

### Unchanged Behavior (Regression Prevention)

#### Navegação e Autenticação

3.1 WHEN um usuário não autenticado acessa qualquer página pública THEN o sistema SHALL CONTINUE TO permitir acesso normalmente

3.2 WHEN um usuário faz logout THEN o sistema SHALL CONTINUE TO redirecionar para a página inicial

#### Carrinho - Operações Existentes

3.3 WHEN um usuário atualiza a quantidade de um item no carrinho THEN o sistema SHALL CONTINUE TO atualizar com debounce de 500ms

3.4 WHEN um usuário remove um item do carrinho THEN o sistema SHALL CONTINUE TO remover com update otimista e rollback em caso de erro

3.5 WHEN um usuário guest adiciona itens ao carrinho THEN o sistema SHALL CONTINUE TO usar localStorage corretamente

#### Perfil - Outras Funcionalidades

3.6 WHEN um usuário edita um endereço existente THEN o sistema SHALL CONTINUE TO atualizar corretamente

3.7 WHEN um usuário define um endereço como padrão THEN o sistema SHALL CONTINUE TO desmarcar o anterior e marcar o novo

3.8 WHEN um usuário visualiza seus dados pessoais THEN o sistema SHALL CONTINUE TO exibir informações corretas

#### Pedidos - Outras Operações

3.9 WHEN um pedido é criado com sucesso THEN o sistema SHALL CONTINUE TO salvar na tabela `orders` com status correto

3.10 WHEN um usuário acessa detalhes de um pedido específico THEN o sistema SHALL CONTINUE TO exibir informações completas
