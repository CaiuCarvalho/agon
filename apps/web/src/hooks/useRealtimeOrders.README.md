# useRealtimeOrders Hook

Hook React para subscrição em tempo real de atualizações de pedidos usando Supabase Realtime.

## Visão Geral

O hook `useRealtimeOrders` fornece uma interface simples para receber notificações em tempo real quando:
- Novos pedidos são criados (evento INSERT)
- Pedidos existentes mudam para status 'processing' (evento UPDATE)

## Características

✅ **Reconexão Automática**: Exponential backoff com até 5 tentativas  
✅ **Gerenciamento de Estado**: Rastreia status da conexão (connected, disconnected, error)  
✅ **Cleanup Automático**: Remove subscriptions ao desmontar componente  
✅ **TypeScript**: Totalmente tipado com interfaces exportadas  
✅ **Callbacks Opcionais**: onInsert, onUpdate, onError  
✅ **Transformação de Dados**: Converte snake_case do DB para camelCase  

## Instalação

O hook já está disponível em `apps/web/src/hooks/useRealtimeOrders.ts`.

## Uso Básico

```tsx
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { toast } from 'sonner';

function AdminOrdersPage() {
  const { status, reconnect } = useRealtimeOrders({
    onInsert: (order) => {
      toast.success(`Novo pedido: ${order.shippingName}`);
    },
    onUpdate: (order) => {
      toast.info(`Pedido atualizado: ${order.id}`);
    },
    onError: (error) => {
      console.error('Erro:', error);
    }
  });

  return (
    <div>
      <p>Status: {status}</p>
      {status === 'error' && (
        <button onClick={reconnect}>Reconectar</button>
      )}
    </div>
  );
}
```

## API

### Parâmetros

```typescript
interface UseRealtimeOrdersOptions {
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order, oldOrder?: Order) => void;
  onError?: (error: Error) => void;
}
```

- **onInsert**: Callback executado quando novo pedido é criado
- **onUpdate**: Callback executado quando pedido muda para 'processing'
- **onError**: Callback executado quando ocorre erro na conexão

### Retorno

```typescript
interface UseRealtimeOrdersReturn {
  status: 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
}
```

- **status**: Estado atual da conexão
- **reconnect**: Função para forçar reconexão manual

## Exemplos Avançados

### Com Notificações Toast

```tsx
const { status } = useRealtimeOrders({
  onInsert: (order) => {
    toast.success('Novo Pedido Aprovado!', {
      description: `${order.shippingName} - R$ ${order.totalAmount}`,
      action: {
        label: 'Ver Pedido',
        onClick: () => router.push(`/admin/orders/${order.id}`)
      },
      duration: 10000
    });
  }
});
```

### Com Atualização de Estado

```tsx
const [orders, setOrders] = useState<Order[]>([]);

useRealtimeOrders({
  onInsert: (order) => {
    setOrders(prev => [order, ...prev]);
  },
  onUpdate: (order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
  }
});
```

### Com Notificações do Navegador

```tsx
useRealtimeOrders({
  onInsert: (order) => {
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification('Novo Pedido!', {
        body: `${order.shippingName} - R$ ${order.totalAmount}`,
        icon: '/logo.png'
      });
    }
  }
});
```

## Reconexão

O hook implementa reconexão automática com exponential backoff:

- **Tentativa 1**: 1 segundo
- **Tentativa 2**: 2 segundos
- **Tentativa 3**: 4 segundos
- **Tentativa 4**: 8 segundos
- **Tentativa 5**: 16 segundos

Após 5 tentativas falhadas, o status muda para 'error' e você pode usar `reconnect()` para tentar manualmente.

## Filtros de Eventos

O hook filtra automaticamente:

### INSERT
- Todos os novos pedidos criados na tabela `orders`

### UPDATE
- Apenas pedidos onde `status = 'processing'`
- Útil para notificar quando pagamento é aprovado

## Transformação de Dados

O hook converte automaticamente os dados do banco (snake_case) para o formato da aplicação (camelCase):

```typescript
// Banco de dados (snake_case)
{
  user_id: "123",
  total_amount: 100.50,
  shipping_name: "João Silva"
}

// Aplicação (camelCase)
{
  userId: "123",
  totalAmount: 100.50,
  shippingName: "João Silva"
}
```

## Tratamento de Erros

O hook trata os seguintes cenários de erro:

1. **Erro de Conexão**: Tenta reconectar automaticamente
2. **Timeout**: Tenta reconectar automaticamente
3. **Erro no Callback**: Loga erro mas continua funcionando
4. **Max Tentativas**: Muda status para 'error'

## Performance

- **Singleton Client**: Usa cliente Supabase singleton para evitar múltiplas conexões
- **Cleanup Automático**: Remove subscriptions ao desmontar
- **Filtros Server-Side**: Filtra eventos no servidor para reduzir tráfego

## Requisitos

- Supabase Realtime habilitado para tabela `orders`
- Políticas RLS configuradas para permitir subscriptions de admins
- Variáveis de ambiente configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

### Hook não conecta

1. Verifique se Realtime está habilitado no Supabase Dashboard
2. Verifique políticas RLS da tabela `orders`
3. Verifique variáveis de ambiente

### Callbacks não executam

1. Verifique se eventos estão sendo gerados (INSERT/UPDATE)
2. Verifique filtro de status ('processing')
3. Verifique logs do console para erros

### Reconexão não funciona

1. Verifique se atingiu limite de 5 tentativas
2. Use `reconnect()` manual
3. Verifique conexão de internet

## Testes

Execute os testes com:

```bash
npm run test -- src/hooks/__tests__/useRealtimeOrders.test.ts
```

## Relacionado

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Design Document](/.kiro/specs/payment-status-notifications/design.md)
- [Requirements](/.kiro/specs/payment-status-notifications/requirements.md)

## Licença

Parte do projeto Agon E-commerce.
