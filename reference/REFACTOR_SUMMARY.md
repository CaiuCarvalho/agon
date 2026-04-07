# Refatoração de Referências - Sumário

**Data**: 2026-04-05  
**Objetivo**: Alinhar `/reference` com o código real implementado

---

## ✅ Arquivos Criados/Atualizados

### Novos Arquivos Simplificados

1. **`system.md`** - Arquitetura real do sistema
   - Stack tecnológico atual
   - Estrutura de pastas real
   - Fluxo de dados (Frontend → Services → Supabase)
   - Módulos implementados
   - Regras de desenvolvimento SDD

2. **`domain.md`** - Entidades do domínio
   - User, Product, Category
   - CartItem, WishlistItem
   - Order, OrderItem (em desenvolvimento)
   - Regras de negócio globais
   - Constraints e validações

3. **`database.md`** - Schema do banco de dados
   - Todas as tabelas com SQL completo
   - Indexes e constraints
   - RLS policies
   - RPC functions
   - Migrations aplicadas
   - Como aplicar novas migrations

4. **`api.md`** - Services e APIs
   - cartService, wishlistService
   - productService, categoryService, imageService
   - orderService, validationService (em desenvolvimento)
   - Padrões de uso
   - Error handling
   - Realtime subscriptions

5. **`frontend.md`** - Estrutura do frontend
   - Estrutura de pastas detalhada
   - Padrões de componentes (Server vs Client)
   - Hooks pattern (data fetching, mutations, realtime)
   - State management (React Query, Context, useState)
   - Routing e proteção de rotas
   - Forms, loading states, error handling
   - Optimistic UI

6. **`features.md`** - Features implementadas
   - Status de cada feature (✅ Completo, 🚧 Em Desenvolvimento, 🔵 Planejado)
   - Autenticação, Catálogo, Carrinho, Wishlist (completos)
   - Checkout, Perfil, Admin (parciais)
   - Dependências entre features
   - Próxima feature recomendada

7. **`agent.md`** - Regras de comportamento do agente
   - Regras fundamentais (ler referências, não inventar, seguir SDD)
   - Fluxo de trabalho (nova feature, bugfix, refatoração)
   - Padrões de código (module, service, hook, component)
   - Checklists (antes de implementar, antes de commitar)
   - O que NUNCA fazer
   - Quando parar e perguntar

---

## 🗑️ Arquivos Antigos (Mantidos mas Desatualizados)

### `/reference/architecture/`
- `system-overview.md` - Desatualizado, substituído por `system.md`
- `folder-structure.md` - Desatualizado, substituído por `system.md` e `frontend.md`
- `tech-stack.md` - Desatualizado, substituído por `system.md`

### `/reference/domain/`
- `core-entities.md` - Desatualizado, substituído por `domain.md`
- `domain-rules.md` - Desatualizado, substituído por `domain.md`

### `/reference/execution/`
- `agent-behavior.md` - Desatualizado, substituído por `agent.md`
- `feature-lifecycle.md` - Parcialmente válido
- `multi-agent-mode.md` - Parcialmente válido
- `sdd-audit.md` - Válido
- `spec-validation.md` - Válido

### `/reference/specs/`
- `products-catalog.md` - Desatualizado, ver `.kiro/specs/product-catalog-crud/`
- `checkout-module.md` - Desatualizado, ver `.kiro/specs/basic-checkout/`
- `example-*.md` - Templates, ainda válidos

### `/reference/engineering/`
- `sdd-guidelines.md` - Válido
- `coding-standards.md` - Parcialmente válido
- `supabase-security-*.md` - Válidos

### `/reference/design/`
- `design-system.md` - Parcialmente válido
- `ui-principles.md` - Parcialmente válido

### `/reference/product/`
- `product-vision.md` - Válido
- `product-principles.md` - Válido

### `/reference/decisions/`
- `adr-*.md` - Válidos

### `/reference/templates/`
- Todos válidos

---

## 📊 O Que Foi Corrigido

