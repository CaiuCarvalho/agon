# Agent Behavior Rules - Agon E-commerce

## Regras Fundamentais

### 1. SEMPRE Ler Referências Primeiro
Antes de qualquer ação, ler:
- `reference/system.md` - Arquitetura
- `reference/domain.md` - Entidades
- `reference/database.md` - Schema do banco
- `reference/api.md` - Services
- `reference/frontend.md` - Estrutura de componentes
- `reference/features.md` - Features implementadas

### 2. NUNCA Inventar Arquitetura
- Seguir estrutura existente em `apps/web/src/`
- Não criar novos padrões sem consultar referências
- Não adicionar dependências sem justificativa

### 3. SEMPRE Seguir SDD (Spec-Driven Development)
- Toda feature precisa de spec em `.kiro/specs/`
- Spec tem 3 arquivos: `requirements.md`, `design.md`, `tasks.md`
- Implementar apenas o que está na spec
- Não pular etapas

### 4. NUNCA Tomar Decisões Sozinho
- Se algo não está claro → PARAR e perguntar
- Se há múltiplas opções → PARAR e perguntar
- Se falta informação → PARAR e perguntar
- Registrar dúvidas em OPEN QUESTIONS

### 5. SEMPRE Validar com Zod
- Toda entrada de dados usa Zod schemas
- Schemas em `modules/*/contracts.ts`
- Validar no service antes de chamar Supabase

### 6. SEMPRE Usar RLS
- Nunca confiar no frontend
- RLS protege dados no banco
- Testar policies com diferentes usuários

### 7. SEMPRE Manter Services Puros
- Services não conhecem UI (sem toasts, navegação)
- Services retornam dados ou lançam erros
- Hooks orquestram UI e chamam services

### 8. SEMPRE Usar Optimistic UI
- Atualizar UI imediatamente
- Rollback em caso de erro
- Tempo de rollback < 100ms

---

## Fluxo de Trabalho

### Para Nova Feature

1. **Verificar se existe spec**
   - Procurar em `.kiro/specs/[feature-name]/`
   - Se não existe → criar spec primeiro

2. **Ler spec completa**
   - `requirements.md` - O que fazer
   - `design.md` - Como fazer
   - `tasks.md` - Passo a passo

3. **Verificar dependências**
   - Checar `reference/features.md`
   - Garantir que features dependentes estão prontas

4. **Implementar em ordem**
   - Database (migrations)
   - Services (lógica de negócio)
   - Hooks (orquestração)
   - Components (UI)
   - Tests

5. **Testar cada etapa**
   - Aplicar migrations
   - Testar services isoladamente
   - Testar hooks com React Query DevTools
   - Testar UI manualmente

### Para Bugfix

1. **Entender o problema**
   - Reproduzir o bug
   - Identificar causa raiz

2. **Verificar se há spec de bugfix**
   - Procurar em `.kiro/specs/[bugfix-name]/`
   - Se não existe → criar spec de bugfix

3. **Implementar fix**
   - Seguir design da spec
   - Escrever testes de regressão

4. **Validar fix**
   - Testar cenário original
   - Testar cenários relacionados
   - Garantir que não quebrou nada

### Para Refatoração

1. **NUNCA refatorar sem motivo**
   - Só refatorar se há problema real
   - Documentar motivo

2. **Manter comportamento**
   - Refatoração não muda funcionalidade
   - Testes devem continuar passando

3. **Atualizar referências**
   - Se estrutura muda → atualizar `reference/`
   - Manter documentação sincronizada

---

## Padrões de Código

### Estrutura de Module

```
modules/[module-name]/
├── services/           # Lógica de negócio (pura)
├── hooks/             # React hooks (orquestração)
├── components/        # Componentes específicos (opcional)
├── types.ts           # TypeScript types
├── contracts.ts       # Zod schemas (Single Source of Truth)
├── index.ts           # Public API
└── README.md          # Documentação do módulo
```

### Estrutura de Service

```typescript
// services/myService.ts
import { createClient } from '@/lib/supabase/client';
import { mySchema } from '../contracts';

export const myService = {
  async getData(userId: string) {
    // 1. Validar entrada
    const validated = mySchema.parse({ userId });
    
    // 2. Criar client
    const supabase = createClient();
    
    // 3. Query
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('user_id', validated.userId);
    
    // 4. Tratar erro
    if (error) throw error;
    
    // 5. Transformar e retornar
    return data.map(transformRow);
  },
};
```

### Estrutura de Hook

```typescript
// hooks/useMyData.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myService } from '../services/myService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useMyData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-data', user?.id],
    queryFn: () => myService.getData(user!.id),
    enabled: !!user,
  });
}

export function useMyMutations() {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: myService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-data']);
      toast.success('Criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar');
      console.error(error);
    },
  });
  
  return { create };
}
```

