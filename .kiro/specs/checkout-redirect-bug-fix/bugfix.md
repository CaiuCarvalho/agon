# Bugfix Requirements Document

## Introduction

Este documento descreve os requisitos para corrigir o bug crítico no fluxo de checkout onde usuários são redirecionados silenciosamente para a página inicial (/) ao invés de serem direcionados para a página de checkout (/checkout) após clicar em "Finalizar Compra" no carrinho.

O bug impede completamente a conclusão de compras, tornando o sistema inutilizável para seu propósito principal. Não há mensagens de erro visíveis para o usuário, resultando em uma experiência frustrante e perda de conversões.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário clica no botão "Finalizar Compra" no carrinho (`/cart`) THEN o sistema redireciona silenciosamente para a página inicial (`/`) sem qualquer feedback ou mensagem de erro

1.2 WHEN o usuário tenta acessar `/checkout` diretamente pela URL THEN o sistema pode redirecionar para `/` sem explicação clara

1.3 WHEN o middleware detecta erro de autenticação ou timeout na verificação de sessão THEN o sistema redireciona para `/login` mas pode falhar e redirecionar para `/` em casos de erro

1.4 WHEN o componente `CheckoutPage` (server component) falha ao buscar dados do carrinho THEN o sistema redireciona para `/cart` mas pode falhar e redirecionar para `/` em casos de erro não tratado

1.5 WHEN o carrinho está vazio no momento do acesso ao checkout THEN o sistema redireciona para `/cart` mas pode falhar silenciosamente e redirecionar para `/`

1.6 WHEN ocorre erro de rede ou timeout no Supabase durante verificação de autenticação THEN o middleware pode falhar e redirecionar para `/` ao invés de mostrar erro apropriado

### Expected Behavior (Correct)

2.1 WHEN o usuário clica no botão "Finalizar Compra" no carrinho com autenticação válida e carrinho não-vazio THEN o sistema SHALL navegar para `/checkout` e exibir o formulário de checkout

2.2 WHEN o usuário tenta acessar `/checkout` diretamente com autenticação válida e carrinho não-vazio THEN o sistema SHALL exibir a página de checkout normalmente

2.3 WHEN o middleware detecta erro de autenticação THEN o sistema SHALL redirecionar para `/login?redirect=/checkout` com mensagem clara de que é necessário fazer login

2.4 WHEN o componente `CheckoutPage` detecta carrinho vazio THEN o sistema SHALL redirecionar para `/cart` com toast de erro "Seu carrinho está vazio"

2.5 WHEN ocorre erro ao buscar dados do carrinho no servidor THEN o sistema SHALL exibir página de erro apropriada (500) com mensagem "Erro ao carregar checkout. Tente novamente."

2.6 WHEN ocorre timeout no middleware durante verificação de sessão THEN o sistema SHALL redirecionar para `/login` com mensagem "Erro ao verificar autenticação. Faça login novamente."

2.7 WHEN o usuário não está autenticado e tenta acessar `/checkout` THEN o sistema SHALL redirecionar para `/login?redirect=/checkout` preservando a intenção de navegação

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o usuário está autenticado, tem carrinho não-vazio, e todas as verificações passam THEN o sistema SHALL CONTINUE TO exibir a página de checkout normalmente

3.2 WHEN o usuário completa o checkout com sucesso THEN o sistema SHALL CONTINUE TO redirecionar para o Mercado Pago (init_point) conforme implementado

3.3 WHEN o usuário acessa outras páginas do site (home, produtos, perfil) THEN o sistema SHALL CONTINUE TO funcionar normalmente sem impacto

3.4 WHEN o middleware protege rotas `/admin` e `/perfil` THEN o sistema SHALL CONTINUE TO aplicar as mesmas regras de autenticação e autorização

3.5 WHEN ocorrem erros de validação no formulário de checkout THEN o sistema SHALL CONTINUE TO exibir mensagens de erro inline apropriadas

## Bug Condition

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CheckoutNavigationRequest
  OUTPUT: boolean
  
  // Returns true when bug condition is met
  RETURN (
    // Caso 1: Middleware falha e não redireciona corretamente
    (X.middlewareError = true AND X.redirectTarget = "/") OR
    
    // Caso 2: CheckoutPage falha ao buscar carrinho e não trata erro
    (X.checkoutPageError = true AND X.errorHandling = "unhandled") OR
    
    // Caso 3: Carrinho vazio mas redirecionamento falha
    (X.cartEmpty = true AND X.redirectTarget = "/" AND X.expectedRedirect = "/cart") OR
    
    // Caso 4: Timeout no middleware sem tratamento apropriado
    (X.middlewareTimeout = true AND X.redirectTarget != "/login") OR
    
    // Caso 5: Link do carrinho está quebrado ou mal configurado
    (X.navigationSource = "cart_button" AND X.actualDestination = "/" AND X.expectedDestination = "/checkout")
  )
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Correct Navigation
FOR ALL X WHERE isBugCondition(X) DO
  result ← handleCheckoutNavigation'(X)
  ASSERT (
    // Navegação correta baseada no contexto
    (X.authenticated = true AND X.cartNotEmpty = true) IMPLIES result.destination = "/checkout" AND
    (X.authenticated = false) IMPLIES result.destination = "/login?redirect=/checkout" AND
    (X.cartEmpty = true) IMPLIES result.destination = "/cart" AND
    
    // Feedback apropriado ao usuário
    (result.destination != "/checkout") IMPLIES result.userFeedback != null AND
    
    // Nunca redirecionar silenciosamente para "/"
    result.destination != "/" AND
    
    // Logs apropriados para diagnóstico
    result.logged = true
  )
