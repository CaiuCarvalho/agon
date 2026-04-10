# Guia de Testes Manuais - Painel Admin MVP

## Visão Geral

Este guia fornece um checklist completo para validação manual do painel administrativo. Siga cada seção em ordem para garantir que todas as funcionalidades estão operando corretamente.

## Pré-requisitos

Antes de iniciar os testes, certifique-se de que:

1. ✅ Todas as migrações foram aplicadas ao banco de dados
2. ✅ Variáveis de ambiente estão configuradas (ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_BACKUP)
3. ✅ Existe pelo menos um usuário com role='admin' no banco
4. ✅ O email do usuário admin está na whitelist
5. ✅ A aplicação está rodando localmente ou em ambiente de teste

## 1. Testes de Segurança

### 1.1 Acesso Não Autenticado
- [ ] Acesse `/admin` sem estar logado
- [ ] **Esperado**: Redirecionamento para `/login?redirect=/admin`
- [ ] Acesse `/admin/products` sem estar logado
- [ ] **Esperado**: Redirecionamento para `/login?redirect=/admin/products`

### 1.2 Acesso de Usuário Não-Admin
- [ ] Faça login com um usuário que NÃO tem role='admin'
- [ ] Tente acessar `/admin`
- [ ] **Esperado**: Redirecionamento para home com mensagem de erro
- [ ] Tente fazer chamada direta à API: `GET /api/admin/dashboard`
- [ ] **Esperado**: Status 403 com mensagem "Acesso negado"

### 1.3 Acesso de Admin Não Whitelisted
- [ ] Crie um usuário com role='admin' mas email NÃO está na whitelist
- [ ] Faça login com este usuário
- [ ] Tente acessar `/admin`
- [ ] **Esperado**: Redirecionamento para home com mensagem de erro
- [ ] Tente fazer chamada direta à API: `GET /api/admin/dashboard`
- [ ] **Esperado**: Status 403 com mensagem "Email não autorizado"

### 1.4 Acesso de Admin Autorizado
- [ ] Faça login com usuário admin whitelisted
- [ ] Acesse `/admin`
- [ ] **Esperado**: Dashboard carrega normalmente
- [ ] Verifique que a navegação está visível (Dashboard, Produtos, Pedidos)

### 1.5 Políticas RLS
- [ ] Com usuário não-admin, tente query direto no Supabase:
  ```sql
  SELECT * FROM products WHERE deleted_at IS NOT NULL;
  ```
- [ ] **Esperado**: Retorna vazio (RLS bloqueia)
- [ ] Com usuário admin, execute a mesma query
- [ ] **Esperado**: Retorna produtos deletados (RLS permite)

## 2. Testes do Dashboard

### 2.1 Carregamento de Métricas
- [ ] Acesse `/admin` como admin
- [ ] **Esperado**: Loading skeleton aparece brevemente
- [ ] **Esperado**: Métricas carregam e exibem:
  - Receita Total (em R$)
  - Total de Pedidos
  - Valor Médio do Pedido (em R$)
  - Contadores por status (Pendente, Processando, Enviado, Entregue, Cancelado)

### 2.2 Formatação de Dados
- [ ] Verifique que valores monetários estão em formato BRL: `R$ 1.234,56`
- [ ] Verifique que datas estão em formato DD/MM/YYYY HH:mm
- [ ] Verifique que números grandes têm separadores de milhar

### 2.3 Pedidos Recentes
- [ ] Verifique que a seção "Pedidos Recentes" exibe até 10 pedidos
- [ ] Verifique que pedidos estão ordenados por data (mais recente primeiro)
- [ ] Verifique que cada pedido mostra: ID, cliente, valor, status de pagamento, data

### 2.4 Estados de Erro
- [ ] Desligue o Supabase temporariamente
- [ ] Recarregue o dashboard
- [ ] **Esperado**: Mensagem de erro amigável aparece
- [ ] Religue o Supabase
- [ ] Clique em "Tentar Novamente"
- [ ] **Esperado**: Dashboard carrega normalmente

