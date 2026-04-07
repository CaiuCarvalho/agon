# Domain Entities - Agon E-commerce

## User (Usuário)
Representa um usuário do sistema (cliente ou admin).

**Tabela**: `profiles` (extends `auth.users`)

**Campos**:
- `id` (UUID) - ID do usuário (FK para auth.users)
- `email` (TEXT) - Email do usuário
- `full_name` (TEXT) - Nome completo
- `avatar_url` (TEXT) - URL do avatar
- `role` (TEXT) - 'customer' ou 'admin'
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Regras**:
- Todo usuário autenticado tem um profile
- Role padrão é 'customer'
- Admin tem permissões especiais (RLS)

---

## Product (Produto)
Representa um produto à venda.

**Tabela**: `products`

**Campos**:
- `id` (UUID)
- `name` (TEXT) - Nome do produto
- `description` (TEXT) - Descrição
- `price` (DECIMAL) - Preço em BRL
- `category_id` (UUID) - FK para categories
- `image_url` (TEXT) - URL da imagem
- `stock` (INTEGER) - Quantidade em estoque
- `features` (TEXT[]) - Array de características
- `rating` (DECIMAL) - Avaliação média (0-5)
- `reviews` (INTEGER) - Número de avaliações
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `deleted_at` (TIMESTAMPTZ) - Soft delete

**Regras**:
- Preço sempre >= 0
- Stock sempre >= 0
- Rating entre 0 e 5
- Soft delete preserva histórico

---

## Category (Categoria)
Agrupa produtos por tipo.

**Tabela**: `categories`

**Campos**:
- `id` (UUID)
- `name` (TEXT) - Nome da categoria
- `slug` (TEXT) - URL-friendly name
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Regras**:
- Nome e slug únicos
- Produtos referenciam categoria (ON DELETE RESTRICT)

---

## CartItem (Item do Carrinho)
Item temporário no carrinho do usuário.

**Tabela**: `cart_items`

**Campos**:
- `id` (UUID)
- `user_id` (UUID) - FK para auth.users
- `product_id` (UUID) - FK para products
- `quantity` (INTEGER) - Quantidade (1-99)
- `size` (TEXT) - Tamanho (ex: P, M, G)
- `price_snapshot` (DECIMAL) - Preço no momento de adicionar
- `product_name_snapshot` (TEXT) - Nome no momento de adicionar
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Regras**:
- Quantidade entre 1 e 99
- Unique constraint: (user_id, product_id, size)
- Snapshots preservam dados no momento de adicionar
- Cascade delete quando usuário ou produto deletado

---

## WishlistItem (Item da Lista de Desejos)
Produto favoritado pelo usuário.

**Tabela**: `wishlist_items`

**Campos**:
- `id` (UUID)
- `user_id` (UUID) - FK para auth.users
- `product_id` (UUID) - FK para products
- `created_at` (TIMESTAMPTZ)

**Regras**:
- Limite de 20 itens por usuário (trigger)
- Unique constraint: (user_id, product_id)
- Cascade delete quando usuário ou produto deletado

---

## Order (Pedido)
Pedido finalizado e confirmado.

**Tabela**: `orders` (em desenvolvimento)

**Campos**:
- `id` (UUID)
- `user_id` (UUID) - FK para auth.users
- `status` (TEXT) - 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- `total_amount` (DECIMAL) - Total do pedido
- `shipping_name` (TEXT)
- `shipping_address` (TEXT)
- `shipping_city` (TEXT)
- `shipping_state` (TEXT)
- `shipping_zip` (TEXT)
- `shipping_phone` (TEXT)
- `shipping_email` (TEXT)
- `payment_method` (TEXT) - 'cash_on_delivery', 'stripe' (futuro)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Regras**:
- Status inicial sempre 'pending'
- Total sempre >= 0
- Dados de entrega obrigatórios
- Imutável após criação (apenas status muda)

---

## OrderItem (Item do Pedido)
Item dentro de um pedido finalizado.

**Tabela**: `order_items` (em desenvolvimento)

**Campos**:
- `id` (UUID)
- `order_id` (UUID) - FK para orders
- `product_id` (UUID) - FK para products
- `product_name` (TEXT) - Snapshot do nome
- `product_price` (DECIMAL) - Snapshot do preço
- `quantity` (INTEGER)
- `size` (TEXT)
- `subtotal` (DECIMAL)
- `created_at` (TIMESTAMPTZ)

**Regras**:
- Snapshots preservam dados no momento do pedido
- Cascade delete quando order deletado
- Restrict delete de product (preserva histórico)
- Imutável após criação

---

## Regras de Negócio Globais

### Preços
- Preços sempre em BRL (Real Brasileiro)
- Formato: DECIMAL(10, 2)
- Snapshots preservam preços históricos

### Estoque
- Validado no momento do checkout
- Não decrementado automaticamente (admin gerencia)

### Soft Delete
- Produtos deletados têm `deleted_at` setado
- Dados preservados para histórico de pedidos
- RLS filtra produtos deletados para clientes

### Segurança (RLS)
- Usuários só veem seus próprios dados (cart, wishlist, orders)
- Admin vê tudo
- Leitura pública para products e categories

### Realtime
- Cart e wishlist sincronizam entre dispositivos
- Usa Supabase Realtime channels
- Conflitos resolvidos por Last-Write-Wins
