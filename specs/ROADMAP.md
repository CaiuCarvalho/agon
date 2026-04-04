# Roadmap de Features - Agon

**Metodologia:** Spec-Driven Development (SDD)  
**Última Atualização:** 2026-04-04

---

## 🎯 Visão Geral

Este roadmap segue a ordem lógica de dependências técnicas e de negócio, garantindo que cada feature tenha as fundações necessárias antes de ser implementada.

---

## ✅ Fase 1: Fundação (Concluída)

### 1.1. Autenticação Real com Supabase Auth ✅
**Status:** Concluído (Score SDD: 81/100)  
**Prioridade:** 🔴 Crítica (Bloqueante para todas as outras)

**Entregas:**
- Cadastro (email + senha)
- Login com sessão persistente
- Logout
- Proteção de rotas via middleware
- Tabela `profiles` com RLS
- Integração 100% real (zero mocks)

**Dependências:** Nenhuma  
**Desbloqueia:** Todas as features abaixo

---

## 🚀 Fase 2: Catálogo e Inventário (Próxima)

### 2.1. Catálogo de Produtos (CRUD) 🔵
**Status:** Não iniciado  
**Prioridade:** 🔴 Crítica (Bloqueante para carrinho e checkout)

**Objetivo:**
Implementar CRUD completo de produtos com persistência real no Supabase, substituindo os mocks atuais.

**Escopo:**
- **Tabela `products`:**
  - `id`, `name`, `description`, `price`, `category`, `image_url`, `stock`, `features[]`, `rating`, `reviews`, `created_at`, `updated_at`
- **Admin:**
  - Criar produto (form com upload de imagem via Cloudinary/Supabase Storage)
  - Editar produto
  - Deletar produto (soft delete)
  - Listar produtos com paginação
- **Frontend:**
  - Listagem de produtos (grid com filtros)
  - Busca instantânea (debounced)
  - Página de detalhes do produto
  - Filtros por categoria, preço, rating
- **RLS:**
  - Leitura pública (qualquer usuário)
  - Escrita apenas para `role = 'admin'`

**Critérios de Aceitação:**
- [ ] Admin pode criar/editar/deletar produtos
- [ ] Frontend lista produtos do banco real
- [ ] Busca funciona com debounce de 300ms
- [ ] Filtros aplicam-se corretamente
- [ ] Página de detalhes carrega dados reais
- [ ] RLS impede usuários comuns de editar

**Dependências:**
- ✅ Autenticação (para admin)

**Desbloqueia:**
- Carrinho Persistente
- Wishlist Persistente
- Checkout Real

**Estimativa:** 2-3 dias

---

### 2.2. Upload de Imagens (Cloudinary ou Supabase Storage) 🔵
**Status:** Não iniciado  
**Prioridade:** 🟡 Alta (Necessária para produtos)

**Objetivo:**
Permitir upload de imagens de produtos no admin.

**Escopo:**
- Integração com Cloudinary ou Supabase Storage
- Componente de upload com preview
- Validação de tipo/tamanho (max 5MB, apenas imagens)
- Compressão automática (max 1920x1080)
- URL retornada salva em `products.image_url`

**Critérios de Aceitação:**
- [ ] Admin pode fazer upload de imagem
- [ ] Preview aparece antes de salvar
- [ ] Validação bloqueia arquivos inválidos
- [ ] Imagem é comprimida automaticamente
- [ ] URL salva corretamente no banco

**Dependências:**
- ✅ Autenticação
- 🔵 Catálogo de Produtos (pode ser feito em paralelo)

**Desbloqueia:**
- Produtos com imagens reais

**Estimativa:** 1 dia

---

## 🛒 Fase 3: Carrinho e Wishlist

### 3.1. Carrinho Persistente (Supabase) 🔵
**Status:** Não iniciado  
**Prioridade:** 🔴 Crítica (Bloqueante para checkout)

**Objetivo:**
Substituir o carrinho mock por persistência real no Supabase, vinculado ao `user_id`.

**Escopo:**
- **Tabela `cart_items`:**
  - `id`, `user_id` (FK), `product_id` (FK), `quantity`, `size`, `created_at`, `updated_at`
- **Lógica:**
  - Carrinho vinculado ao usuário autenticado
  - Visitantes usam localStorage (migração ao fazer login)
  - Optimistic UI mantido (rollback em caso de erro)
  - Sincronização automática entre dispositivos
- **RLS:**
  - Usuário só vê/edita próprio carrinho

**Critérios de Aceitação:**
- [ ] Adicionar produto ao carrinho persiste no banco
- [ ] Remover item atualiza banco
- [ ] Alterar quantidade sincroniza
- [ ] Visitante usa localStorage
- [ ] Ao fazer login, carrinho local migra para banco
- [ ] Optimistic UI funciona (< 100ms)
- [ ] Rollback em caso de erro