### 1. Arquitetura
**Antes**: Mencionava "packages/" e estrutura de monorepo complexa  
**Agora**: Reflete estrutura real com apenas `apps/web/`

**Antes**: Falava de "Server Actions" e "BFF"  
**Agora**: Explica fluxo real: Components → Hooks → Services → Supabase

### 2. Entidades
**Antes**: Descrições abstratas e filosóficas  
**Agora**: Tabelas reais com campos, tipos e constraints

**Antes**: Não mencionava snapshots de preço  
**Agora**: Documenta price_snapshot e product_name_snapshot

### 3. Database
**Antes**: Não havia documentação consolidada  
**Agora**: Schema completo com SQL, indexes, RLS, RPC functions

**Antes**: Não listava migrations  
**Agora**: Lista todas as migrations aplicadas e como aplicar novas

### 4. Services
**Antes**: Não havia documentação de services  
**Agora**: Documenta todos os services implementados com métodos e exemplos

**Antes**: Não explicava padrões  
**Agora**: Mostra padrões de uso, error handling, validação

### 5. Frontend
**Antes**: Estrutura genérica  
**Agora**: Estrutura real com todos os diretórios e arquivos

**Antes**: Não explicava hooks pattern  
**Agora**: Documenta data fetching, mutations, realtime hooks

### 6. Features
**Antes**: Roadmap desatualizado  
**Agora**: Status real de cada feature (completo, em desenvolvimento, planejado)

**Antes**: Não mostrava dependências  
**Agora**: Diagrama de dependências entre features

### 7. Agent Behavior
**Antes**: Regras abstratas e filosóficas  
**Agora**: Regras práticas e acionáveis

**Antes**: Não tinha checklists  
**Agora**: Checklists claros antes de implementar e commitar

**Antes**: Não mostrava exemplos de código  
**Agora**: Exemplos de código certo vs errado

---

## 🔍 O Que Foi Removido

### Conceitos Não Implementados
- "packages/" (não existe)
- "BFF" (não é usado)
- "Server Actions" como padrão principal (usamos services)
- Descrições filosóficas abstratas

### Arquitetura Inventada
- Separação complexa de monorepo
- Estruturas que não existem no código
- Padrões que não são seguidos

### Features Não Implementadas
- Stripe (planejado, não implementado)
- Emails (planejado, não implementado)
- Reviews (planejado, não implementado)
- Cupons (planejado, não implementado)

---

## ❓ OPEN QUESTIONS

### 1. Estrutura de Pastas
**Questão**: Alguns componentes estão em `components/` e outros em `modules/*/components/`. Qual é o critério?

**Observação**: 
- `components/` parece ter componentes globais (Navbar, Footer, ProductCard)
- `modules/*/components/` tem componentes específicos do módulo
- Mas não está 100% consistente

**Recomendação**: Documentar critério claro ou refatorar para consistência

---

### 2. Context vs React Query
**Questão**: `WishlistContext` usa Context API, mas `cart` usa React Query. Por quê?

**Observação**:
- Cart foi refatorado para React Query
- Wishlist ainda usa Context (legacy)
- Ambos têm mesma funcionalidade

**Recomendação**: Migrar Wishlist para React Query para consistência?

---

### 3. Checkout Module
**Questão**: `modules/checkout/` tem estrutura parcial com mock. Deve ser removido ou completado?

**Observação**:
- Existe `modules/checkout/services/checkoutService.ts` com MockBackend
- Spec em `.kiro/specs/basic-checkout/` tem design diferente
- Migrations de orders/order_items estão prontas mas não aplicadas

**Recomendação**: Aplicar migrations e completar implementação seguindo spec?

---

### 4. Admin Layout
**Questão**: Admin tem layout próprio mas não tem proteção de role. Implementar?

**Observação**:
- `app/admin/layout.tsx` existe
- Middleware protege rota `/admin`
- Mas não verifica se user.role === 'admin'

**Recomendação**: Adicionar verificação de role no middleware?

---

### 5. Profiles Table
**Questão**: Tabela `profiles` está documentada mas não vi migration. Foi aplicada manualmente?

