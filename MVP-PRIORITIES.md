# MVP Priorities - Agon E-commerce

**Data:** 2026-04-05  
**Objetivo:** Sistema funcional e simplificado para lançamento rápido

## Status Atual

### ✅ Completado
1. **Autenticação** - Login, cadastro, logout funcionando
2. **Catálogo de Produtos** - CRUD completo, listagem, busca, filtros
3. **Carrinho & Wishlist** - Persistência com Supabase, Realtime sync
4. **Segurança Básica** - RLS policies, migrations, validação de env

### 🔧 Funcionalidades Faltantes para MVP

## Prioridade CRÍTICA (Bloqueantes para MVP)

### 1. Checkout Básico
**Status:** Não iniciado  
**Necessário para:** Processar pedidos

**Escopo Mínimo:**
- Página de checkout com resumo do carrinho
- Formulário de dados de entrega (nome, endereço, telefone)
- Criar pedido no banco (tabela `orders` e `order_items`)
- Página de confirmação do pedido
- **SEM** integração com pagamento (pode ser "Pagamento na Entrega")
- **SEM** cálculo de frete
- **SEM** cupons de desconto

**Estimativa:** 1-2 dias

---

### 2. Admin - Gestão de Pedidos
**Status:** Não iniciado  
**Necessário para:** Operação da loja

**Escopo Mínimo:**
- Listar todos os pedidos
- Ver detalhes do pedido (itens, cliente, endereço)
- Atualizar status do pedido (Pendente → Processando → Enviado → Entregue)
- **SEM** filtros avançados
- **SEM** relatórios
- **SEM** analytics

**Estimativa:** 1 dia

---

## Prioridade ALTA (Importantes mas não bloqueantes)

### 3. Emails Transacionais Básicos
**Status:** Não iniciado  
**Necessário para:** Comunicação com cliente

**Escopo Mínimo:**
- Email de confirmação de pedido (com Resend)
- Template HTML simples
- **SEM** email de cadastro
- **SEM** email de recuperação de senha
- **SEM** email de atualização de status

**Estimativa:** 0.5 dia

---

### 4. Perfil de Usuário Básico
**Status:** Estrutura existe, falta implementação  
**Necessário para:** Usuário ver seus pedidos

**Escopo Mínimo:**
- Ver histórico de pedidos
- Ver detalhes de cada pedido
- **SEM** edição de perfil
- **SEM** CRUD de endereços
- **SEM** avatar

**Estimativa:** 0.5 dia

---

## Prioridade MÉDIA (Nice to have)

### 5. Melhorias de UX
- Loading states mais polidos
- Mensagens de erro mais amigáveis
- Animações suaves
- **Pode ser feito incrementalmente**

---

## O que NÃO fazer agora (Pós-MVP)

❌ Integração com Stripe/pagamento real  
❌ Cálculo de frete  
❌ Cupons de desconto  
❌ Avaliações de produtos  
❌ Analytics e relatórios  
❌ Upload de imagens (usar URLs por enquanto)  
❌ Storage security avançado  
❌ Rate limiting  
❌ Logging estruturado  
❌ Backup strategy  
❌ Auth avançado (JWT rotation, etc)  
❌ Testes automatizados extensivos  

---

## Plano de Ação Recomendado

### Semana 1 - MVP Core
1. **Dia 1-2:** Implementar Checkout Básico
2. **Dia 3:** Implementar Admin - Gestão de Pedidos
3. **Dia 4:** Implementar Emails Transacionais
4. **Dia 5:** Implementar Perfil de Usuário Básico

### Semana 2 - Polish & Launch
1. **Dia 1-2:** Testes manuais end-to-end
2. **Dia 3:** Correções de bugs
3. **Dia 4:** Melhorias de UX
4. **Dia 5:** Deploy e lançamento

---

## Próxima Feature a Implementar

**Feature:** Checkout Básico  
**Justificativa:** Sem checkout, não há como processar pedidos. É o bloqueante #1 para MVP.

**Quer que eu crie a spec para o Checkout Básico agora?**

---

## Notas Importantes

- Foco em funcionalidade, não perfeição
- Usar soluções simples (ex: "Pagamento na Entrega" em vez de Stripe)
- Evitar over-engineering
- Priorizar features que desbloqueiam o fluxo de vendas
- Melhorias podem ser feitas incrementalmente após lançamento

