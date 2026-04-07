# Audit Fixes Bugfix Design

## Overview

O projeto atualmente possui 20 problemas de qualidade identificados pelo SDD Audit, resultando em uma nota de 78/100. Este bugfix visa eliminar todos os achados através de refatoração sistemática de tipos TypeScript e correção de práticas de segurança. A abordagem é conservadora: corrigir os problemas sem alterar comportamento funcional existente, garantindo type safety total (zero `any`) e remoção completa de fallbacks inseguros em variáveis de ambiente.

## Glossary

- **Bug_Condition (C)**: A condição que manifesta os problemas de qualidade - uso de `any` no TypeScript ou fallbacks hardcoded em variáveis de ambiente
- **Property (P)**: O comportamento desejado - type safety completo com tipos explícitos e validação segura de variáveis de ambiente
- **Preservation**: Comportamento funcional existente que deve permanecer inalterado - formulários funcionando, checkout calculando corretamente, orders renderizando, analytics enviando eventos
- **Type Safety Violation**: Uso do tipo `any` no TypeScript que compromete a integridade do sistema de tipos
- **Security Issue**: Fallback hardcoded em variável de ambiente que pode expor valores sensíveis
- **ControllerRenderProps**: Tipo específico do react-hook-form para campos de formulário tipados
- **FormValues**: Interface TypeScript que define a estrutura de dados de um formulário

## Bug Details

### Bug Condition

Os problemas de qualidade se manifestam em duas categorias principais:

**Categoria 1: Type Safety Violations (18 ocorrências)**
O código TypeScript utiliza o tipo `any` em múltiplos componentes, comprometendo a integridade do sistema de tipos. Isso ocorre em:
- Componentes de formulário (ForgotPasswordForm, ResetPasswordForm)
- Componentes de checkout e perfil (OrderSummary, AddressForm, AddressManager, OrderCard, OrderHistoryViewer, OrderList)
- Componentes de UI e bibliotecas (Logo, analytics)

**Categoria 2: Security Issues (2 ocorrências)**
Variáveis de ambiente possuem fallbacks hardcoded em arquivos de documentação e scripts, podendo expor valores sensíveis ou comportamentos inesperados.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CodeLine
  OUTPUT: boolean
  
  RETURN (input.contains("any") AND input.isTypeAnnotation)
         OR (input.contains("process.env.") AND input.contains("||") AND input.containsHardcodedFallback)