END FOR

// Property: Fix Checking - Error Handling
FOR ALL X WHERE X.hasError = true DO
  result ← handleCheckoutNavigation'(X)
  ASSERT (
    // Erros devem ser tratados explicitamente
    result.errorHandled = true AND
    result.userFeedback != null AND
    result.logged = true AND
    
    // Nunca falhar silenciosamente
    result.destination != "/" OR result.userFeedback != null
  )
END FOR

// Property: Fix Checking - Middleware Timeout
FOR ALL X WHERE X.middlewareTimeout = true DO
  result ← handleMiddleware'(X)
  ASSERT (
    result.destination = "/login" AND
    result.userFeedback CONTAINS "timeout" OR "autenticação" AND
    result.logged = true
  )
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handleCheckoutNavigation(X) = handleCheckoutNavigation'(X)
END FOR
```

Isso garante que para todas as navegações válidas (usuário autenticado, carrinho não-vazio, sem erros), o código corrigido se comporta identicamente ao original.

## Counterexamples

### Exemplo 1: Redirecionamento Silencioso do Carrinho

```typescript
Input: {
  navigationSource: "cart_button",
  authenticated: true,
  cartNotEmpty: true,
  middlewareError: false,
  checkoutPageError: false
}

Current Output: {
  destination: "/",
  userFeedback: null,
  logged: false
}

Expected Output: {
  destination: "/checkout",
  userFeedback: null,
  logged: true
}
```

### Exemplo 2: Middleware Timeout Sem Tratamento

```typescript
Input: {
  navigationSource: "direct_url",
  authenticated: "unknown", // timeout ao verificar
  middlewareTimeout: true,
  timeoutDuration: 5000 // 5 segundos
}

Current Output: {
  destination: "/", // ou comportamento indefinido
  userFeedback: null,
  logged: false
}

Expected Output: {
  destination: "/login?redirect=/checkout",
  userFeedback: "Erro ao verificar autenticação. Faça login novamente.",
  logged: true,
  logMessage: "[Middleware] Session timeout after 5000ms"
}
```

### Exemplo 3: Carrinho Vazio com Redirecionamento Incorreto

```typescript
Input: {
  navigationSource: "direct_url",
  authenticated: true,
  cartEmpty: true,
  expectedRedirect: "/cart"
}

Current Output: {
  destination: "/",
  userFeedback: null,
  logged: false
}

Expected Output: {
  destination: "/cart",
  userFeedback: "Seu carrinho está vazio",
  logged: true,
  logMessage: "[Checkout] Redirecting to cart - empty cart detected"
}
```

### Exemplo 4: Erro ao Buscar Carrinho Não Tratado

```typescript
Input: {
  navigationSource: "direct_url",
  authenticated: true,
  checkoutPageError: true,
  errorType: "supabase_fetch_error",
  errorMessage: "Failed to fetch cart items"
}

Current Output: {
  destination: "/", // ou crash
  userFeedback: null,
  logged: false
}

Expected Output: {
  destination: "/cart", // ou página de erro 500
  userFeedback: "Erro ao carregar checkout. Tente novamente.",
  logged: true,
  logMessage: "[Checkout] Failed to fetch cart: Failed to fetch cart items"
}
```

### Exemplo 5: Link do Carrinho Mal Configurado

```typescript
Input: {
  navigationSource: "cart_button",
  linkHref: "/", // incorreto
  expectedHref: "/checkout"
}

Current Output: {
  destination: "/",
  userFeedback: null,
  logged: false
}

Expected Output: {
  destination: "/checkout",
  userFeedback: null,
  logged: false // navegação normal, não precisa log
}
```

## Possíveis Causas Raiz

Com base na análise do código, as possíveis causas raiz incluem:

1. **Link Incorreto no Carrinho**: O componente `apps/web/src/app/cart/page.tsx` pode ter o `href` configurado incorretamente ou o Link do Next.js pode estar falhando

2. **Middleware Redirecionando Incorretamente**: O `middleware.ts` pode estar capturando erros e redirecionando para `/` ao invés de `/login` ou tratando o erro apropriadamente

3. **CheckoutPage Falhando Silenciosamente**: O server component `apps/web/src/app/checkout/page.tsx` pode estar lançando exceções não tratadas que resultam em redirecionamento para `/`

4. **Timeout no Middleware**: O timeout de 5 segundos no middleware pode estar sendo excedido e causando redirecionamento incorreto

5. **Erro de Autenticação Não Tratado**: Falhas na verificação de sessão podem não estar sendo tratadas corretamente

6. **Carrinho Vazio Não Detectado Corretamente**: A verificação de carrinho vazio pode estar falhando e causando comportamento inesperado

## Áreas de Investigação

Para identificar a causa raiz exata, será necessário:

1. Verificar o `href` do Link "Finalizar Compra" em `apps/web/src/app/cart/page.tsx` (linha 226)
2. Adicionar logs detalhados no middleware para capturar redirecionamentos
3. Adicionar try-catch abrangente no `CheckoutPage` server component
4. Verificar se há algum redirecionamento global no layout ou error boundary
5. Testar o fluxo em produção com logs habilitados para capturar o comportamento exato
