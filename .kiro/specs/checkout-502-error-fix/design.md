# Checkout 502 Error Fix - Bugfix Design

## Overview

Este documento especifica a correção do erro 502 (Bad Gateway) que ocorre em produção ao finalizar pedidos no checkout. A análise identificou 5 condições de defeito principais:

1. **Variável NEXT_PUBLIC_APP_URL ausente** - causa erro 500 que se manifesta como 502
2. **Variável MERCADOPAGO_ACCESS_TOKEN ausente** - impede criação de preferências de pagamento
3. **Timeout do Mercado Pago SDK** - 30s pode exceder limites do Next.js causando 502
4. **Ausência de timeout no cliente** - requisições podem travar indefinidamente
5. **Arquivo .env.production incompleto** - falta template com variáveis necessárias

A estratégia de correção envolve: validação robusta de variáveis de ambiente, timeouts apropriados em cliente e servidor, tratamento de erros específico para timeouts, e documentação clara das configurações necessárias.

## Glossary

- **Bug_Condition (C)**: Conjunto de 5 condições que causam erro 502 no checkout em produção
- **Property (P)**: Comportamento esperado após correção - checkout funcional com tratamento apropriado de erros
- **Preservation**: Comportamento existente que deve permanecer inalterado (validações, rollback, webhook)
- **processCheckout**: Função `POST /api/checkout/create-order` em `apps/web/src/app/api/checkout/create-order/route.ts`
- **clientCheckout**: Hook `useCheckout` em `apps/web/src/modules/checkout/hooks/useCheckout.ts`
- **mercadoPagoService**: Serviço em `apps/web/src/modules/payment/services/mercadoPagoService.ts`
- **NEXT_PUBLIC_APP_URL**: Variável de ambiente que define URL base da aplicação (necessária para back_urls do Mercado Pago)
- **MERCADOPAGO_ACCESS_TOKEN**: Token de acesso do Mercado Pago (formato: APP_USR-xxx)

## Bug Details

### Bug Condition

O bug se manifesta quando qualquer uma das 5 condições de defeito ocorre durante o processo de checkout em produção. O sistema falha ao processar o pedido e retorna erro 502 ao usuário, impedindo completamente a conclusão de compras.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CheckoutRequest
  OUTPUT: boolean
  
  RETURN (
    // Condition 1: Missing NEXT_PUBLIC_APP_URL
    (input.environment = "production" AND 
     (input.env.NEXT_PUBLIC_APP_URL = null OR input.env.NEXT_PUBLIC_APP_URL = ""))
    
    OR
    
    // Condition 2: Missing MERCADOPAGO_ACCESS_TOKEN
    (input.environment = "production" AND 
     (input.env.MERCADOPAGO_ACCESS_TOKEN = null OR input.env.MERCADOPAGO_ACCESS_TOKEN = ""))
    
    OR
    
    // Condition 3: Mercado Pago timeout exceeds Next.js limit
    (input.mercadoPagoResponseTime > 30000 AND input.nextJsTimeout <= 60000)
    
    OR
    
    // Condition 4: Client fetch has no timeout
    (input.clientFetchTimeout = null)
    
    OR
    
    // Condition 5: .env.production missing required variables
    (input.envProductionFile.NEXT_PUBLIC_APP_URL = undefined OR
     input.envProductionFile.MERCADOPAGO_ACCESS_TOKEN = undefined)
  )