END FUNCTION
```

### Examples

**Type Safety Violations:**
- `render={({ field }: { field: any }) => (` em ForgotPasswordForm.tsx:69
  - Esperado: `field: ControllerRenderProps<ForgotPasswordFormValues, "email">`
  - Atual: `field: any`

- `items: any[]` em OrderSummary.tsx:7
  - Esperado: `items: CartItem[]` com interface explícita
  - Atual: `items: any[]`

- `order: any` em OrderCard.tsx:23
  - Esperado: `order: Order` com interface completa
  - Atual: `order: any`

- `gtag: (...args: any[]) => void` em analytics.ts:6
  - Esperado: `gtag: (command: string, ...args: unknown[]) => void`
  - Atual: `gtag: (...args: any[]) => void`

**Security Issues:**
- Fallback hardcoded em sdd-audit.md:121
  - Esperado: Documentação com placeholders seguros
  - Atual: Possível exposição de padrão de fallback inseguro

- Fallback hardcoded em sdd-audit-runner.ts:233
  - Esperado: Validação fail-fast ou safe default não sensível
  - Atual: Padrão `process.env.KEY || "fallback"` em comentário/exemplo

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Formulários de autenticação devem continuar funcionando com validação e submissão corretas
- Componentes de perfil devem continuar renderizando pedidos e endereços corretamente
- Componentes de checkout devem continuar calculando totais e processando dados sem erros
- Sistema de analytics deve continuar rastreando eventos e enviando dados para Google Analytics
- Scripts de audit devem continuar gerando relatórios corretamente

**Scope:**
Todas as funcionalidades que NÃO envolvem a estrutura de tipos ou validação de variáveis de ambiente devem ser completamente inalteradas. Isso inclui:
- Lógica de negócio (cálculos, validações de domínio)
- Fluxos de navegação e roteamento
- Estilos e aparência visual
- Integrações com APIs externas
- Comportamento de formulários (validação, submissão, feedback)

## Hypothesized Root Cause

Baseado na análise dos 20 achados, as causas mais prováveis são:

1. **Falta de Tipos Centralizados**: Não existe uma estrutura `/types` centralizada com interfaces compartilhadas para Order, Address, CartItem, etc. Isso leva desenvolvedores a usar `any` por conveniência.

2. **Desconhecimento de react-hook-form Types**: Os desenvolvedores não estão familiarizados com `ControllerRenderProps<TFormValues, TName>`, resultando em uso de `any` para campos de formulário.

3. **Integração com Bibliotecas Externas**: O código de analytics usa `any` porque a tipagem do Google Analytics (gtag) não está clara ou documentada.

4. **Documentação com Exemplos Inseguros**: Os arquivos de referência e scripts contêm exemplos de código com padrões inseguros de fallback que violam as próprias regras de segurança do projeto.

5. **Ausência de Strict Mode**: O tsconfig pode não estar configurado com `strict: true` e `noImplicitAny: true`, permitindo que `any` seja usado sem warnings.

## Correctness Properties

Property 1: Bug Condition - Type Safety Enforcement

_For any_ código TypeScript onde tipos explícitos podem ser definidos, o sistema SHALL utilizar interfaces, types ou generics específicos em vez de `any`, garantindo que o compilador TypeScript detecte erros de tipo em tempo de compilação e forneça autocomplete adequado.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Functional Behavior

_For any_ funcionalidade existente (formulários, checkout, perfil, analytics), o sistema SHALL produzir exatamente o mesmo comportamento funcional após a refatoração de tipos, preservando validação, submissão, renderização, cálculos e rastreamento de eventos.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assumindo que nossa análise de causa raiz está correta:

**Fase 1: Criar Estrutura de Tipos Centralizados**

**Arquivo**: `apps/web/src/types/order.ts`

**Conteúdo**:
```typescript
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  createdAt: string;
  product?: {
    name: string;
    imageUrl: string;
  };
}

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  shippingAddressId: string;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  paymentLink?: string;
}
```

**Arquivo**: `apps/web/src/types/address.ts`

**Conteúdo**:
```typescript
export interface Address {
  id: string;
  userId: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressFormValues {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}
```

**Arquivo**: `apps/web/src/types/cart.ts`

**Conteúdo**:
```typescript
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}
```

**Arquivo**: `apps/web/src/types/form.ts`

**Conteúdo**:
```typescript
export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  code: string;
  password: string;
  confirmPassword: string;
}
```

**Fase 2: Refatorar Componentes de Formulário**

**Arquivo**: `apps/web/src/components/auth/ForgotPasswordForm.tsx`

**Mudanças Específicas**:
1. Importar tipo: `import { ControllerRenderProps } from "react-hook-form"`
2. Importar interface: `import { ForgotPasswordFormValues } from "@/types/form"`
3. Substituir linha 69:
   - De: `render={({ field }: { field: any }) => (`
   - Para: `render={({ field }: { field: ControllerRenderProps<ForgotPasswordFormValues, "email"> }) => (`

**Arquivo**: `apps/web/src/components/auth/ResetPasswordForm.tsx`

**Mudanças Específicas**:
1. Importar tipo: `import { ControllerRenderProps } from "react-hook-form"`
2. Importar interface: `import { ResetPasswordFormValues } from "@/types/form"`
3. Substituir linha 80:
   - De: `} catch (error: any) {`
   - Para: `} catch (error: unknown) {` + type narrowing
4. Substituir linhas 119, 144, 168:
   - De: `render={({ field }: { field: any }) => (`
   - Para: `render={({ field }: { field: ControllerRenderProps<ResetPasswordFormValues, "code" | "password" | "confirmPassword"> }) => (`

**Fase 3: Refatorar Componentes de Domínio (Orders/Address)**

**Arquivo**: `apps/web/src/components/checkout/OrderSummary.tsx`

**Mudanças Específicas**:
1. Importar tipo: `import { CartItem } from "@/types/cart"`
2. Substituir linha 7:
   - De: `items: any[];`
   - Para: `items: CartItem[];`

**Arquivo**: `apps/web/src/components/profile/AddressForm.tsx`

**Mudanças Específicas**:
1. Importar tipos: `import { AddressFormValues } from "@/types/address"`
2. Substituir linha 38:
   - De: `initialData?: any;`
   - Para: `initialData?: AddressFormValues;`

**Arquivo**: `apps/web/src/components/profile/AddressManager.tsx`

**Mudanças Específicas**:
1. Importar tipos: `import { Address, AddressFormValues } from "@/types/address"`
2. Substituir linha 81:
   - De: `data.map((addr: any) => ({`
   - Para: Remover anotação (TypeScript inferirá do tipo de `data`)

**Arquivo**: `apps/web/src/components/profile/OrderCard.tsx`

**Mudanças Específicas**:
1. Importar tipos: `import { Order, OrderItem } from "@/types/order"`
2. Substituir linha 23:
   - De: `order: any;`
   - Para: `order: Order;`
3. Substituir linha 26:
   - De: `const statusConfig: Record<string, { label: string; variant: ... }>`
   - Para: Tipar explicitamente o variant como union type
4. Substituir linha 147:
   - De: `{order.items?.map((item: any, idx: number) => (`
   - Para: `{order.items?.map((item: OrderItem, idx: number) => (`
5. Substituir linha 208:
   - De: `function ShoppingBag(props: any) {`
   - Para: `function ShoppingBag(props: React.SVGProps<SVGSVGElement>) {`

**Arquivo**: `apps/web/src/components/profile/OrderHistoryViewer.tsx`

**Mudanças Específicas**:
1. Importar tipos: `import { Order } from "@/types/order"`
2. Substituir linha 49:
   - De: `const transformedOrders = ordersData.map((order: any) => ({`
   - Para: Remover anotação (inferir do tipo de retorno do Supabase)
3. Substituir linha 59:
   - De: `items: order.order_items?.map((item: any) => ({`
   - Para: Remover anotação (inferir do tipo)
4. Atualizar state: `const [orders, setOrders] = useState<Order[]>([]);`

**Arquivo**: `apps/web/src/components/profile/OrderList.tsx`

**Mudanças Específicas**:
1. Importar tipo: `import { Order } from "@/types/order"`
2. Substituir linha 8:
   - De: `orders: any[];`
   - Para: `orders: Order[];`

**Fase 4: Refatorar UI/Infra**

**Arquivo**: `apps/web/src/components/ui/Logo.tsx`

**Mudanças Específicas**:
1. Substituir linha 19:
   - De: `const motionProps: any = useSharedLayout`
   - Para: Criar tipo específico ou usar `Record<string, unknown>`

**Arquivo**: `apps/web/src/lib/analytics.ts`

**Mudanças Específicas**:
1. Substituir linhas 6-7:
   - De: `gtag: (...args: any[]) => void; dataLayer: any[];`
   - Para: 
   ```typescript
   gtag: (command: string, ...args: unknown[]) => void;
   dataLayer: Array<Record<string, unknown>>;
   ```

**Fase 5: Corrigir Security Issues**

**Arquivo**: `reference/execution/sdd-audit.md`

**Mudanças Específicas**:
1. Localizar linha 121 com fallback hardcoded
2. Substituir exemplo inseguro por:
   ```typescript
   // ❌ ERRADO
   const apiKey = process.env.API_KEY || "default_key"
   
   // ✅ CORRETO (fail-fast)
   if (!process.env.API_KEY) {
     throw new Error("Missing required API_KEY")
   }
   const apiKey = process.env.API_KEY
   
   // ✅ CORRETO (safe default não sensível)
   const isFeatureEnabled = process.env.FEATURE_FLAG === "true"
   ```

**Arquivo**: `scripts/sdd-audit-runner.ts`

**Mudanças Específicas**:
1. Localizar linha 233 com comentário sobre fallback
2. Atualizar comentário para refletir padrão seguro:
   ```typescript
   // 2.3 Dangerous env fallback (only flag if looks like a real secret, not a URL)
   if (line.includes('process.env.') && line.includes('||') && /['"]/.test(line)) {
     // Ignore URL fallbacks and safe boolean defaults which are safe
     if (!line.includes('http://') && !line.includes('https://') && !line.includes('=== "true"')) {
       issues.push({
         severity: 'LOW', category: 'Segurança', file: relPath, line: lineNum,
         message: `Fallback hardcoded em env var (verificar se é segredo)`,
       });
     }
   }
   ```

## Testing Strategy

### Validation Approach

A estratégia de teste segue uma abordagem de duas fases: primeiro, verificar que o código atual funciona corretamente (baseline), depois aplicar as mudanças de tipo e verificar que o comportamento funcional permanece idêntico enquanto os tipos são aplicados corretamente.

### Exploratory Bug Condition Checking

**Goal**: Confirmar que os 20 achados do audit são reais e que o código atual possui os problemas de tipo identificados. Executar o audit ANTES da correção para estabelecer baseline.

**Test Plan**: Executar `npm run audit` no código UNFIXED e verificar que os 20 problemas são detectados. Analisar cada ocorrência para confirmar que é um problema real de type safety ou segurança.

**Test Cases**:
1. **Audit Execution Test**: Executar audit e verificar score de 78/100 (will show 20 issues on unfixed code)
2. **TypeScript Compilation Test**: Executar `tsc --noEmit` e verificar se há warnings sobre `any` (may show issues on unfixed code)
3. **Form Field Type Test**: Inspecionar tipos de `field` em formulários e confirmar que são `any` (will fail on unfixed code)
4. **Order Type Test**: Inspecionar tipos de `order` props e confirmar que são `any` (will fail on unfixed code)

**Expected Counterexamples**:
- Audit detecta 18 ocorrências de `any` em componentes
- Audit detecta 2 ocorrências de fallbacks inseguros em documentação/scripts
- TypeScript não fornece autocomplete adequado em campos tipados como `any`
- Possíveis causas: falta de tipos centralizados, desconhecimento de react-hook-form types, exemplos inseguros em documentação

### Fix Checking

**Goal**: Verificar que para todos os inputs onde a condição de bug existe (uso de `any` ou fallback inseguro), o código corrigido utiliza tipos explícitos e validação segura.

**Pseudocode:**
```
FOR ALL codeLocation WHERE isBugCondition(codeLocation) DO
  result := applyTypeFix(codeLocation)
  ASSERT result.hasExplicitType = true
  ASSERT result.usesAny = false
  ASSERT result.hasSecureFallback = true
END FOR
```

**Test Plan**: Após aplicar as correções, executar audit novamente e verificar que o score aumenta para ≥95 (idealmente 100).

**Test Cases**:
1. **Audit Score Test**: Executar `npm run audit` e verificar score ≥95
2. **TypeScript Strict Test**: Executar `tsc --noEmit --strict` e verificar zero erros
3. **Type Inference Test**: Verificar que autocomplete funciona em todos os componentes refatorados
4. **Security Pattern Test**: Verificar que nenhum fallback inseguro existe em código ou documentação

### Preservation Checking

**Goal**: Verificar que para todas as funcionalidades onde a condição de bug NÃO afeta o comportamento (lógica de negócio, UI, fluxos), o código corrigido produz exatamente o mesmo resultado.

**Pseudocode:**
```
FOR ALL functionality WHERE NOT affectedByTypeFix(functionality) DO
  ASSERT behaviorAfterFix(functionality) = behaviorBeforeFix(functionality)
END FOR
```

**Testing Approach**: Property-based testing é recomendado para preservation checking porque:
- Gera muitos casos de teste automaticamente através do domínio de entrada
- Captura edge cases que testes unitários manuais podem perder
- Fornece garantias fortes de que o comportamento permanece inalterado para todas as entradas não afetadas

**Test Plan**: Observar comportamento no código UNFIXED primeiro para formulários, checkout, perfil e analytics, depois escrever testes de preservação capturando esse comportamento.

**Test Cases**:
1. **Form Submission Preservation**: Observar que formulários submetem corretamente no código unfixed, então verificar que continuam funcionando após fix
2. **Checkout Calculation Preservation**: Observar que cálculos de total funcionam no código unfixed, então verificar que continuam corretos após fix
3. **Order Rendering Preservation**: Observar que pedidos renderizam corretamente no código unfixed, então verificar que continuam renderizando após fix
4. **Analytics Tracking Preservation**: Observar que eventos são rastreados no código unfixed, então verificar que continuam sendo enviados após fix

### Unit Tests

- Testar que tipos de formulário são inferidos corretamente pelo react-hook-form
- Testar que interfaces de Order e Address são compatíveis com dados do Supabase
- Testar que CartItem interface é compatível com dados do carrinho
- Testar que analytics types são compatíveis com gtag API

### Property-Based Tests

- Gerar dados aleatórios de Order e verificar que OrderCard renderiza sem erros
- Gerar dados aleatórios de Address e verificar que AddressForm valida corretamente
- Gerar eventos aleatórios de analytics e verificar que são rastreados corretamente
- Testar que todas as funcionalidades continuam funcionando através de muitos cenários

### Integration Tests

- Testar fluxo completo de autenticação com formulários tipados
- Testar fluxo completo de checkout com tipos de carrinho
- Testar fluxo completo de perfil com tipos de pedidos e endereços
- Testar que audit score melhora após todas as correções
