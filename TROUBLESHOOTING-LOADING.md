# Troubleshooting: Loading Infinito

## Diagnóstico

O problema de loading infinito pode ter várias causas. Vamos investigar:

### 1. Verificar Console do Navegador

Abra o DevTools (F12) e verifique:
- **Console**: Há erros JavaScript?
- **Network**: Há requisições travadas ou falhando?
- **React DevTools**: Os componentes estão renderizando?

### 2. Verificar Terminal do Dev Server

No terminal onde você rodou `npm run dev`, verifique:
- Há erros de compilação?
- Há warnings sobre dependências circulares?
- O servidor está respondendo?

### 3. Possíveis Causas

#### A. Problema com Supabase Client
Se as variáveis de ambiente não estão configuradas:

```bash
# Verifique se existe .env.local com:
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
```

#### B. Problema com AuthProvider
O AuthProvider pode estar travado esperando resposta do Supabase.

**Solução temporária**: Comentar o AuthProvider no layout:

```tsx
// apps/web/src/app/layout.tsx
// Comente temporariamente:
// <AuthProvider>
  <QueryProvider>
    {/* ... resto do código ... */}
  </QueryProvider>
// </AuthProvider>
```

#### C. Problema com React Query
O QueryProvider pode estar travado.

**Solução**: Verificar se há queries infinitas.

#### D. Problema com as novas páginas de checkout
As páginas que criei podem estar causando o problema.

**Solução temporária**: Reverter as páginas:

```tsx
// apps/web/src/app/checkout/page.tsx
export default function CheckoutPage() {
  return <div>Checkout em construção</div>;
}

// apps/web/src/app/pedido/confirmado/page.tsx
export default function OrderConfirmationPage() {
  return <div>Confirmação em construção</div>;
}
```

### 4. Teste Rápido

Crie uma página de teste simples:

```tsx
// apps/web/src/app/test/page.tsx
export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Teste OK</h1>
      <p>Se você está vendo isso, o Next.js está funcionando.</p>
    </div>
  );
}
```

Acesse `http://localhost:3000/test`

Se funcionar, o problema é específico da home ou de algum provider.

### 5. Limpar Cache

```bash
# Pare o servidor (Ctrl+C)
# Limpe o cache do Next.js
rm -rf apps/web/.next
rm -rf .turbo

# Reinstale dependências (opcional)
npm install

# Inicie novamente
npm run dev
```

### 6. Verificar Dependências Circulares

```bash
# No diretório apps/web
npx madge --circular --extensions ts,tsx src/
```

## Solução Rápida

Se você quer apenas testar o checkout sem resolver o loading:

1. Comente o AuthProvider no layout
2. Modifique a página de checkout para não verificar auth:

```tsx
// apps/web/src/app/checkout/page.tsx
import { CheckoutPageClient } from '@/modules/checkout/components/CheckoutPageClient';

export default function CheckoutPage() {
  // Mock data para teste
  const mockItems = [
    {
      id: '1',
      productId: '1',
      productName: 'Produto Teste',
      productPrice: 100,
      quantity: 1,
      size: 'M',
    }
  ];

  return (
    <CheckoutPageClient 
      cartItems={mockItems}
      userEmail="teste@example.com"
    />
  );
}
```

## Próximos Passos

Depois de identificar a causa:

1. Se for problema de env: Configure as variáveis
2. Se for problema de auth: Verifique conexão com Supabase
3. Se for problema das novas páginas: Vamos ajustar o código

Me avise o que você encontrou no console/terminal para eu ajudar melhor!