**Dependências:**
- ✅ Autenticação
- 🔵 Catálogo de Produtos

**Desbloqueia:**
- Checkout Real

**Estimativa:** 2 dias

---

### 3.2. Wishlist Persistente (Supabase) 🔵
**Status:** Não iniciado  
**Prioridade:** 🟡 Alta (Melhora UX)

**Objetivo:**
Substituir wishlist mock por persistência real no Supabase.

**Escopo:**
- **Tabela `wishlist_items`:**
  - `id`, `user_id` (FK), `product_id` (FK), `created_at`
- **Lógica:**
  - Limite de 20 itens por usuário
  - Visitantes usam localStorage
  - Sincronização ao fazer login
- **RLS:**
  - Usuário só vê/edita própria wishlist

**Critérios de Aceitação:**
- [ ] Toggle favorito persiste no banco
- [ ] Limite de 20 itens respeitado
- [ ] Visitante usa localStorage
- [ ] Ao fazer login, wishlist local migra
- [ ] Página `/favoritos` lista itens reais

**Dependências:**
- ✅ Autenticação
- 🔵 Catálogo de Produtos

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 1 dia

---

## 💳 Fase 4: Checkout e Pagamentos

### 4.1. Checkout Real (Supabase + Validação Server-Side) 🔵
**Status:** Não iniciado  
**Prioridade:** 🔴 Crítica (Core do e-commerce)

**Objetivo:**
Implementar fluxo de checkout completo com validação server-side e criação de pedidos.

**Escopo:**
- **Tabela `orders`:**
  - `id`, `user_id` (FK), `status`, `total`, `payment_method`, `shipping_address`, `created_at`, `updated_at`
- **Tabela `order_items`:**
  - `id`, `order_id` (FK), `product_id` (FK), `quantity`, `price_snapshot`, `size`
