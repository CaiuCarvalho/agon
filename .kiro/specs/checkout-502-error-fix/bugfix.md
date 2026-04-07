# Bugfix Requirements Document

## Introduction

Este documento descreve os requisitos para corrigir o erro 502 (Bad Gateway) que ocorre em produção quando usuários tentam finalizar pedidos no checkout. O erro impede completamente a conclusão de compras, tornando o sistema inutilizável para seu propósito principal.

A análise inicial identificou que a causa raiz é a ausência da variável de ambiente `NEXT_PUBLIC_APP_URL` em produção, que é validada pelo código e resulta em erro 500 interno, manifestando-se como 502 para o usuário. Adicionalmente, existem problemas de timeout e configuração que podem agravar o problema em condições de rede instável.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a variável `NEXT_PUBLIC_APP_URL` não está configurada em produção THEN o sistema retorna erro 500 com mensagem "Configuração de URL ausente" (linhas 33-38 de `route.ts`)

1.2 WHEN o usuário clica em "Finalizar Pedido" no checkout em produção THEN o sistema retorna erro 502 (Bad Gateway) ao invés de processar o pedido

1.3 WHEN o Mercado Pago SDK demora mais que o timeout configurado (30s) para responder THEN o sistema pode exceder limites do Next.js e causar erro 502

1.4 WHEN o fetch do cliente (`useCheckout.ts`) não tem timeout configurado THEN a requisição pode travar indefinidamente esperando resposta do servidor

1.5 WHEN o arquivo `.env.production` não contém as variáveis necessárias THEN o sistema em produção não tem acesso às configurações críticas (NEXT_PUBLIC_APP_URL, MERCADOPAGO_ACCESS_TOKEN)

### Expected Behavior (Correct)

2.1 WHEN a variável `NEXT_PUBLIC_APP_URL` não está configurada THEN o sistema SHALL retornar erro claro e descritivo que facilite o diagnóstico em produção

2.2 WHEN o usuário clica em "Finalizar Pedido" no checkout em produção com variáveis configuradas corretamente THEN o sistema SHALL processar o pedido e redirecionar para o Mercado Pago

2.3 WHEN o Mercado Pago SDK demora para responder THEN o sistema SHALL ter timeout apropriado (menor que limite do Next.js) e retornar erro 504 (Gateway Timeout) com mensagem clara

2.4 WHEN o fetch do cliente faz requisição ao servidor THEN o sistema SHALL ter AbortSignal configurado com timeout de 60 segundos para evitar travamento indefinido

2.5 WHEN o sistema é implantado em produção THEN o arquivo `.env.production` SHALL conter template claro com todas as variáveis necessárias e instruções de configuração

### Unchanged Behavior (Regression Prevention)

3.1 WHEN todas as variáveis de ambiente estão configuradas corretamente THEN o sistema SHALL CONTINUE TO processar pedidos normalmente como em desenvolvimento

3.2 WHEN o Mercado Pago responde dentro do timeout THEN o sistema SHALL CONTINUE TO criar preferência de pagamento e redirecionar o usuário

3.3 WHEN ocorrem erros de validação (carrinho vazio, estoque insuficiente, dados inválidos) THEN o sistema SHALL CONTINUE TO retornar mensagens de erro apropriadas (400, 401) sem afetar o fluxo

3.4 WHEN o webhook do Mercado Pago é recebido THEN o sistema SHALL CONTINUE TO processar notificações de pagamento corretamente

3.5 WHEN usuários acessam outras páginas do site (home, produtos, carrinho) THEN o sistema SHALL CONTINUE TO funcionar normalmente sem impacto

## Bug Condition

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CheckoutRequest
  OUTPUT: boolean
  
  // Returns true when bug condition is met
  RETURN (
    X.environment = "production" AND
    (
      X.env.NEXT_PUBLIC_APP_URL = null OR
      X.env.NEXT_PUBLIC_APP_URL = "" OR
      X.env.MERCADOPAGO_ACCESS_TOKEN = null OR
      X.env.MERCADOPAGO_ACCESS_TOKEN = ""
    )
  ) OR (
    X.mercadoPagoResponseTime > 30000 AND
    X.nextJsTimeout <= 60000
  ) OR (
    X.clientFetchTimeout = null
  )
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Environment Configuration
FOR ALL X WHERE isBugCondition(X) DO
  result ← processCheckout'(X)
  ASSERT (
    (X.env.NEXT_PUBLIC_APP_URL != null AND X.env.NEXT_PUBLIC_APP_URL != "") AND
    (X.env.MERCADOPAGO_ACCESS_TOKEN != null AND X.env.MERCADOPAGO_ACCESS_TOKEN != "") AND
    (result.status = 200 OR result.status IN [400, 401, 504]) AND
    result.status != 502 AND
    result.status != 500
  )
END FOR

// Property: Fix Checking - Timeout Handling
FOR ALL X WHERE X.mercadoPagoResponseTime > 30000 DO
  result ← processCheckout'(X)
  ASSERT (
    result.status = 504 AND
    result.error CONTAINS "timeout" AND
    no_crash(result)
  )
END FOR

// Property: Fix Checking - Client Timeout
FOR ALL X WHERE X.clientFetchTimeout != null DO
  result ← clientCheckout'(X)
  ASSERT (
    X.clientFetchTimeout = 60000 AND
    (result.success = true OR result.error != "indefinite_hang")
  )
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT processCheckout(X) = processCheckout'(X)
END FOR
```

Isso garante que para todas as requisições com configuração correta e dentro dos limites de timeout, o código corrigido se comporta identicamente ao original.

## Counterexamples

### Exemplo 1: Missing NEXT_PUBLIC_APP_URL
```typescript
Input: {
  environment: "production",
  env: {
    NEXT_PUBLIC_APP_URL: undefined,
    MERCADOPAGO_ACCESS_TOKEN: "APP_USR-xxx"
  },
  shippingInfo: { /* valid data */ }
}

Current Output: {
  status: 500,
  error: "Configuração de URL ausente"
}
// Manifests as 502 to user

Expected Output: {
  status: 200,
  orderId: "uuid",
  initPoint: "https://mercadopago.com/..."
}
```

### Exemplo 2: Mercado Pago Timeout
```typescript
Input: {
  environment: "production",
  env: { /* all configured */ },
  mercadoPagoResponseTime: 35000, // 35 seconds
  shippingInfo: { /* valid data */ }
}

Current Output: {
  status: 502,
  error: "Bad Gateway"
}

Expected Output: {
  status: 504,
  error: "Timeout ao conectar com o serviço de pagamento. Por favor, tente novamente."
}
```

### Exemplo 3: Client Fetch Hangs
```typescript
Input: {
  clientFetchTimeout: null,
  serverResponseTime: Infinity // server never responds
}

Current Output: {
  // Request hangs indefinitely
  status: "pending forever"
}

Expected Output: {
  status: "aborted",
  error: "Request timeout after 60 seconds"
}
```
