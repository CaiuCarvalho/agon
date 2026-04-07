# Debug: Erro "Tente novamente em instantes"

## 🔍 Como Debugar

### 1. Verificar Logs do Servidor

Quando você tenta finalizar o pedido, olhe no terminal onde está rodando `npm run dev`.

Você deve ver logs como:

```
Creating Mercado Pago preference...
Mercado Pago SDK: Creating preference with request: { ... }
```

**Se der erro, você verá:**
```
Mercado Pago SDK error: { message: '...', status: ..., response: ... }
```

### 2. Possíveis Causas do Erro

#### Causa 1: Access Token Inválido

**Sintoma:** Erro 401 ou "Invalid credentials"

**Solução:**
1. Verifique se o Access Token está correto
2. Certifique-se de usar o Access Token de TEST (não o Public Key)
3. O token deve começar com `APP_USR-`

**Como obter o token correto:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em "Credenciais de teste"
4. Copie o **Access Token** (não o Public Key)

#### Causa 2: Formato do Request Inválido

**Sintoma:** Erro 400 ou "Bad request"

**Solução:** Verifique se os dados do pedido estão corretos

#### Causa 3: SDK do Mercado Pago não instalado corretamente

**Sintoma:** Erro "Cannot find module 'mercadopago'"

**Solução:**
```bash
cd apps/web
npm install mercadopago@^2.0.0
```

### 3. Teste Manual da API

Você pode testar a API diretamente:

```bash
# Substitua SEU_TOKEN pelo seu Access Token real
curl -X POST https://api.mercadopago.com/checkout/preferences \
  -H "Authorization: Bearer APP_USR-SEU-TOKEN-AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "title": "Produto Teste",
        "quantity": 1,
        "unit_price": 100,
        "currency_id": "BRL"
      }
    ],
    "payer": {
      "email": "test@example.com"
    }
  }'
```

**Se funcionar, você verá:**
```json
{
  "id": "123456789-abc-def",
  "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  ...
}
```

**Se não funcionar, você verá o erro:**
```json
{
  "message": "invalid credentials",
  "error": "unauthorized",
  "status": 401
}
```

### 4. Verificar Variáveis de Ambiente

Execute no terminal:

```bash
cd apps/web
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const token = env.match(/MERCADOPAGO_ACCESS_TOKEN=(.+)/)?.[1];
console.log('Token encontrado:', token ? 'SIM' : 'NÃO');
console.log('Token começa com APP_USR-:', token?.startsWith('APP_USR-') ? 'SIM' : 'NÃO');
console.log('Tamanho do token:', token?.length || 0);
"
```

**Resultado esperado:**
```
Token encontrado: SIM
Token começa com APP_USR-: SIM
Tamanho do token: 70-80 caracteres
```

### 5. Reiniciar Servidor

Depois de qualquer mudança no `.env.local`:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## 🐛 Erros Comuns e Soluções

### Erro: "Invalid credentials" ou 401

**Problema:** Access Token inválido ou expirado

**Solução:**
1. Obtenha um novo Access Token de teste
2. Atualize `.env.local`
3. Reinicie o servidor

### Erro: "Bad request" ou 400

**Problema:** Dados do request inválidos

**Solução:** Verifique os logs para ver qual campo está inválido

### Erro: "Cannot find module 'mercadopago'"

**Problema:** Pacote não instalado

**Solução:**
```bash
cd apps/web
npm install mercadopago@^2.0.0
npm run dev
```

### Erro: "MERCADOPAGO_ACCESS_TOKEN is not configured"

**Problema:** Variável de ambiente não carregada

**Solução:**
1. Verifique se `.env.local` existe em `apps/web/`
2. Verifique se o nome da variável está correto
3. Reinicie o servidor

## 📋 Checklist de Debug

- [ ] Logs do servidor mostram o erro específico
- [ ] Access Token está correto e começa com `APP_USR-`
- [ ] Variáveis de ambiente estão carregadas
- [ ] Pacote mercadopago está instalado
- [ ] Servidor foi reiniciado após mudanças
- [ ] Teste manual da API funciona

## 💡 Próximos Passos

Depois de identificar o erro:

1. **Se for problema de credenciais:**
   - Obtenha novo Access Token
   - Atualize `.env.local`
   - Reinicie servidor

2. **Se for problema de código:**
   - Me passe os logs completos do erro
   - Vou ajustar o código

3. **Se funcionar:**
   - Vamos implementar as páginas de resultado
   - Vamos melhorar o visual

## 📞 Me Passe Essas Informações

Para eu te ajudar melhor, me envie:

1. **Logs do servidor** (terminal onde roda `npm run dev`)
2. **Erro específico** que aparece
3. **Resultado do teste manual** da API (curl acima)
4. **Verificação das variáveis** de ambiente

Com essas informações, consigo identificar exatamente o problema!
