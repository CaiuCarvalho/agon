# Reference Documentation - Agon E-commerce

**Última Atualização**: 2026-04-05  
**Status**: ✅ Alinhado com código real

---

## 📚 Arquivos Principais (LEIA ESTES)

### 1. [`system.md`](./system.md) - Arquitetura do Sistema
**Leia primeiro para entender:**
- Stack tecnológico (Next.js, Supabase, React Query)
- Estrutura de pastas
- Fluxo de dados (Frontend → Services → Supabase)
- Módulos implementados
- Regras de desenvolvimento SDD

---

### 2. [`domain.md`](./domain.md) - Entidades do Domínio
**Leia para entender:**
- User, Product, Category
- CartItem, WishlistItem
- Order, OrderItem
- Regras de negócio
- Constraints e validações

---

### 3. [`database.md`](./database.md) - Schema do Banco
**Leia para entender:**
- Tabelas com SQL completo
- Indexes e constraints
- RLS policies
- RPC functions
- Como aplicar migrations

---

### 4. [`api.md`](./api.md) - Services e APIs
**Leia para entender:**
- cartService, wishlistService
- productService, categoryService
- orderService (em desenvolvimento)
- Padrões de uso
- Error handling
- Realtime subscriptions

---

### 5. [`frontend.md`](./frontend.md) - Estrutura do Frontend
**Leia para entender:**
- Estrutura de pastas detalhada
- Server vs Client Components
- Hooks pattern
- State management
- Routing e proteção
- Forms e validação

---

### 6. [`features.md`](./features.md) - Features Implementadas
**Leia para entender:**
- O que está completo (✅)
- O que está em desenvolvimento (🚧)
- O que está planejado (🔵)
- Dependências entre features
- Próxima feature recomendada

---

### 7. [`agent.md`](./agent.md) - Regras do Agente
**LEIA ANTES DE IMPLEMENTAR QUALQUER COISA**
- Regras fundamentais
- Fluxo de trabalho
- Padrões de código
- Checklists
- O que NUNCA fazer
- Quando parar e perguntar

---

## 🚀 Quick Start

### Para Implementar Nova Feature
```
1. Ler agent.md (regras)
2. Ler system.md (arquitetura)
3. Ler features.md (verificar dependências)
4. Verificar se existe spec em .kiro/specs/
5. Se não existe → criar spec primeiro
6. Implementar seguindo spec
```

### Para Entender Código Existente
```
1. Ler features.md (ver o que está implementado)
2. Ler system.md (entender estrutura)
3. Ler código em apps/web/src/modules/[feature]/
```

### Para Debugar Problema
```
1. Ler features.md (identificar feature)
2. Ler database.md (ver schema e RLS)
3. Ler api.md (ver services)
4. Ler código específico
```

---

## 📁 Estrutura da Pasta Reference

```
reference/
├── README.md                    # Este arquivo (guia de uso)
├── REFACTOR_SUMMARY.md          # Sumário da refatoração
│
├── system.md                    # ⭐ Arquitetura real
├── domain.md                    # ⭐ Entidades reais
├── database.md                  # ⭐ Schema real
├── api.md                       # ⭐ Services reais
├── frontend.md                  # ⭐ Estrutura real
├── features.md                  # ⭐ Status real
├── agent.md                     # ⭐ Regras práticas
│
├── architecture/                # 📦 Arquivos antigos (desatualizados)
├── domain/                      # 📦 Arquivos antigos (desatualizados)
├── execution/                   # 📦 Parcialmente válidos
├── engineering/                 # 📦 Parcialmente válidos
├── design/                      # 📦 Parcialmente válidos
├── product/                     # ✅ Válidos
├── decisions/                   # ✅ Válidos (ADRs)
├── specs/                       # 📦 Ver .kiro/specs/ para specs reais
└── templates/                   # ✅ Válidos
```

**Legenda**:
- ⭐ = Arquivos principais (LEIA ESTES)
- ✅ = Válidos
- 📦 = Desatualizados ou parcialmente válidos