END FUNCTION
```

### Examples

- **Condition 1 - Missing NEXT_PUBLIC_APP_URL**: Usuário clica em "Finalizar Pedido" → Sistema valida variável (linha 33 de route.ts) → Retorna erro 500 "Configuração de URL ausente" → Manifesta como 502 para usuário → Pedido não é criado

- **Condition 2 - Missing MERCADOPAGO_ACCESS_TOKEN**: Usuário clica em "Finalizar Pedido" → Sistema valida token (linha 24 de route.ts) → Retorna erro 500 "Configuração de pagamento ausente" → Manifesta como 502 → Pedido não é criado

- **Condition 3 - Mercado Pago Timeout**: Usuário clica em "Finalizar Pedido" → Pedido criado no banco → Mercado Pago SDK demora 35s para responder → Next.js timeout (60s) é excedido → Retorna 502 → Pedido fica órfão no banco

- **Condition 4 - Client Fetch Hangs**: Usuário clica em "Finalizar Pedido" → Servidor nunca responde → Cliente fica aguardando indefinidamente → UI trava → Usuário não recebe feedback

- **Edge Case - Network Instability**: Rede instável causa múltiplos timeouts → Retry logic do SDK não é suficiente → Sistema retorna 502 ao invés de 504 (Gateway Timeout) apropriado

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Validação de dados de entrega (shippingFormSchema) deve continuar funcionando
- Rollback de pedido quando Mercado Pago falha deve continuar funcionando
- Tratamento de erros de validação (400, 401) deve continuar funcionando
- Webhook do Mercado Pago deve continuar processando notificações
- Invalidação do cache do carrinho após sucesso deve continuar funcionando
- Mensagens de erro específicas (carrinho vazio, estoque insuficiente) devem continuar funcionando

**Scope:**
Todas as requisições que NÃO envolvem as 5 condições de defeito devem ser completamente inalteradas. Isso inclui:
- Requisições com todas as variáveis configuradas corretamente
- Requisições onde Mercado Pago responde dentro do timeout
- Requisições com dados de entrega inválidos (devem continuar retornando 400)
- Requisições de usuários não autenticados (devem continuar retornando 401)
- Processamento de webhooks do Mercado Pago

## Hypothesized Root Cause

Baseado na análise do código e dos requisitos, as causas raiz são:

1. **Validação de Variáveis de Ambiente Incompleta**: O código valida `NEXT_PUBLIC_APP_URL` e `MERCADOPAGO_ACCESS_TOKEN` mas retorna erro 500 genérico que se manifesta como 502. A validação deveria retornar erro mais descritivo e o arquivo `.env.production` deveria ter template claro.

2. **Timeout do Mercado Pago SDK Inadequado**: O SDK está configurado com timeout de 30s (linha 31 de mercadoPagoService.ts), mas o Next.js tem limite de 60s para rotas API. Se o Mercado Pago demorar mais que 30s, o erro pode não ser tratado apropriadamente e causar 502.

3. **Ausência de Timeout no Cliente**: O hook `useCheckout` faz fetch sem AbortSignal (linha 18 de useCheckout.ts), permitindo que requisições travem indefinidamente se o servidor não responder.

4. **Tratamento de Erro de Timeout Inadequado**: O código trata erros de timeout (linhas 139-157 de route.ts) mas pode não cobrir todos os casos de timeout do SDK, especialmente quando o timeout é excedido antes do erro ser capturado.

5. **Documentação de Configuração Ausente**: O arquivo `.env.production` não contém as variáveis `NEXT_PUBLIC_APP_URL` e `MERCADOPAGO_ACCESS_TOKEN`, dificultando a configuração correta em produção.

## Correctness Properties

Property 1: Bug Condition - Environment Configuration Validation

_For any_ checkout request where environment variables are missing (NEXT_PUBLIC_APP_URL or MERCADOPAGO_ACCESS_TOKEN), the fixed system SHALL return appropriate error status (500) with clear error message that facilitates diagnosis, and SHALL NOT manifest as 502 to the user.

**Validates: Requirements 2.1, 2.5**

Property 2: Bug Condition - Timeout Handling

_For any_ checkout request where Mercado Pago SDK takes longer than configured timeout (30s), the fixed system SHALL return 504 (Gateway Timeout) with clear error message, SHALL rollback the order, and SHALL NOT return 502.

**Validates: Requirements 2.3**

Property 3: Bug Condition - Client Timeout Configuration

_For any_ checkout request from the client, the fixed useCheckout hook SHALL configure AbortSignal with 60-second timeout, preventing indefinite hangs and providing clear error feedback to the user.

**Validates: Requirements 2.4**

Property 4: Bug Condition - Production Environment Template

_For any_ deployment to production, the .env.production file SHALL contain clear template with all required variables (NEXT_PUBLIC_APP_URL, MERCADOPAGO_ACCESS_TOKEN) and configuration instructions.

**Validates: Requirements 2.5**

Property 5: Preservation - Existing Functionality

_For any_ checkout request where bug conditions do NOT hold (all variables configured, timeouts within limits), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing validations, rollback logic, and webhook processing.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**File**: `apps/web/src/app/api/checkout/create-order/route.ts`

**Function**: `POST`

**Specific Changes**:
1. **Melhorar Validação de Variáveis de Ambiente**: Adicionar validação mais robusta no início da função que retorna erro 500 com mensagem clara (não 502) quando variáveis estão ausentes
   - Manter validação existente nas linhas 24-38
   - Adicionar log detalhado para facilitar diagnóstico em produção
   - Garantir que erro 500 não se manifeste como 502

2. **Ajustar Timeout do Mercado Pago SDK**: Reduzir timeout de 30s para 25s para garantir margem antes do limite do Next.js (60s)
   - Modificar linha 31 de `mercadoPagoService.ts`: `timeout: 25000`
   - Adicionar comentário explicando a escolha do valor

3. **Melhorar Tratamento de Timeout**: Expandir bloco catch (linhas 139-157) para garantir que todos os casos de timeout retornem 504 ao invés de 502
   - Adicionar verificação específica para timeout do SDK
   - Garantir que rollback seja executado antes de retornar erro
   - Retornar 504 com mensagem clara para o usuário

4. **Adicionar Logging Detalhado**: Expandir logs existentes para incluir informações sobre timeouts e configuração
   - Adicionar timestamp em cada log
   - Incluir duração de cada operação
   - Facilitar diagnóstico de problemas em produção

**File**: `apps/web/src/modules/checkout/hooks/useCheckout.ts`

**Function**: `useCheckout`

**Specific Changes**:
1. **Adicionar Timeout no Fetch**: Configurar AbortSignal com timeout de 60 segundos
   - Criar AbortController antes do fetch (linha 18)
   - Configurar timeout de 60000ms
   - Abortar requisição se timeout for excedido
   - Tratar erro de abort no catch

2. **Melhorar Tratamento de Erro de Timeout**: Adicionar caso específico para timeout no bloco onError (linhas 51-73)
   - Detectar erro de abort/timeout
   - Mostrar mensagem clara ao usuário
   - Sugerir tentar novamente

**File**: `apps/web/.env.production`

**Specific Changes**:
1. **Adicionar Template de Variáveis**: Incluir todas as variáveis necessárias com comentários explicativos
   - Adicionar `NEXT_PUBLIC_APP_URL` com exemplo
   - Adicionar `MERCADOPAGO_ACCESS_TOKEN` com formato esperado
   - Adicionar comentários sobre onde obter cada valor
   - Adicionar instruções de configuração

2. **Adicionar Seção de Mercado Pago**: Criar seção específica para configurações do Mercado Pago
   - Incluir link para documentação
   - Explicar diferença entre sandbox e produção
   - Incluir `MERCADOPAGO_WEBHOOK_SECRET` (para webhooks futuros)

**File**: `apps/web/next.config.js`

**Specific Changes**:
1. **Adicionar Configuração de Timeout**: Configurar timeout apropriado para rotas API
   - Adicionar `experimental.serverActions.bodySizeLimit` se necessário
   - Documentar timeout padrão do Next.js (60s)
   - Adicionar comentário explicando relação com timeout do Mercado Pago

## Testing Strategy

### Validation Approach

A estratégia de teste segue abordagem de duas fases: primeiro, demonstrar o bug no código não corrigido através de testes exploratórios que surfaceiam contraexemplos; depois, verificar que a correção funciona corretamente e preserva comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Surfacear contraexemplos que demonstram o bug ANTES de implementar a correção. Confirmar ou refutar a análise de causa raiz. Se refutarmos, precisaremos re-hipotizar.

**Test Plan**: Escrever testes que simulam cada uma das 5 condições de defeito e verificam que o código não corrigido falha conforme esperado. Executar testes no código UNFIXED para observar falhas e entender a causa raiz.

**Test Cases**:
1. **Missing NEXT_PUBLIC_APP_URL Test**: Remover variável `NEXT_PUBLIC_APP_URL` do ambiente → Fazer requisição de checkout → Verificar que retorna erro 500 "Configuração de URL ausente" (falhará no código unfixed mostrando 502)

2. **Missing MERCADOPAGO_ACCESS_TOKEN Test**: Remover variável `MERCADOPAGO_ACCESS_TOKEN` do ambiente → Fazer requisição de checkout → Verificar que retorna erro 500 "Configuração de pagamento ausente" (falhará no código unfixed mostrando 502)

3. **Mercado Pago Timeout Test**: Mockar Mercado Pago SDK para demorar 35 segundos → Fazer requisição de checkout → Verificar que retorna 504 com mensagem de timeout (falhará no código unfixed retornando 502)

4. **Client Fetch Timeout Test**: Mockar servidor para nunca responder → Fazer requisição do cliente → Verificar que requisição é abortada após 60s (falhará no código unfixed travando indefinidamente)

5. **.env.production Template Test**: Verificar que arquivo `.env.production` contém todas as variáveis necessárias com comentários (falhará no código unfixed mostrando template incompleto)

**Expected Counterexamples**:
- Erro 500 se manifesta como 502 para o usuário quando variáveis estão ausentes
- Timeout do Mercado Pago causa 502 ao invés de 504
- Cliente trava indefinidamente quando servidor não responde
- Arquivo `.env.production` não tem template claro das variáveis necessárias
- Possíveis causas: validação inadequada, timeout mal configurado, ausência de AbortSignal, documentação ausente

### Fix Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug existe, a função corrigida produz o comportamento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := processCheckout_fixed(input)
  ASSERT expectedBehavior(result)
END FOR

FUNCTION expectedBehavior(result)
  RETURN (
    // For missing env vars: return 500 with clear message (not 502)
    (result.status = 500 AND result.error CONTAINS "Configuração") OR
    
    // For timeout: return 504 with clear message (not 502)
    (result.status = 504 AND result.error CONTAINS "timeout") OR
    
    // For client timeout: abort after 60s with clear error
    (result.aborted = true AND result.duration <= 60000) OR
    
    // For .env.production: contains all required variables
    (result.envFile CONTAINS "NEXT_PUBLIC_APP_URL" AND 
     result.envFile CONTAINS "MERCADOPAGO_ACCESS_TOKEN")
  )
END FUNCTION
```