## 3. Testes de Produtos

### 3.1 Listagem de Produtos
- [ ] Acesse `/admin/products`
- [ ] **Esperado**: Tabela de produtos carrega com colunas: Nome, Preço, Estoque, Status, Ações
- [ ] Verifique que produtos deletados aparecem com badge "Inativo"
- [ ] Verifique que produtos ativos aparecem com badge "Ativo"

### 3.2 Paginação
- [ ] Se houver mais de 20 produtos, verifique que a paginação aparece
- [ ] Clique em "Próxima Página"
- [ ] **Esperado**: Próximos 20 produtos carregam
- [ ] Clique em "Página Anterior"
- [ ] **Esperado**: Volta para a página anterior

### 3.3 Criar Produto
- [ ] Clique em "Novo Produto"
- [ ] Preencha o formulário com dados válidos:
  - Nome: "Produto Teste"
  - Descrição: "Descrição do produto teste"
  - Preço: 99.90
  - Estoque: 10
  - Categoria: "test"
  - URL da Imagem: "https://example.com/image.jpg"
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Produto aparece na lista

### 3.4 Validação de Criação
- [ ] Clique em "Novo Produto"
- [ ] Tente salvar sem preencher campos obrigatórios
- [ ] **Esperado**: Mensagens de erro aparecem abaixo de cada campo
- [ ] Preencha preço negativo: -10
- [ ] **Esperado**: Erro "Preço deve ser maior ou igual a 0"
- [ ] Preencha estoque negativo: -5
- [ ] **Esperado**: Erro "Estoque deve ser maior ou igual a 0"

### 3.5 Editar Produto
- [ ] Clique no botão "Editar" de um produto
- [ ] Modifique o nome para "Produto Editado"
- [ ] Modifique o preço para 149.90
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Produto atualizado aparece na lista

### 3.6 Atualizar Estoque
- [ ] Localize o campo de estoque de um produto
- [ ] Altere o valor para 50
- [ ] Pressione Enter ou clique fora do campo
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Estoque atualizado na tabela

### 3.7 Soft Delete (Desativar)
- [ ] Clique no botão "Desativar" de um produto ativo
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Badge muda para "Inativo"
- [ ] **Esperado**: Produto continua na lista mas marcado como inativo

### 3.8 Restaurar Produto
- [ ] Clique no botão "Ativar" de um produto inativo
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Badge muda para "Ativo"

### 3.9 Estado Vazio
- [ ] Se não houver produtos, verifique que aparece mensagem "Nenhum produto encontrado"
- [ ] Verifique que o botão "Novo Produto" está visível

## 4. Testes de Pedidos

### 4.1 Listagem de Pedidos
- [ ] Acesse `/admin/orders`
- [ ] **Esperado**: Tabela de pedidos carrega com colunas: ID, Cliente, Total, Pagamento, Envio, Data
- [ ] Verifique que pedidos estão ordenados por data (mais recente primeiro)

### 4.2 Filtros de Status
- [ ] Selecione filtro "Status de Pagamento: Aprovado"
- [ ] **Esperado**: Apenas pedidos com pagamento aprovado aparecem
- [ ] Selecione filtro "Status de Envio: Enviado"
- [ ] **Esperado**: Apenas pedidos enviados aparecem
- [ ] Limpe os filtros
- [ ] **Esperado**: Todos os pedidos aparecem novamente

### 4.3 Detalhes do Pedido
- [ ] Clique em um pedido para expandir
- [ ] **Esperado**: Linha expandida mostra:
  - Lista de itens do pedido (nome, quantidade, preço)
  - Endereço de entrega completo
  - Informações de pagamento (método, status, valor)
  - Informações de envio (status, código de rastreio se houver)

### 4.4 Paginação de Pedidos
- [ ] Se houver mais de 20 pedidos, verifique que a paginação aparece
- [ ] Navegue entre páginas
- [ ] **Esperado**: Pedidos carregam corretamente em cada página