- **Fluxo:**
  1. Usuário revisa carrinho
  2. Preenche dados de entrega
  3. Escolhe método de pagamento
  4. Server Action valida estoque e preços (Domain Rule #1)
  5. Cria pedido com snapshot de preços (Domain Rule #4)
  6. Limpa carrinho
  7. Redirect para `/pedido/confirmado/[id]`
- **Validações Server-Side:**
  - Estoque disponível
  - Preços não manipulados
  - Quantidade > 0
  - Endereço válido

**Critérios de Aceitação:**
- [ ] Usuário preenche dados de entrega
- [ ] Server Action valida estoque antes de criar pedido
- [ ] Preços são recalculados no backend (não confia no frontend)
- [ ] Pedido criado com snapshot de preços
- [ ] Carrinho limpo após pedido
- [ ] Página de confirmação mostra detalhes
- [ ] Email de confirmação enviado (Resend)

**Dependências:**
- ✅ Autenticação
- 🔵 Catálogo de Produtos
- 🔵 Carrinho Persistente

**Desbloqueia:**
- Integração com Stripe

**Estimativa:** 3 dias

---

### 4.2. Integração com Stripe (Pagamento Real) 🔵
**Status:** Não iniciado  
**Prioridade:** 🔴 Crítica (Monetização)

**Objetivo:**
Integrar Stripe para processar pagamentos reais.

**Escopo:**
- Stripe Checkout Session
- Webhook para confirmar pagamento
- Atualização de status do pedido (`pending` → `paid`)
- Tratamento de falhas de pagamento

**Critérios de Aceitação:**
- [ ] Usuário é redirecionado para Stripe Checkout
- [ ] Webhook confirma pagamento
- [ ] Status do pedido atualizado
- [ ] Email de confirmação enviado após pagamento
- [ ] Falhas de pagamento tratadas graciosamente

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real

**Desbloqueia:**
- Sistema completo de vendas

**Estimativa:** 2 dias

---

## 📧 Fase 5: Notificações e Comunicação

### 5.1. Emails Transacionais (Resend) 🔵
**Status:** Não iniciado  
**Prioridade:** 🟡 Alta (Melhora UX)

**Objetivo:**
Enviar emails automáticos em eventos importantes.

**Escopo:**
- Confirmação de cadastro
- Confirmação de pedido
- Atualização de status do pedido
- Recuperação de senha
- Templates HTML responsivos

**Critérios de Aceitação:**
- [ ] Email enviado ao cadastrar
- [ ] Email enviado ao criar pedido
- [ ] Email enviado ao pagar pedido
- [ ] Email de recuperação de senha funciona
- [ ] Templates são responsivos

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 1-2 dias

---

## 👤 Fase 6: Perfil e Gestão de Conta

### 6.1. Perfil de Usuário Completo 🔵
**Status:** Parcialmente implementado (apenas estrutura)  
**Prioridade:** 🟡 Alta (Melhora UX)

**Objetivo:**
Permitir usuário editar dados pessoais, endereços e ver histórico de pedidos.

**Escopo:**
- Edição de perfil (nome, avatar, telefone, CPF)
- CRUD de endereços
- Histórico de pedidos
- Rastreamento de pedidos

**Critérios de Aceitação:**
- [ ] Usuário edita dados pessoais
- [ ] Usuário adiciona/edita/remove endereços
- [ ] Histórico de pedidos lista pedidos reais
- [ ] Detalhes do pedido mostram itens e status

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 2 dias

---

## 🛡️ Fase 7: Admin Dashboard

### 7.1. Admin: Gestão de Pedidos 🔵
**Status:** Não iniciado  
**Prioridade:** 🟡 Alta (Operacional)

**Objetivo:**
Permitir admin visualizar e gerenciar pedidos.

**Escopo:**
- Listagem de pedidos com filtros (status, data, usuário)
- Detalhes do pedido
- Atualização de status (`pending` → `processing` → `shipped` → `delivered`)
- Cancelamento de pedidos

**Critérios de Aceitação:**
- [ ] Admin lista todos os pedidos
- [ ] Admin filtra por status/data
- [ ] Admin atualiza status do pedido
- [ ] Admin cancela pedidos
- [ ] Cliente recebe email ao mudar status

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real
- 🔵 Emails Transacionais

**Desbloqueia:**
- Operação completa da loja

**Estimativa:** 2 dias

---

### 7.2. Admin: Analytics e Relatórios 🔵
**Status:** Não iniciado  
**Prioridade:** 🟢 Média (Nice to have)

**Objetivo:**
Dashboard com métricas de vendas e conversão.

**Escopo:**
- Total de vendas (dia/semana/mês)
- Produtos mais vendidos
- Taxa de conversão
- Gráficos com Chart.js ou Recharts

**Critérios de Aceitação:**
- [ ] Dashboard mostra métricas em tempo real
- [ ] Gráficos são interativos
- [ ] Filtros por período funcionam

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real
- 🔵 Admin: Gestão de Pedidos

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 2-3 dias

---

## 🎨 Fase 8: Melhorias de UX

### 8.1. Avaliações de Produtos 🔵
**Status:** Não iniciado  
**Prioridade:** 🟢 Média (Melhora conversão)

**Objetivo:**
Permitir usuários avaliarem produtos comprados.

**Escopo:**
- Tabela `reviews` (user_id, product_id, rating, comment)
- Apenas usuários que compraram podem avaliar
- Média de rating calculada automaticamente

**Critérios de Aceitação:**
- [ ] Usuário avalia produto comprado
- [ ] Rating médio atualizado
- [ ] Reviews aparecem na página do produto

**Dependências:**
- ✅ Autenticação
- 🔵 Catálogo de Produtos
- 🔵 Checkout Real

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 2 dias

---

### 8.2. Cupons de Desconto 🔵
**Status:** Não iniciado  
**Prioridade:** 🟢 Média (Marketing)

**Objetivo:**
Sistema de cupons de desconto.

**Escopo:**
- Tabela `coupons` (code, discount_type, discount_value, expires_at)
- Validação no checkout
- Aplicação de desconto no total

**Critérios de Aceitação:**
- [ ] Admin cria cupons
- [ ] Usuário aplica cupom no checkout
- [ ] Desconto calculado corretamente
- [ ] Cupons expirados são rejeitados

**Dependências:**
- ✅ Autenticação
- 🔵 Checkout Real

**Desbloqueia:**
- Nenhuma (feature independente)

**Estimativa:** 1-2 dias

---

## 📊 Resumo de Prioridades

### 🔴 Críticas (Bloqueantes)
1. ✅ Autenticação Real (Concluído)
2. 🔵 Catálogo de Produtos (Próxima)
3. 🔵 Carrinho Persistente
4. 🔵 Checkout Real
5. 🔵 Integração com Stripe

### 🟡 Altas (Importantes)
6. 🔵 Upload de Imagens
7. 🔵 Wishlist Persistente
8. 🔵 Emails Transacionais
9. 🔵 Perfil de Usuário Completo
10. 🔵 Admin: Gestão de Pedidos

### 🟢 Médias (Nice to have)
11. 🔵 Admin: Analytics
12. 🔵 Avaliações de Produtos
13. 🔵 Cupons de Desconto

---

## 🎯 Próxima Feature Recomendada

**Feature:** Catálogo de Produtos (CRUD)  
**Justificativa:** Bloqueante para carrinho, wishlist e checkout. Sem produtos reais, não há e-commerce.

**Quando começar:**
Após validação completa da autenticação em produção.

---

**Última Atualização:** 2026-04-04  
**Metodologia:** Spec-Driven Development (SDD)