---

## ⚠️ Arquivos Antigos

Os arquivos nas pastas `architecture/`, `domain/`, `execution/` estão **desatualizados**.

**Use os arquivos principais** (marcados com ⭐) como fonte da verdade.

Os arquivos antigos foram mantidos para referência histórica, mas **não devem ser seguidos**.

---

## 🎯 Regras de Ouro

### 1. SEMPRE Ler Referências Primeiro
Antes de qualquer ação, ler os arquivos principais (⭐).

### 2. NUNCA Inventar Arquitetura
Seguir estrutura existente documentada em `system.md` e `frontend.md`.

### 3. SEMPRE Seguir SDD
Toda feature precisa de spec em `.kiro/specs/`.

### 4. NUNCA Tomar Decisões Sozinho
Se algo não está claro → PARAR e perguntar.

### 5. SEMPRE Validar com Zod
Toda entrada de dados usa Zod schemas.

### 6. SEMPRE Usar RLS
Nunca confiar no frontend, RLS protege dados.

### 7. SEMPRE Manter Services Puros
Services não conhecem UI (sem toasts, navegação).

### 8. SEMPRE Usar Optimistic UI
Atualizar UI imediatamente, rollback em caso de erro.

---

## 📖 Documentação Adicional

### Specs de Features
Ver `.kiro/specs/` para specs completas:
- `auth-pages-ui/` - Autenticação ✅
- `product-catalog-crud/` - Catálogo ✅
- `cart-wishlist-persistence/` - Carrinho e Wishlist ✅
- `basic-checkout/` - Checkout 🚧
- `user-profile-page/` - Perfil 🚧
- `supabase-security-validation/` - Segurança ⏸️

### Roadmap
Ver `specs/ROADMAP.md` para lista completa de features e prioridades.

### Migrations
Ver `supabase/migrations/` para migrations do banco.

### Testes
Ver `apps/web/src/__tests__/` para testes implementados.

---

## 🔄 Manutenção das Referências

### Quando Atualizar
- Ao adicionar nova feature
- Ao mudar arquitetura
- Ao adicionar nova tabela
- Ao criar novo service
- Ao mudar padrões

### Como Atualizar
1. Editar arquivo relevante (system.md, domain.md, etc.)
2. Manter consistência com código
3. Atualizar REFACTOR_SUMMARY.md se necessário
4. Commitar com mensagem clara

### Responsabilidade
- **Agente**: Atualizar ao implementar features
- **Desenvolvedor**: Revisar e aprovar mudanças

---

## ❓ Dúvidas?

### Arquitetura não está clara?
Ler `system.md` e `frontend.md`.

### Não sei onde colocar código?
Ler `system.md` (estrutura) e `agent.md` (padrões).

### Não sei como implementar?
Ler spec em `.kiro/specs/[feature]/` e `agent.md` (fluxo).

### Não sei se feature existe?
Ler `features.md`.

### Não sei como funciona o banco?
Ler `database.md`.

### Não sei como chamar service?
Ler `api.md`.

### Ainda com dúvida?
PARAR e perguntar ao usuário. Registrar em OPEN QUESTIONS.

---

## 📊 Status da Documentação

| Arquivo | Status | Última Atualização |
|---------|--------|-------------------|
| system.md | ✅ Atualizado | 2026-04-05 |
| domain.md | ✅ Atualizado | 2026-04-05 |
| database.md | ✅ Atualizado | 2026-04-05 |
| api.md | ✅ Atualizado | 2026-04-05 |
| frontend.md | ✅ Atualizado | 2026-04-05 |
| features.md | ✅ Atualizado | 2026-04-05 |
| agent.md | ✅ Atualizado | 2026-04-05 |
| REFACTOR_SUMMARY.md | ✅ Atualizado | 2026-04-05 |

---

**Documentação Completa e Alinhada com Código Real** ✅