### Preservation Checking

**Goal**: Verificar que para todas as entradas onde a condição de bug NÃO existe, a função corrigida produz o mesmo resultado que a função original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT processCheckout_original(input) = processCheckout_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que comportamento permanece inalterado para todas as entradas não-buggy

**Test Plan**: Observar comportamento no código UNFIXED primeiro para requisições válidas, depois escrever testes property-based capturando esse comportamento.

**Test Cases**:
1. **Valid Checkout Preservation**: Observar que checkout com todas as variáveis configuradas funciona no código unfixed → Escrever teste para verificar que continua funcionando após correção

2. **Validation Error Preservation**: Observar que erros de validação (carrinho vazio, dados inválidos) retornam 400 no código unfixed → Escrever teste para verificar que continua retornando 400 após correção

3. **Authentication Error Preservation**: Observar que requisições não autenticadas retornam 401 no código unfixed → Escrever teste para verificar que continua retornando 401 após correção

4. **Rollback Preservation**: Observar que rollback de pedido funciona quando Mercado Pago falha no código unfixed → Escrever teste para verificar que continua funcionando após correção

5. **Webhook Processing Preservation**: Observar que webhook do Mercado Pago é processado corretamente no código unfixed → Escrever teste para verificar que continua funcionando após correção

### Unit Tests