**Observação**:
- Código referencia `profiles` table
- Não há migration em `supabase/migrations/`
- Pode ter sido criada via dashboard

**Recomendação**: Criar migration retroativa para documentação?

---

### 6. Image Upload
**Questão**: `imageService` menciona Cloudinary mas não vi configuração. Está implementado?

**Observação**:
- `modules/products/services/imageService.ts` existe
- Não vi env vars para Cloudinary
- Não vi testes de upload

**Recomendação**: Verificar se está funcional ou é placeholder?

---

### 7. Rate Limiting
**Questão**: Migration `20260404000008_create_rate_limit_log_table.sql` existe mas não vi implementação. Está em uso?

**Observação**:
- Tabela criada
- Não vi código usando rate limiting
- Spec de security validation menciona mas está pausada

**Recomendação**: Implementar ou remover tabela?

---

## 📝 Próximos Passos Recomendados

### Imediato
1. **Aplicar migrations de checkout**
   - `supabase-product-catalog-schema.sql` (products table)
   - `APPLY_CHECKOUT_MIGRATIONS.sql` (orders tables)

2. **Completar implementação de checkout**
   - Seguir `.kiro/specs/basic-checkout/tasks.md`
   - Implementar services, hooks, components

3. **Resolver OPEN QUESTIONS**
   - Decidir sobre cada questão levantada
   - Documentar decisões

### Curto Prazo
4. **Migrar Wishlist para React Query**
   - Remover `WishlistContext`
   - Criar hooks consistentes com cart

5. **Adicionar proteção de role admin**
   - Verificar `user.role === 'admin'` no middleware
   - Proteger rotas admin adequadamente

6. **Criar migrations retroativas**
   - `profiles` table
   - Outras tabelas criadas manualmente

### Médio Prazo
7. **Limpar arquivos antigos**
   - Remover ou arquivar referências desatualizadas
   - Manter apenas arquivos novos como fonte da verdade

8. **Completar features parciais**
   - Perfil de usuário
   - Admin dashboard
   - Security validation

9. **Implementar features planejadas**
   - Stripe
   - Emails
   - Reviews

---

## 🎯 Resultado Final

### Antes da Refatoração
- ❌ Referências desatualizadas
- ❌ Arquitetura inventada
- ❌ Sem documentação de database
- ❌ Sem documentação de services
- ❌ Regras abstratas e filosóficas
- ❌ Difícil de seguir

### Depois da Refatoração
- ✅ Referências alinhadas com código
- ✅ Arquitetura real documentada
- ✅ Database schema completo
- ✅ Services documentados
- ✅ Regras práticas e acionáveis
- ✅ Fácil de seguir

### Arquivos de Referência (Novos)
```
reference/
├── system.md          # ✅ Arquitetura real
├── domain.md          # ✅ Entidades reais
├── database.md        # ✅ Schema real
├── api.md             # ✅ Services reais
├── frontend.md        # ✅ Estrutura real
├── features.md        # ✅ Status real
├── agent.md           # ✅ Regras práticas
└── REFACTOR_SUMMARY.md # ✅ Este arquivo
```

---

## 📚 Como Usar as Novas Referências

### Para Implementar Nova Feature
1. Ler `system.md` - Entender arquitetura
2. Ler `features.md` - Verificar dependências
3. Ler `domain.md` - Entender entidades
4. Ler `database.md` - Ver schema
5. Ler `api.md` - Ver padrões de services
6. Ler `frontend.md` - Ver padrões de componentes
7. Ler `agent.md` - Seguir regras

### Para Entender Código Existente
1. Ler `features.md` - Ver o que está implementado
2. Ler `system.md` - Entender estrutura
3. Ler código em `apps/web/src/modules/[feature]/`

### Para Debugar Problema
1. Ler `features.md` - Identificar feature
2. Ler `database.md` - Ver schema e RLS
3. Ler `api.md` - Ver services
4. Ler código específico

---

**Refatoração Completa** ✅  
**Referências Alinhadas com Código** ✅  
**Documentação Clara e Prática** ✅
