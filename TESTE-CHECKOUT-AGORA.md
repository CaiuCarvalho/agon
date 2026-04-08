# TESTE DO CHECKOUT - PASSO A PASSO

## ✅ Correções Aplicadas

1. ✅ PORT corrigido no `.env.local` (3000 → 30000)
2. ✅ PM2 reiniciado e rodando na porta 30000
3. ✅ Nginx atualizado para `proxy_pass http://localhost:30000`
4. ✅ Nginx recarregado com sucesso

## 🧪 TESTE NO NAVEGADOR

### 1. Abrir o Site
```
https://agonimports.com
```

### 2. Adicionar Produto ao Carrinho
- Clique em qualquer produto
- Clique em "Adicionar ao Carrinho"
- Verifique se o contador do carrinho aumentou

### 3. Ir para o Carrinho
```
https://agonimports.com/cart
```

### 4. Finalizar Compra
- Clique em "Finalizar Compra"
- Preencha os dados:
  - Nome completo
  - Email
  - CPF
  - Telefone
  - Endereço completo

### 5. Clicar em "Finalizar Pedido"
**ESTE É O MOMENTO CRÍTICO**

## 📊 RESULTADOS ESPERADOS

### ✅ SE FUNCIONAR:
- Você será redirecionado para a página do Mercado Pago
- OU verá uma mensagem de sucesso
- OU será redirecionado para `/pedido/confirmado` ou `/pedido/pendente`

### ❌ SE DER ERRO 502:
- A página ficará em branco
- OU mostrará "502 Bad Gateway"
- OU ficará carregando infinitamente

## 🔍 SE AINDA DER ERRO 502

Execute no servidor:

```bash
# Ver logs em tempo real
pm2 logs agon-web

# Ver últimas 100 linhas
pm2 logs agon-web --lines 100

# Ver erros do Nginx
sudo tail -50 /var/log/nginx/error.log

# Verificar se a porta está correta
netstat -tlnp | grep 30000

# Testar a rota diretamente no servidor
curl -X POST http://localhost:30000/api/checkout/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": "test", "quantity": 1}],
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com",
      "cpf": "12345678900",
      "phone": "11999999999"
    },
    "shipping": {
      "street": "Rua Teste",
      "number": "123",
      "complement": "",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01000000"
    }
  }'
```

## 📝 ENVIE O RESULTADO

Depois de testar, me envie:

1. **Funcionou?** (Sim/Não)
2. **O que aconteceu?** (Descreva o que viu)
3. **Se deu erro**, copie e cole:
   - A mensagem de erro do navegador
   - Os logs do PM2: `pm2 logs agon-web --lines 50`
   - Os logs do Nginx: `sudo tail -50 /var/log/nginx/error.log`

## 🎯 PRÓXIMOS PASSOS

Se ainda der erro 502, o problema NÃO é mais de porta/nginx.

Será necessário investigar:
- Código da rota `/api/checkout/create-order`
- Variáveis de ambiente (MERCADOPAGO_ACCESS_TOKEN, etc)
- Timeout da requisição
- Erros de runtime no código

---

**TESTE AGORA E ME AVISE O RESULTADO!** 🚀