### Estrutura de Component

```typescript
// components/MyComponent.tsx
'use client';

import { useMyData, useMyMutations } from '@/modules/my-module';

export function MyComponent() {
  const { data, isLoading } = useMyData();
  const { create } = useMyMutations();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {data?.map(item => (
        <Item key={item.id} {...item} />
      ))}
      <button onClick={() => create.mutate(newData)}>
        Criar
      </button>
    </div>
  );
}
```

---

## Checklist Antes de Implementar

- [ ] Li todas as referências relevantes
- [ ] Entendi a arquitetura existente
- [ ] Verifiquei se existe spec
- [ ] Li spec completa (requirements, design, tasks)
- [ ] Verifiquei dependências
- [ ] Entendi o fluxo de dados
- [ ] Sei onde cada arquivo vai
- [ ] Sei quais services criar
- [ ] Sei quais hooks criar
- [ ] Sei quais componentes criar
- [ ] Sei quais migrations aplicar
- [ ] Tenho plano de testes

---

## Checklist Antes de Commitar

- [ ] Código segue padrões existentes
- [ ] Services são puros (sem UI)
- [ ] Hooks orquestram corretamente
- [ ] Componentes são "burros"
- [ ] Validação Zod implementada
- [ ] RLS policies aplicadas
- [ ] Optimistic UI funciona
- [ ] Rollback funciona
- [ ] Testes escritos (se aplicável)
- [ ] Documentação atualizada (se estrutura mudou)

---

## O Que NUNCA Fazer

### ❌ Código sem Spec
```typescript
// ERRADO: Implementar direto sem spec
export function NewFeature() {
  // código...
}
```

```typescript
// CERTO: Criar spec primeiro, depois implementar
// 1. Criar .kiro/specs/new-feature/requirements.md
// 2. Criar .kiro/specs/new-feature/design.md
// 3. Criar .kiro/specs/new-feature/tasks.md
// 4. Implementar seguindo tasks
```

### ❌ Service com UI
```typescript
// ERRADO: Service conhece toast
export const myService = {
  async create(data) {
    const result = await supabase.from('table').insert(data);
    toast.success('Criado!'); // ❌ Service não deve conhecer UI
    return result;
  }
};
```

```typescript
// CERTO: Hook gerencia UI
export function useMyMutations() {
  const create = useMutation({
    mutationFn: myService.create,
    onSuccess: () => {
      toast.success('Criado!'); // ✅ Hook gerencia UI
    },
  });
  return { create };
}
```

### ❌ Sem Validação
```typescript
// ERRADO: Confiar no frontend
const { data } = await supabase
  .from('table')
  .insert(userInput); // ❌ Sem validação
```

```typescript
// CERTO: Validar com Zod
const validated = mySchema.parse(userInput); // ✅ Validação
const { data } = await supabase
  .from('table')
  .insert(validated);
```

### ❌ Sem RLS
```typescript
// ERRADO: Query sem filtro de usuário
const { data } = await supabase
  .from('cart_items')
  .select('*'); // ❌ Retorna dados de todos os usuários
```

```typescript
// CERTO: RLS filtra automaticamente
const { data } = await supabase
  .from('cart_items')
  .select('*'); // ✅ RLS filtra por user_id
```

---

## Quando Parar e Perguntar

### Situações que exigem parada:

1. **Arquitetura não está clara**
   - "Onde esse arquivo deve ir?"
   - "Qual padrão seguir?"

2. **Múltiplas opções válidas**
   - "Usar Context ou React Query?"
   - "Server ou Client Component?"

3. **Falta informação**
   - "Como funciona essa integração?"
   - "Qual é o fluxo esperado?"

4. **Conflito com referências**
   - "Referência diz X mas código faz Y"
   - "Qual está correto?"

5. **Decisão de negócio**
   - "Qual comportamento esperado?"
   - "Como tratar esse edge case?"

### Como registrar dúvidas:

```markdown
## OPEN QUESTIONS

1. **Onde criar o novo service?**
   - Opção A: `modules/checkout/services/`
   - Opção B: `lib/api/`
   - Recomendação: ?

2. **Como validar estoque?**
   - No service ou no RPC?
   - Quando exatamente?

3. **Qual formato de endereço?**
   - Brasileiro completo?
   - Simplificado para MVP?
```

---

## Resumo

**SEMPRE**:
- Ler referências primeiro
- Seguir SDD
- Validar com Zod
- Usar RLS
- Services puros
- Optimistic UI

**NUNCA**:
- Inventar arquitetura
- Código sem spec
- Service com UI
- Sem validação
- Sem RLS
- Decisões sozinho

**QUANDO EM DÚVIDA**:
- PARAR
- Registrar em OPEN QUESTIONS
- Perguntar ao usuário
