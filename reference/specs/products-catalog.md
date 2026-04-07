# Spec: Product Catalog Module

## PROBLEMA

O módulo de produtos (`/modules/products`) gerencia todo o ciclo de vida de produtos e categorias no e-commerce Agon, mas não possui documentação formal de especificação no formato SDD exigido pelo projeto. Isso viola os princípios de Spec-Driven Development e impede a auditoria adequada da arquitetura.

## OBJETIVOS

1. Documentar formalmente o módulo de produtos seguindo os padrões SDD do projeto Agon
2. Estabelecer contratos claros entre Frontend, Services e Backend usando Zod
3. Garantir que o módulo siga a arquitetura modular e desacoplada definida em `/reference`
4. Fornecer rastreabilidade entre requisitos (`.kiro/specs/product-catalog-crud/`) e implementação

## ESCOPO

### Incluído
- Gerenciamento completo de produtos (CRUD)
- Gerenciamento de categorias
- Upload e validação de imagens
- Busca e filtros de produtos
- Paginação e ordenação
- Soft delete de produtos
- Validação de estoque
- Integração com Supabase

### Excluído
- Carrinho de compras (módulo separado)
- Wishlist (módulo separado)
- Sistema de avaliações (futuro)
- Recomendações de produtos (futuro)

## ARQUITETURA

### Estrutura de Pastas

```
/modules/products/
├── components/          # Componentes React específicos do módulo
│   ├── CategoryManager.tsx
│   ├── ProductForm.tsx
│   └── ProductTable.tsx
├── hooks/              # Hooks customizados para lógica de UI
│   ├── useCategories.ts
│   ├── useCategoryMutations.ts
│   ├── useProductMutations.ts
│   └── useProducts.ts
├── services/           # Lógica de negócio pura (sem UI)
│   ├── categoryService.ts
│   ├── imageService.ts
│   └── productService.ts
├── contracts.ts        # Contratos Zod e tipos (Single Source of Truth)
├── schemas.ts          # Schemas Zod para validação
└── types.ts            # Tipos TypeScript do domínio
```

### Princípios Arquiteturais

1. **Services Puros**: Todos os services são funções/classes puras sem estado interno
2. **Hooks como Orquestradores**: Hooks gerenciam estado de UI e chamam services
3. **Componentes Burros**: Componentes recebem dados via props e emitem eventos
4. **Contratos Zod**: Toda validação de dados usa schemas Zod definidos em `contracts.ts`
5. **Desacoplamento**: Services não conhecem a UI (sem toasts, navegação, etc.)

## CONTRATOS

### Product Contract