- Testar validação de variáveis de ambiente com valores ausentes, vazios e válidos
- Testar timeout do Mercado Pago SDK com diferentes tempos de resposta (10s, 25s, 35s)
- Testar AbortSignal do cliente com diferentes cenários (resposta rápida, timeout, abort manual)
- Testar tratamento de erros específicos (timeout, network, API errors)
- Testar rollback de pedido quando Mercado Pago falha
- Testar parsing de mensagens de erro no cliente

### Property-Based Tests

- Gerar requisições aleatórias com variáveis de ambiente válidas e verificar que checkout funciona
- Gerar requisições aleatórias com dados de entrega inválidos e verificar que retorna 400
- Gerar requisições aleatórias com diferentes tempos de resposta do Mercado Pago e verificar tratamento apropriado
- Gerar requisições aleatórias com diferentes estados de autenticação e verificar comportamento correto
- Testar que todas as requisições não-buggy produzem mesmo resultado antes e depois da correção

### Integration Tests

- Testar fluxo completo de checkout em ambiente de teste com todas as variáveis configuradas
- Testar fluxo completo com variáveis ausentes e verificar erro apropriado
- Testar fluxo completo com timeout simulado do Mercado Pago
- Testar fluxo completo com timeout do cliente
- Testar que webhook do Mercado Pago continua funcionando após correção
- Testar que carrinho é invalidado após checkout bem-sucedido
