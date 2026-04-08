# Checklist de Deploy - Correções de Produtos e Checkout

## ✅ Correções Implementadas

### 1. Home Page - Loading Infinito de Produtos
- **Problema**: Produtos não carregavam na página inicial (loading infinito)
- **Causa**: Falta de política RLS (Row Level Security) na tabela `products`
- **Solução**: Migration que habilita acesso público de leitura

### 2. Checkout - Erro 502
- **Problema**: Checkout dava erro 502 intermitentemente
- **Causa**: Timeout na comunicação com API do Mercado Pago
- **Solução**: Já estava implementada no código (timeout de 25s + retry logic)

---

## 📋 Passos para Deploy

### 1. Aplicar Migration no Supabase (OBRIGATÓRIO)

```bash
# No Supabase Dashboard > SQL Editor, execute:
```

```sql
-- Migration: Enable public read access to products table
-- File: supabase/migrations/20260407000001_enable_products_public_access.sql

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "products_select_public" ON products;

-- Create policy to allow public read access to non-deleted products
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  TO public
  USING (deleted_at IS NULL);
```

### 2. Verificar Variáveis de Ambiente no VPS

Certifique-se de que estas variáveis estão configuradas no servidor:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yyhpqecnxkvtnjdqhwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mroZkoN304nIVzqr1slUyw_vr6azXqF

# Mercado Pago (TEST credentials)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850
MERCADOPAGO_WEBHOOK_SECRET=meu-segredo-webhook-super-secreto-2024

# App URL (IMPORTANTE: Mudar para URL de produção)
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Resend (Email)
RESEND_API_KEY=re_WLdtEeVk_PhBJzS9f4fUg5oco2zPD1cEB
```

⚠️ **ATENÇÃO**: Lembre-se de mudar `NEXT_PUBLIC_APP_URL` para a URL de produção!

### 3. Deploy do Código

```bash
# 1. Commit e push das alterações
git add .
git commit -m "fix: enable public access to products table and improve checkout timeout handling"
git push origin main

# 2. No VPS, fazer pull e rebuild
cd /caminho/do/projeto
git pull origin main
npm install
npm run build
pm2 restart all  # ou o comando que você usa para reiniciar
```

### 4. Testes Pós-Deploy

#### Teste 1: Produtos na Home
1. Acesse `https://agonimports.com`
2. Verifique se os produtos carregam (não deve ficar em loading infinito)
3. Se não carregar, clique em "Tentar Novamente"

#### Teste 2: Checkout
1. Adicione um produto ao carrinho
2. Vá para o checkout
3. Preencha os dados de entrega
4. Clique em "Finalizar Pedido"
5. Deve redirecionar para o Mercado Pago

#### Teste 3: Verificar Logs
```bash
# No VPS, verificar logs do servidor
pm2 logs web  # ou o nome do seu processo

# Procure por:
# ✓ [CHECKOUT] Order created successfully
# ✓ Preference created successfully
```

---

## 🔍 Troubleshooting

### Se produtos não carregarem:
1. Verifique se a migration foi aplicada no Supabase
2. Execute no SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'products';
   ```
   Deve retornar a policy `products_select_public`

### Se checkout der erro 502:
1. Verifique os logs do servidor
2. Procure por mensagens de timeout do Mercado Pago
3. Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado
4. Teste conectividade com Mercado Pago:
   ```bash
   node test-mercadopago-timeout.js
   ```

### Se aparecer erro de variáveis de ambiente:
1. Verifique se o arquivo `.env.production` existe no VPS
2. Ou se as variáveis estão configuradas no PM2/Docker
3. Reinicie o servidor após adicionar variáveis

---

## 📝 Arquivos Modificados

- `supabase/migrations/20260407000001_enable_products_public_access.sql` (NOVO)
- `apps/web/src/lib/react-query/QueryProvider.tsx` (timeout de 10s)
- `apps/web/src/modules/products/services/productService.ts` (timeout wrapper)
- `apps/web/src/app/page.tsx` (error state com retry)

## 📝 Arquivos de Teste Criados

- `supabase/update-product-price-test.sql` (helper para testes)
- `test-mercadopago-timeout.js` (teste de conectividade)

---

## ✅ Checklist Final

- [ ] Migration aplicada no Supabase
- [ ] Variáveis de ambiente configuradas no VPS
- [ ] `NEXT_PUBLIC_APP_URL` atualizada para produção
- [ ] Código commitado e pushed
- [ ] Deploy feito no VPS
- [ ] Servidor reiniciado
- [ ] Teste de produtos na home ✓
- [ ] Teste de checkout ✓
- [ ] Logs verificados ✓

---

## 🎯 Próximos Passos (Opcional)

1. **Trocar credenciais de teste por produção** quando for lançar oficialmente
2. **Configurar webhook do Mercado Pago** para receber notificações de pagamento
3. **Adicionar imagens dos produtos** que estão retornando 404
4. **Monitorar logs** nas primeiras horas após deploy

---

Boa sorte com o deploy! 🚀