```typescript
// Definido em contracts.ts
export const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive().multipleOf(0.01),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url(),
  stock: z.number().int().nonnegative(),
  features: z.array(z.string()).default([]),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

### Category Contract

```typescript
export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
```

### Product Filters Contract

```typescript
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['latest', 'oldest', 'price_asc', 'price_desc']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type ProductFiltersData = z.infer<typeof productFiltersSchema>;
```

## FLUXO DE DADOS

### Criação de Produto (Admin)

```
1. Admin preenche ProductForm
2. ProductForm valida com productSchema.parse()
3. ProductForm chama useProductMutations.createProduct()
4. Hook chama productService.createProduct()
5. Service valida novamente e chama Supabase
6. Hook atualiza UI com Optimistic Update
7. Hook exibe toast de sucesso/erro
```

### Listagem de Produtos (Cliente)

```
1. Cliente acessa /products
2. Página SSR busca produtos via productService.getProducts()
3. Cliente aplica filtros via SearchFilters
4. useProducts hook debounce (300ms) e chama service
5. Service aplica filtros e retorna produtos
6. AnimatedGrid renderiza ProductCards
```

## VALIDAÇÃO

### Frontend (Hooks)
- Validação de formulários com Zod antes de enviar ao service
- Validação de filtros antes de aplicar busca
- Validação de arquivos de imagem (tipo, tamanho)

### Service Layer
- Re-validação de todos os dados com Zod antes de enviar ao Supabase
- Validação de regras de negócio (ex: categoria existe antes de criar produto)
- Validação de permissões (admin check)

### Database (Supabase)
- CHECK constraints (stock >= 0, price >= 0, rating 0-5)
- FOREIGN KEY constraints (category_id)
- UNIQUE constraints (category name, slug)
- RLS policies (admin-only writes, public reads)

## ESTADOS DE LOADING

### Componentes
- ProductForm: `isSubmitting` durante create/update
- ProductTable: `isLoading` durante fetch inicial
- CategoryManager: `isLoading` durante operações

### Skeletons
- ProductTable exibe skeleton rows durante loading
- Product listing exibe skeleton cards
- Product detail exibe skeleton layout

## TRATAMENTO DE ERROS

### Tipos de Erro
1. **Validation Error**: Dados inválidos (Zod)
2. **Network Error**: Falha de conexão com Supabase
3. **Permission Error**: Usuário não autorizado (RLS)
4. **Not Found Error**: Produto/categoria não existe
5. **Constraint Error**: Violação de constraint do banco

### Estratégia
- Todos os erros são capturados nos hooks
- Erros exibem toast com mensagem amigável
- Optimistic updates fazem rollback em caso de erro
- Erros são logados no console para debug

## OPTIMISTIC UI

### Operações com Optimistic Update
1. **Create Product**: Adiciona produto temporário à lista
2. **Update Product**: Atualiza produto imediatamente
3. **Delete Product**: Remove produto imediatamente

### Rollback
- Se operação falha, estado anterior é restaurado
- Toast de erro é exibido
- Tempo de rollback: < 100ms

## SOFT DELETE

### Implementação
- Produtos deletados têm `deleted_at` setado para NOW()
- Dados do produto são preservados (histórico de pedidos)
- RLS policy filtra produtos com `deleted_at IS NOT NULL`
- Admin pode restaurar setando `deleted_at` para NULL

## INTEGRAÇÃO COM SUPABASE

### Tabelas
- `products`: Armazena dados de produtos
- `categories`: Armazena categorias
- `storage.buckets`: Armazena imagens (opcional, pode usar Cloudinary)

### RLS Policies
- SELECT: Público (filtra deleted_at)
- INSERT/UPDATE/DELETE: Apenas admin (role = 'admin')

### Indexes
- `products.category_id`: Para filtros por categoria
- `products.deleted_at`: Para queries de soft delete
- `categories.slug`: Para lookup por URL

## CRITÉRIOS DE ACEITE

### Funcionalidade
- [x] Admin pode criar, editar e deletar produtos
- [x] Admin pode gerenciar categorias
- [x] Clientes podem buscar e filtrar produtos
- [x] Upload de imagens funciona
- [x] Soft delete preserva dados históricos
- [x] Paginação funciona corretamente

### Qualidade
- [x] Todos os services usam validação Zod
- [x] Hooks gerenciam estado de UI corretamente
- [x] Componentes são "burros" (props + eventos)
- [x] Optimistic UI com rollback funciona
- [x] Loading states e skeletons implementados
- [x] Tratamento de erros com toasts

### Arquitetura
- [x] Estrutura de pastas segue padrão modular
- [x] Services são puros (sem UI)
- [x] Contratos Zod são Single Source of Truth
- [x] Sem dependências cruzadas entre módulos
- [x] Integração com componentes existentes

## REFERÊNCIAS

- Requisitos Detalhados: `.kiro/specs/product-catalog-crud/requirements.md`
- Design Document: `.kiro/specs/product-catalog-crud/design.md`
- Tasks: `.kiro/specs/product-catalog-crud/tasks.md`
- Implementação: `apps/web/src/modules/products/`
- Contratos: `apps/web/src/modules/products/contracts.ts`
