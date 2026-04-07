# API & Services - Agon E-commerce

## Arquitetura de Services

Services são funções puras que encapsulam lógica de negócio e comunicação com Supabase.

### Princípios
- **Puros**: Sem estado interno, sem side effects de UI
- **Validados**: Usam Zod para validar entrada/saída
- **Tipados**: TypeScript strict mode
- **Testáveis**: Fácil de mockar e testar
- **Sem UI**: Não conhecem toasts, navegação, etc.

---

## Cart Services

### cartService
**Localização**: `apps/web/src/modules/cart/services/cartService.ts`

**Métodos**:

```typescript
// Buscar itens do carrinho
getCartItems(userId: string): Promise<CartItem[]>

// Adicionar item (usa RPC atomic)
addToCart(userId: string, input: CartItemInput): Promise<CartItem>

// Atualizar quantidade
updateCartItem(userId: string, itemId: string, quantity: number): Promise<CartItem>

// Remover item
removeCartItem(userId: string, itemId: string): Promise<void>

// Limpar carrinho
clearCart(userId: string): Promise<void>

// Contar itens
getCartCount(userId: string): Promise<number>
```

**Validação**: Usa `cartItemSchema` do Zod

---

### localStorageService
**Localização**: `apps/web/src/modules/cart/services/localStorageService.ts`

**Métodos**:

```typescript
// Buscar carrinho local
getLocalCart(): LocalStorageCart | null

// Salvar carrinho local
saveLocalCart(cart: LocalStorageCart): void

// Limpar carrinho local
clearLocalCart(): void

// Buscar wishlist local
getLocalWishlist(): LocalStorageWishlist | null

// Salvar wishlist local
saveLocalWishlist(wishlist: LocalStorageWishlist): void

// Limpar wishlist local
clearLocalWishlist(): void

// Inicializar listeners multi-tab
initializeListeners(): void
```

---

### migrationService
**Localização**: `apps/web/src/modules/cart/services/migrationService.ts`

**Métodos**:

```typescript
// Migrar carrinho e wishlist ao fazer login
migrateUserData(userId: string): Promise<MigrationResult>

// Migrar apenas carrinho
migrateCart(userId: string, items: LocalCartItem[]): Promise<void>

// Migrar apenas wishlist
migrateWishlist(userId: string, items: LocalWishlistItem[]): Promise<void>
```

**Usa RPC**: `migrate_cart_items`, `migrate_wishlist_items`

---

## Wishlist Services

### wishlistService
**Localização**: `apps/web/src/modules/wishlist/services/wishlistService.ts`

**Métodos**:

```typescript
// Buscar itens da wishlist
getWishlistItems(userId: string): Promise<WishlistItem[]>

// Adicionar item
addToWishlist(userId: string, productId: string): Promise<WishlistItem>

// Remover item
removeFromWishlist(userId: string, itemId: string): Promise<void>

// Verificar se produto está na wishlist
isInWishlist(userId: string, productId: string): Promise<boolean>

// Contar itens
getWishlistCount(userId: string): Promise<number>
```

**Validação**: Usa `wishlistItemSchema` do Zod

**Limite**: Máximo 20 itens (enforced por trigger no banco)

---

## Product Services

### productService
**Localização**: `apps/web/src/modules/products/services/productService.ts`

**Métodos**:

```typescript
// Listar produtos com filtros
getProducts(filters: ProductFilters): Promise<{ products: Product[]; total: number }>

// Buscar produto por ID
getProductById(id: string): Promise<Product | null>

// Criar produto (admin)
createProduct(data: ProductFormData): Promise<Product>

// Atualizar produto (admin)
updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product>

// Deletar produto (admin) - soft delete
deleteProduct(id: string): Promise<void>

// Buscar por texto
searchProducts(query: string): Promise<Product[]>
```

**Validação**: Usa `productSchema` e `productFiltersSchema`

---

### categoryService
**Localização**: `apps/web/src/modules/products/services/categoryService.ts`

**Métodos**:

```typescript
// Listar categorias
getCategories(): Promise<Category[]>

// Buscar categoria por ID
getCategoryById(id: string): Promise<Category | null>

// Buscar categoria por slug
getCategoryBySlug(slug: string): Promise<Category | null>

// Criar categoria (admin)
createCategory(data: CategoryFormData): Promise<Category>

// Atualizar categoria (admin)
updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category>

// Deletar categoria (admin)
deleteCategory(id: string): Promise<void>
```

