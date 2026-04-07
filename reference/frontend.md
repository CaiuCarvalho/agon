# Frontend Structure - Agon E-commerce

## Estrutura de Pastas

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Grupo de rotas de autenticação
│   │   ├── login/
│   │   └── cadastro/
│   ├── admin/             # Área administrativa
│   │   ├── products/
│   │   └── orders/
│   ├── cart/              # Carrinho
│   ├── checkout/          # Checkout
│   ├── favoritos/         # Wishlist
│   ├── perfil/            # Perfil do usuário
│   ├── products/          # Listagem e detalhes
│   │   └── [id]/
│   ├── pedido/
│   │   └── confirmado/    # Confirmação de pedido
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Home page
│
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── auth/             # Componentes de autenticação
│   ├── cart/             # Componentes de carrinho
│   ├── checkout/         # Componentes de checkout
│   ├── products/         # Componentes de produtos
│   ├── profile/          # Componentes de perfil
│   └── ...               # Componentes globais (Navbar, Footer, etc.)
│
├── modules/              # Módulos de domínio
│   ├── cart/
│   │   ├── services/     # Lógica de negócio
│   │   ├── hooks/        # React hooks
│   │   ├── types.ts      # TypeScript types
│   │   ├── contracts.ts  # Zod schemas
│   │   └── index.ts      # Public API
│   ├── wishlist/
│   ├── products/
│   └── checkout/
│
├── lib/                  # Utilitários e clientes
│   ├── supabase/
│   │   ├── client.ts     # Client-side
│   │   └── server.ts     # Server-side
│   ├── react-query/
│   │   └── QueryProvider.tsx
│   ├── api/              # API helpers
│   ├── utils.ts          # Funções utilitárias
│   └── analytics.ts      # Google Analytics
│
├── hooks/                # Custom hooks globais
│   ├── useAuth.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── context/              # Context providers
│   ├── AuthContext.tsx
│   └── WishlistContext.tsx
│
├── types/                # TypeScript types globais
│   ├── index.ts
│   ├── cart.ts
│   ├── order.ts
│   └── address.ts
│
└── utils/                # Funções utilitárias
    └── validation.ts
```

---

## Padrões de Componentes

### Server Components (Padrão)
Usados para páginas e layouts. Fazem fetch de dados no servidor.

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select();
  
  return <ProductList products={products} />;
}
```

### Client Components
Usados para interatividade. Marcados com `'use client'`.

```typescript
'use client';

export function AddToCartButton({ productId }: Props) {
  const { addToCart } = useCartMutations();
  
  return (
    <button onClick={() => addToCart(productId)}>
      Adicionar ao Carrinho
    </button>
  );
}
```

---

## Hooks Pattern

### Data Fetching Hooks
```typescript
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  });
}
```

### Mutation Hooks
```typescript
export function useCartMutations() {
  const queryClient = useQueryClient();
  
  const addToCart = useMutation({
    mutationFn: cartService.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Adicionado ao carrinho');
    },
  });
  
  return { addToCart };
}
```

### Realtime Hooks
```typescript
export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch inicial
  const query = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => cartService.getCartItems(user!.id),
    enabled: !!user,
  });
  
  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`cart:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries(['cart']);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return query;
}
```

---

## State Management

### React Query (Dados do servidor)
- Usado para fetch, cache e sincronização
- Configurado em `lib/react-query/QueryProvider.tsx`

### Context API (Estado global)
- `AuthContext` - Usuário autenticado
- `WishlistContext` - Estado da wishlist (legacy, migrar para React Query)

### Local State (useState)
- Usado para estado de UI (modals, forms, etc.)

---

## Routing

### App Router (Next.js 14)
- File-based routing em `app/`
- Server Components por padrão
- Layouts aninhados
- Loading e error states

### Rotas Protegidas
Middleware em `middleware.ts` protege rotas:

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Proteger rotas admin
  if (pathname.startsWith('/admin')) {
    // Verificar se é admin
  }
  
  // Proteger rotas autenticadas
  if (pathname.startsWith('/perfil') || pathname.startsWith('/checkout')) {
    // Verificar se está autenticado
  }
}
```

---

## Styling

### Tailwind CSS v3
- Configurado em `tailwind.config.js`
- Classes utilitárias
- Responsive design
- Dark mode (futuro)

### shadcn/ui
- Componentes base em `components/ui/`
- Customizáveis
- Acessíveis

---

## Forms

### react-hook-form + Zod
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
});

<form onSubmit={form.handleSubmit(onSubmit)}>
  <input {...form.register('name')} />
  {form.formState.errors.name && <span>{form.formState.errors.name.message}</span>}
</form>
```

---

## Loading States

### Skeletons
```typescript
if (isLoading) return <ProductCardSkeleton />;
```

### Suspense
```typescript
<Suspense fallback={<Loading />}>
  <ProductList />
</Suspense>
```

---

## Error Handling

### Error Boundaries
```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: Props) {
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner';

toast.success('Sucesso!');
toast.error('Erro!');
toast.loading('Carregando...');
```

---

## Optimistic UI

### Com React Query
```typescript
const mutation = useMutation({
  mutationFn: cartService.addToCart,
  onMutate: async (newItem) => {
    // Cancelar queries em andamento
    await queryClient.cancelQueries(['cart']);
    
    // Snapshot do estado anterior
    const previousCart = queryClient.getQueryData(['cart']);
    
    // Atualizar otimisticamente
    queryClient.setQueryData(['cart'], (old) => [...old, newItem]);
    
    return { previousCart };
  },
  onError: (err, newItem, context) => {
    // Rollback em caso de erro
    queryClient.setQueryData(['cart'], context.previousCart);
  },
  onSettled: () => {
    // Refetch para garantir sincronização
    queryClient.invalidateQueries(['cart']);
  },
});
```

---

## Performance

### Code Splitting
- Automático com Next.js
- Dynamic imports para componentes pesados

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={400}
  priority={false}
/>
```

### Debouncing
```typescript
const debouncedSearch = useDebouncedValue(searchQuery, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchProducts(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## Testing

### Unit Tests
- Jest + Testing Library
- Testes em `__tests__/`

### Integration Tests
- Testes de fluxo completo
- Mocking de Supabase

### E2E Tests (Futuro)
- Playwright ou Cypress
