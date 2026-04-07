# 🛠️ Comandos Úteis - Debug e Manutenção

## 🚀 Desenvolvimento

### Iniciar servidor
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Verificar tipos TypeScript
```bash
npm run type-check
```

## 🧪 Debug no Navegador

### Limpar tudo e recomeçar
```javascript
// Abra DevTools Console (F12) e execute:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Forçar migração
```javascript
localStorage.setItem('agon_migrated', 'true');
location.reload();
```

### Resetar migração
```javascript
localStorage.removeItem('agon_migrated');
location.reload();
```

### Ver estado atual
```javascript
// Migration status
console.log('Migrated:', localStorage.getItem('agon_migrated'));

// Cart local
console.log('Local cart:', JSON.parse(localStorage.getItem('agon_cart') || '{}'));

// Wishlist local
console.log('Local wishlist:', JSON.parse(localStorage.getItem('agon_wishlist') || '{}'));
```

### Verificar React Query cache
```javascript
// Instalar DevTools primeiro:
// npm install @tanstack/react-query-devtools

// Depois adicionar no layout.tsx:
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Dentro do QueryProvider:
<ReactQueryDevtools initialIsOpen={false} />
```

## 🗄️ Supabase

### Verificar produtos
```sql
SELECT id, name, price, stock, image_url 
FROM products 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar carrinho do usuário
```sql
-- Substitua USER_ID pelo ID do usuário
SELECT 
  ci.*,
  p.name as product_name,
  p.price as current_price
FROM cart_items ci
LEFT JOIN products p ON p.id = ci.product_id
WHERE ci.user_id = 'USER_ID'
ORDER BY ci.created_at DESC;
```

### Verificar wishlist do usuário
```sql
-- Substitua USER_ID pelo ID do usuário
SELECT 
  wi.*,
  p.name as product_name,
  p.price,
  p.stock
FROM wishlist_items wi
LEFT JOIN products p ON p.id = wi.product_id
WHERE wi.user_id = 'USER_ID'
ORDER BY wi.created_at DESC;
```

### Limpar carrinho do usuário
```sql
-- CUIDADO: Isso remove TODOS os itens do carrinho
-- Substitua USER_ID pelo ID do usuário
DELETE FROM cart_items WHERE user_id = 'USER_ID';
```

### Limpar wishlist do usuário
```sql
-- CUIDADO: Isso remove TODOS os itens da wishlist
-- Substitua USER_ID pelo ID do usuário
DELETE FROM wishlist_items WHERE user_id = 'USER_ID';
```

### Verificar RPC functions
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'add_to_cart_atomic',
  'migrate_cart_items',
  'migrate_wishlist_items',
  'create_order_atomic'
);
```

### Verificar Realtime
```sql
-- No Supabase Dashboard:
-- 1. Ir para Database > Replication
-- 2. Verificar se cart_items e wishlist_items estão habilitados
-- 3. Se não, habilitar:

-- Habilitar Realtime para cart_items
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- Habilitar Realtime para wishlist_items
ALTER PUBLICATION supabase_realtime ADD TABLE wishlist_items;
```

## 🔍 Logs de Debug

### Habilitar logs detalhados
```javascript
// No início do arquivo que você quer debugar:
const DEBUG = true;

// Usar assim:
if (DEBUG) console.log('[DEBUG]', 'Mensagem aqui');
```

### Logs esperados no console

**Ao carregar página**:
```
[Migration] Already migrated, marking as complete
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: 2
```

**Ao adicionar ao carrinho**:
```
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: abc-123
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: 3
```

**Realtime event**:
```
Cart realtime event: {
  eventType: 'INSERT',
  new: { id: '...', product_id: '...', ... }
}
```

## 🧹 Limpeza

### Remover node_modules e reinstalar
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Limpar cache do Next.js
```bash
rm -rf .next
npm run dev
```

### Limpar cache do Turbo
```bash
rm -rf .turbo
npm run dev
```

## 📊 Performance

### Medir tempo de resposta
```javascript
// No DevTools Console:
performance.mark('start');

// Fazer ação (ex: adicionar ao carrinho)

performance.mark('end');
performance.measure('action', 'start', 'end');
console.log(performance.getEntriesByName('action')[0].duration);
```

### Verificar tamanho do bundle
```bash
npm run build
# Verificar output para ver tamanho dos chunks
```

## 🔐 Autenticação

### Fazer login via console
```javascript
// Não recomendado para produção, apenas para debug
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'teste@agon.com',
  password: 'teste123'
});
console.log('Login:', data, error);
```

### Verificar usuário atual
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Fazer logout
```javascript
await supabase.auth.signOut();
location.reload();
```

## 🎨 UI Debug

### Mostrar bordas em todos os elementos
```javascript
// No DevTools Console:
document.querySelectorAll('*').forEach(el => {
  el.style.outline = '1px solid red';
});
```

### Verificar React Query cache visualmente
```javascript
// Instalar DevTools:
npm install @tanstack/react-query-devtools

// Adicionar no layout.tsx:
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

## 📱 Mobile Debug

### Simular mobile no Chrome
```
1. F12 (DevTools)
2. Ctrl+Shift+M (Toggle device toolbar)
3. Selecionar dispositivo
```

### Debug remoto (Android)
```
1. Conectar dispositivo via USB
2. Habilitar USB debugging
3. Chrome: chrome://inspect
4. Selecionar dispositivo
```

## 🚨 Troubleshooting Rápido

### Problema: Carrinho não atualiza
```javascript
localStorage.setItem('agon_migrated', 'true');
location.reload();
```

### Problema: Erro de CORS
```javascript
// Verificar se NEXT_PUBLIC_SUPABASE_URL está correto
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

### Problema: Query não invalida
```javascript
// Forçar invalidação manual:
queryClient.invalidateQueries({ queryKey: ['cart', userId] });
```

### Problema: Optimistic update não reverte
```javascript
// Verificar se onError tem rollback:
onError: (error, variables, context) => {
  if (context?.previousCart) {
    queryClient.setQueryData(['cart', userId], context.previousCart);
  }
}
```

## 📚 Documentação

### Abrir documentação
- React Query: https://tanstack.com/query/latest
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

### Arquivos de referência
- `QUICK-TEST.md` - Teste rápido
- `VALIDATION-CHECKLIST.md` - Checklist completo
- `FRONTEND-SYNC-FIX.md` - Detalhes técnicos
- `RESUMO-FINAL.md` - Resumo em português

## 💡 Dicas

1. **Sempre limpe o cache** quando algo estranho acontecer
2. **Use o console** para ver logs de debug
3. **Verifique o Supabase** para confirmar que dados foram salvos
4. **Teste em incógnito** para evitar cache do navegador
5. **Use React Query DevTools** para visualizar cache

---

**Atalhos Úteis**:
- `F12` - Abrir DevTools
- `Ctrl+Shift+C` - Inspecionar elemento
- `Ctrl+Shift+M` - Toggle device toolbar
- `Ctrl+Shift+R` - Hard refresh (limpa cache)