### 4.5 Botão Refresh
- [ ] Clique no botão "Atualizar"
- [ ] **Esperado**: Lista de pedidos recarrega
- [ ] **Esperado**: Loading aparece brevemente

### 4.6 Estado Vazio
- [ ] Aplique filtros que não retornam resultados
- [ ] **Esperado**: Mensagem "Nenhum pedido encontrado" aparece

## 5. Testes de Fulfillment (Envio)

### 5.1 Pedido Não Pago
- [ ] Localize um pedido com pagamento != 'approved'
- [ ] **Esperado**: Botão "Atualizar Envio" está desabilitado
- [ ] Passe o mouse sobre o botão
- [ ] **Esperado**: Tooltip "Pagamento deve estar aprovado" aparece

### 5.2 Marcar como Enviado
- [ ] Localize um pedido com pagamento aprovado e envio pendente
- [ ] Clique em "Atualizar Envio"
- [ ] Selecione status "Enviado"
- [ ] **Esperado**: Campos "Código de Rastreio" e "Transportadora" aparecem e são obrigatórios
- [ ] Tente salvar sem preencher
- [ ] **Esperado**: Mensagens de erro aparecem
- [ ] Preencha:
  - Código de Rastreio: "BR123456789"
  - Transportadora: "Correios"
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Status de envio atualiza para "Enviado"
- [ ] **Esperado**: Código de rastreio e transportadora aparecem na linha expandida

### 5.3 Marcar como Entregue
- [ ] Localize um pedido com status "Enviado"
- [ ] Clique em "Atualizar Envio"
- [ ] Selecione status "Entregue"
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Status de envio atualiza para "Entregue"

### 5.4 Validação de Progressão
- [ ] Localize um pedido com status "Enviado"
- [ ] Clique em "Atualizar Envio"
- [ ] Tente selecionar status "Pendente" (regressão)
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Erro "Não é possível regredir o status de envio"

### 5.5 Editar Código de Rastreio
- [ ] Localize um pedido já enviado
- [ ] Clique em "Atualizar Envio"
- [ ] Modifique o código de rastreio para "BR987654321"
- [ ] Clique em "Salvar"
- [ ] **Esperado**: Toast de sucesso aparece
- [ ] **Esperado**: Novo código de rastreio aparece

### 5.6 Display de Rastreio
- [ ] Expanda um pedido enviado
- [ ] **Esperado**: Seção "Informações de Envio" mostra:
  - Status de envio com badge colorido
  - Código de rastreio
  - Transportadora
  - Data de envio (se disponível)

## 6. Testes de Webhook

### 6.1 Idempotência
- [ ] Crie um pedido de teste
- [ ] Simule webhook do Mercado Pago com status "approved"
- [ ] Verifique que o pagamento foi atualizado
- [ ] Envie o MESMO webhook novamente
- [ ] **Esperado**: Resposta 200 com `{received: true, skipped: true}`
- [ ] Verifique os logs do servidor
- [ ] **Esperado**: Log indica "skipped" na segunda chamada

### 6.2 Atualização de Status
- [ ] Crie um pedido com pagamento pendente
- [ ] Simule webhook com status "approved"
- [ ] **Esperado**: `payments.status` atualiza para "approved"
- [ ] **Esperado**: `orders.status` atualiza para "processing"
- [ ] Verifique que o carrinho foi limpo

### 6.3 Derivação de Status
- [ ] Crie um pedido com pagamento aprovado
- [ ] Atualize o envio para "shipped" via painel admin
- [ ] **Esperado**: `orders.status` atualiza automaticamente para "shipped"
- [ ] Atualize o envio para "delivered"
- [ ] **Esperado**: `orders.status` atualiza automaticamente para "delivered"

### 6.4 Logging
- [ ] Envie um webhook com header `x-request-id: test-correlation-123`
- [ ] Verifique os logs do servidor
- [ ] **Esperado**: Logs contêm:
  - Prefixo `[Webhook]`
  - Timestamp
  - correlation_id: "test-correlation-123"
  - payment_id
  - old_status e new_status
  - action: "updated" ou "skipped"