**Validação**: Usa `categorySchema`

---

### imageService
**Localização**: `apps/web/src/modules/products/services/imageService.ts`

**Métodos**:

```typescript
// Upload de imagem para Cloudinary
uploadImage(file: File): Promise<string>

// Validar arquivo de imagem
validateImageFile(file: File): { valid: boolean; error?: string }

// Comprimir imagem
compressImage(file: File): Promise<File>
```

**Validação**:
- Tipo: image/jpeg, image/png, image/webp
- Tamanho máximo: 5MB
- Dimensões máximas: 1920x1080

---

## Checkout Services (em desenvolvimento)

### orderService
**Localização**: `apps/web/src/modules/checkout/services/orderService.ts`

**Métodos**:

```typescript
// Criar pedido atomicamente
createOrder(userId: string, shippingInfo: ShippingFormValues): Promise<CreateOrderResponse>

// Buscar pedido por ID
getOrderById(orderId: string, userId: string): Promise<Order | null>

// Listar pedidos do usuário
getUserOrders(userId: string, page: number, limit: number): Promise<{ orders: Order[]; total: number }>

// Atualizar status (admin)
updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>
```

**Usa RPC**: `create_order_atomic`

**Validação**: Usa `shippingFormSchema` e `createOrderSchema`

---

### validationService
**Localização**: `apps/web/src/modules/checkout/services/validationService.ts`

**Métodos**:

```typescript
// Validar e formatar CEP
validateCEP(cep: string): { valid: boolean; formatted: string }

// Validar e formatar telefone
validatePhone(phone: string): { valid: boolean; formatted: string }

// Validar estado brasileiro
validateState(state: string): boolean

// Buscar endereço por CEP (ViaCEP API)
fetchAddressByCEP(cep: string): Promise<AddressData | null>
```

**Validação**: Formatos brasileiros (CEP, telefone, estados)

---

## Supabase Client

### createClient (Client-side)
**Localização**: `apps/web/src/lib/supabase/client.ts`

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

**Uso**: Componentes client-side, hooks

---

### createClient (Server-side)
**Localização**: `apps/web/src/lib/supabase/server.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
```

**Uso**: Server Components, Server Actions, API Routes

---

## Padrões de Uso

### Em Services
```typescript
export const myService = {
  async getData(userId: string) {
    const supabase = createClient();
    
    // Validar entrada
    const validated = mySchema.parse({ userId });
    
    // Query
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('user_id', validated.userId);
    
    if (error) throw error;
    
    // Transformar e retornar
    return data.map(transformRow);
  }
};
```

### Em Hooks
```typescript
export function useMyData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-data', user?.id],
    queryFn: () => myService.getData(user!.id),
    enabled: !!user,
  });
}
```

### Em Componentes
```typescript
export function MyComponent() {
  const { data, isLoading } = useMyData();
  const mutation = useMyMutation();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {data?.map(item => (
        <Item key={item.id} {...item} />
      ))}
    </div>
  );
}
```

---

## Error Handling

### Em Services
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Service error:', error);
  throw error; // Re-throw para hook tratar
}
```

### Em Hooks
```typescript
const mutation = useMutation({
  mutationFn: myService.create,
  onSuccess: () => {
    toast.success('Sucesso!');
    queryClient.invalidateQueries(['my-data']);
  },
  onError: (error) => {
    toast.error('Erro ao salvar');
    console.error(error);
  },
});
```

---

## Validação com Zod

Todos os services validam entrada com Zod:

```typescript
import { z } from 'zod';

const mySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive(),
});

// Em service
const validated = mySchema.parse(input);
```

Schemas estão em `modules/*/contracts.ts` ou `modules/*/schemas.ts`.

---

## Realtime Subscriptions

### Em Hooks
```typescript
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
    .channel(`my-channel:${user.id}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'my_table',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      // Atualizar estado
      queryClient.invalidateQueries(['my-data']);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

---

## RPC Functions

### Chamando RPC
```typescript
const { data, error } = await supabase.rpc('my_function', {
  p_user_id: userId,
  p_data: jsonData,
});

if (error) throw error;
return data;
```

### Funções Disponíveis
- `migrate_cart_items(p_user_id, p_items)`
- `migrate_wishlist_items(p_user_id, p_items)`
- `add_to_cart_atomic(p_user_id, p_product_id, ...)`
- `create_order_atomic(p_user_id, p_shipping_name, ...)` (em desenvolvimento)