## 7. Testes de Layout e Navegação

### 7.1 Navegação
- [ ] Acesse `/admin`
- [ ] Clique em "Produtos" na navegação
- [ ] **Esperado**: Navega para `/admin/products`
- [ ] Clique em "Pedidos" na navegação
- [ ] **Esperado**: Navega para `/admin/orders`
- [ ] Clique em "Dashboard" na navegação
- [ ] **Esperado**: Navega para `/admin`

### 7.2 Error Boundary
- [ ] Force um erro no componente (modifique código temporariamente)
- [ ] **Esperado**: Error Boundary captura o erro
- [ ] **Esperado**: Mensagem amigável aparece
- [ ] **Esperado**: Botão "Tentar Novamente" está disponível

### 7.3 Responsividade
- [ ] Redimensione a janela para mobile (< 768px)
- [ ] **Esperado**: Layout se adapta
- [ ] **Esperado**: Tabelas têm scroll horizontal se necessário
- [ ] **Esperado**: Navegação se adapta (menu hamburguer ou similar)

## 8. Testes de Performance

### 8.1 Queries Otimizadas
- [ ] Abra DevTools → Network
- [ ] Acesse `/admin/orders`
- [ ] Expanda um pedido
- [ ] **Esperado**: Apenas 1 request para listar pedidos (não N+1)
- [ ] **Esperado**: Detalhes do pedido já estão incluídos (JOIN)

### 8.2 Loading States
- [ ] Simule conexão lenta (DevTools → Network → Slow 3G)
- [ ] Navegue entre páginas
- [ ] **Esperado**: Loading skeletons aparecem
- [ ] **Esperado**: Não há "flash" de conteúdo vazio

### 8.3 Paginação
- [ ] Crie 100+ produtos de teste
- [ ] Acesse `/admin/products`
- [ ] **Esperado**: Apenas 20 produtos carregam por vez
- [ ] **Esperado**: Navegação entre páginas é rápida

## 9. Testes de Consistência de Dados

### 9.1 Single Source of Truth
- [ ] Crie um pedido
- [ ] Verifique `orders.status` no banco
- [ ] Atualize `payments.status` via webhook
- [ ] **Esperado**: `orders.status` deriva automaticamente (não calculado no frontend)
- [ ] Verifique que o frontend exibe o status do banco, não calcula

### 9.2 Atomicidade
- [ ] Simule erro durante atualização de pagamento (modifique RPC temporariamente)
- [ ] Envie webhook
- [ ] **Esperado**: Nenhuma atualização parcial (rollback completo)
- [ ] **Esperado**: Banco permanece consistente

### 9.3 Validação 1:1
- [ ] Tente criar 2 pagamentos para o mesmo pedido (via SQL direto)
- [ ] **Esperado**: Constraint `assert_single_payment_per_order` falha
- [ ] **Esperado**: Erro é logado

## 10. Checklist Final

- [ ] Todos os testes de segurança passaram
- [ ] Todos os testes de dashboard passaram
- [ ] Todos os testes de produtos passaram
- [ ] Todos os testes de pedidos passaram
- [ ] Todos os testes de fulfillment passaram
- [ ] Todos os testes de webhook passaram
- [ ] Todos os testes de layout passaram
- [ ] Todos os testes de performance passaram
- [ ] Todos os testes de consistência passaram
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro nos logs do servidor
- [ ] Documentação está completa e atualizada

## Problemas Encontrados

Use esta seção para documentar quaisquer problemas encontrados durante os testes:

| # | Descrição | Severidade | Status | Notas |
|---|-----------|------------|--------|-------|
| 1 |           |            |        |       |
| 2 |           |            |        |       |
| 3 |           |            |        |       |

## Notas Adicionais

- Sempre teste em ambiente de desenvolvimento/staging primeiro
- Mantenha backups do banco antes de testes destrutivos
- Documente qualquer comportamento inesperado
- Verifique logs do servidor para erros não visíveis no frontend
