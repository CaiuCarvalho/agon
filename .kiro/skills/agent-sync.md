---
name: Agent Synchronization Protocol
description: Sistema de sincronização de mudanças entre múltiplos agentes trabalhando no mesmo projeto
version: 1.0.0
---

# Agent Synchronization Protocol

Este skill implementa um protocolo de sincronização entre múltiplos agentes (Kiro, Codex, etc.) trabalhando no mesmo projeto.

## 📋 Objetivo

Permitir que múltiplos agentes trabalhem no mesmo projeto de forma coordenada, compartilhando informações sobre mudanças realizadas e evitando conflitos.

## 🎯 Quando Usar

- **Sempre ao iniciar uma sessão**: Ler entradas [UNREAD] do agent-sync.md
- **Após completar trabalho significativo**: Adicionar entrada [UNREAD] documentando mudanças
- **Antes de finalizar sessão**: Garantir que todas as mudanças importantes foram documentadas

## 📂 Arquivo Central

**Localização**: `.kiro/steering/agent-sync.md`

Este arquivo é **auto-incluído** (inclusion: auto) e contém:
- **Pending Updates**: Entradas [UNREAD] aguardando processamento
- **Processed Updates**: Entradas [READ] já processadas

## 🔄 Workflow do Agente

### 1. Ao Iniciar Sessão

```markdown
1. Ler `.kiro/steering/agent-sync.md`
2. Identificar todas as entradas marcadas como [UNREAD]
3. Para cada entrada [UNREAD]:
   - Ler e compreender as mudanças
   - Atualizar contexto mental sobre o projeto
   - Mover para seção "Processed Updates"
   - Marcar como [READ]
   - Adicionar "Processado por" e "Data de Leitura"
   - Documentar "Ações Tomadas"
```

### 2. Durante o Trabalho

```markdown
- Manter registro mental das mudanças significativas
- Identificar mudanças que outros agentes precisam saber
```

### 3. Ao Completar Trabalho Significativo

```markdown
1. Adicionar entrada [UNREAD] na seção "Pending Updates"
2. Incluir:
   - Timestamp (YYYY-MM-DD HH:MM)
   - Título descritivo
   - Agente responsável
   - Tipo de mudança
   - Prioridade (🔴 CRÍTICA, 🟡 ALTA, 🟢 NORMAL)
   - Resumo das mudanças
   - Arquivos modificados
   - Impacto
   - Ações necessárias para outros agentes
   - Status
```

## 📝 Formato de Entrada [UNREAD]

```markdown
### [UNREAD] YYYY-MM-DD HH:MM - Título Descritivo

**Agente**: Nome do Agente (IDE/CLI)
**Tipo**: Feature | Bugfix | Enhancement | Documentation | Migration
**Prioridade**: 🔴 CRÍTICA | 🟡 ALTA | 🟢 NORMAL

**Resumo**:
Breve descrição do que foi feito (1-2 parágrafos)

**Mudanças Realizadas**:
1. Mudança 1
2. Mudança 2
3. Mudança 3

**Arquivos Modificados**:
- ✅ `caminho/arquivo1.ts` - Descrição da mudança
- ✅ `caminho/arquivo2.tsx` - Descrição da mudança
- ✅ `caminho/migration.sql` - Nova migration criada

**Impacto**:
- ✅ Impacto positivo 1
- ✅ Impacto positivo 2
- ⚠️ Atenção necessária (se houver)

**Ações Necessárias para Outros Agentes**:
1. Ação 1 (se houver)
2. Ação 2 (se houver)

**Ações Necessárias para o Usuário**:
1. Aplicar migration no Supabase
2. Reiniciar servidor
3. Verificar funcionalidade X

**Status**: ✅ Completo | ⏳ Em Progresso | ⚠️ Requer Atenção
```

## 📝 Formato de Entrada [READ]

```markdown
### [READ] YYYY-MM-DD HH:MM - Título Descritivo

**Processado por**: Nome do Agente
**Data de Leitura**: YYYY-MM-DD HH:MM
**Agente Original**: Nome do Agente Original

**Ações Tomadas**:
- ✅ Ação 1 realizada após ler
- ✅ Ação 2 realizada após ler
- ✅ Contexto atualizado sobre X

**Observações**:
- Observação relevante 1
- Observação relevante 2
```

## 🎯 Tipos de Mudanças

### Feature
Nova funcionalidade ou capacidade adicionada ao sistema.

**Exemplo**: Implementação de filtros avançados de produtos

### Bugfix
Correção de bug ou comportamento incorreto.

**Exemplo**: Correção de navegação do painel admin

### Enhancement
Melhoria de funcionalidade existente.

**Exemplo**: Otimização de performance de queries

### Documentation
Criação ou atualização de documentação.

**Exemplo**: Guia de deploy atualizado

### Migration
Mudanças no banco de dados (schema, políticas RLS, etc.).

**Exemplo**: Adição de políticas RLS para admin

## 🚨 Prioridades

### 🔴 CRÍTICA
- Quebra funcionalidade existente
- Requer ação imediata do usuário
- Afeta segurança ou dados

**Exemplo**: Políticas RLS que bloqueiam acesso admin

### 🟡 ALTA
- Mudança significativa na arquitetura
- Requer atenção de outros agentes
- Pode causar conflitos se ignorado

**Exemplo**: Refatoração de módulo compartilhado

### 🟢 NORMAL
- Mudança isolada
- Não afeta outros componentes
- Informativo

**Exemplo**: Adição de novos produtos ao seed

## 📊 Exemplos Práticos

### Exemplo 1: Feature Completa

```markdown
### [UNREAD] 2026-04-11 05:30 - Frete Grátis Atualizado para R$ 200

**Agente**: Kiro (Sessão Continuada)
**Tipo**: Feature Enhancement
**Prioridade**: 🟢 NORMAL

**Resumo**:
Atualizado valor mínimo para frete grátis de R$ 150 para R$ 200 e implementado indicador visual de progresso no carrinho.

**Mudanças Realizadas**:
1. Homepage - Texto atualizado para "Frete Grátis acima de R$ 200"
2. Carrinho - Adicionado indicador visual de progresso
3. Checkout - Threshold atualizado para R$ 200

**Arquivos Modificados**:
- ✅ `apps/web/src/app/HomeClient.tsx` - Linha 45
- ✅ `apps/web/src/app/cart/page.tsx` - Linhas 180-210
- ✅ `apps/web/src/components/checkout/OrderSummary.tsx` - Linhas 27-28, 72

**Impacto**:
- ✅ Valor de frete grátis alinhado com estratégia de negócio
- ✅ Gamificação incentiva adicionar mais produtos
- ✅ Experiência de usuário melhorada

**Ações Necessárias para o Usuário**:
1. Reiniciar servidor: `npm run dev`
2. Verificar carrinho com diferentes valores

**Status**: ✅ Completo
```

### Exemplo 2: Bugfix Crítico

```markdown
### [UNREAD] 2026-04-11 06:00 - Correção: Admin Vê Todos os Pedidos

**Agente**: Kiro (Sessão Continuada)
**Tipo**: Critical Bugfix
**Prioridade**: 🔴 CRÍTICA

**Resumo**:
Corrigido problema crítico onde admin via apenas seus próprios pedidos ao invés de todos os pedidos do sistema.

**Mudanças Realizadas**:
1. Adicionadas políticas RLS para admin ver TODOS os pedidos
2. Corrigida navegação do painel admin (Link ao invés de <a>)

**Arquivos Modificados**:
- ✅ `apps/web/src/app/admin/layout.tsx` - Navegação corrigida
- ✅ `supabase/migrations/20260411060000_add_admin_select_orders_policy.sql` - Nova migration

**Impacto**:
- ✅ Admin agora vê TODOS os pedidos do sistema
- ✅ Navegação do admin funciona sem reload
- ⚠️ Requer aplicação de migration no Supabase

**Ações Necessárias para o Usuário**:
1. **CRÍTICO**: Aplicar migration no Supabase Dashboard
2. Reiniciar servidor
3. Verificar que admin vê todos os pedidos

**Status**: ✅ Código completo - Aguardando aplicação da migration
```

### Exemplo 3: Processamento de Entrada

```markdown
### [READ] 2026-04-11 06:00 - Correção: Admin Vê Todos os Pedidos

**Processado por**: Próximo Agente (IDE)
**Data de Leitura**: 2026-04-11 08:00
**Agente Original**: Kiro (Sessão Continuada)

**Ações Tomadas**:
- ✅ Verificado que migration foi aplicada no Supabase
- ✅ Confirmado que admin vê todos os pedidos
- ✅ Atualizado contexto sobre políticas RLS
- ✅ Reconhecido que navegação do admin usa Link do Next.js

**Observações**:
- Migration aplicada com sucesso
- Todos os testes passando
- Funcionalidade validada em produção
```

## 🔍 Checklist do Agente

### Ao Iniciar Sessão
- [ ] Ler `.kiro/steering/agent-sync.md`
- [ ] Identificar entradas [UNREAD]
- [ ] Processar cada entrada [UNREAD]
- [ ] Mover para [READ] com documentação
- [ ] Atualizar contexto mental

### Durante o Trabalho
- [ ] Identificar mudanças significativas
- [ ] Manter registro mental para documentar

### Ao Finalizar Trabalho
- [ ] Adicionar entrada [UNREAD] para mudanças significativas
- [ ] Incluir todos os detalhes necessários
- [ ] Marcar prioridade corretamente
- [ ] Listar ações necessárias

## 🚫 Anti-Padrões

❌ **Não fazer**:
- Pular leitura de [UNREAD] ao iniciar
- Criar entradas vagas ("arrumei umas coisas")
- Esquecer de marcar como [READ]
- Deixar [UNREAD] por mais de 24h sem processar
- Deletar entradas antigas (mover para Processed)
- Documentar mudanças triviais (typos, formatação)

✅ **Fazer**:
- Ler TODAS as entradas [UNREAD] ao iniciar
- Criar entradas detalhadas e específicas
- Marcar como [READ] após processar
- Processar [UNREAD] o mais rápido possível
- Manter histórico em Processed Updates
- Documentar apenas mudanças significativas

## 📚 Referências

- **Arquivo Principal**: `.kiro/steering/agent-sync.md`
- **Documentação Completa**: `.kiro/AGENT_SYNC_README.md`
- **Exemplo de Uso**: `.kiro/steering/agent-sync-example.md`

## 🎓 Dicas para Sucesso

1. **Seja Específico**: Quanto mais detalhes, melhor
2. **Seja Oportuno**: Atualize logo após completar trabalho
3. **Seja Considerado**: Marque prioridade corretamente
4. **Seja Claro**: Use formatação e emojis para facilitar leitura
5. **Seja Completo**: Liste todos os arquivos importantes

## 🤝 Benefícios

- ✅ Coordenação entre múltiplos agentes
- ✅ Evita conflitos e retrabalho
- ✅ Histórico completo de mudanças
- ✅ Contexto compartilhado
- ✅ Comunicação assíncrona efetiva
- ✅ Reutilização de conhecimento

## 🔄 Fluxo Visual

```
Agente A                    agent-sync.md                    Agente B
   |                              |                              |
   |--[1] Faz mudanças----------->|                              |
   |                              |                              |
   |--[2] Adiciona [UNREAD]------>|                              |
   |                              |                              |
   |                              |<----[3] Lê automaticamente---|
   |                              |                              |
   |                              |<----[4] Move para [READ]-----|
   |                              |                              |
   |                              |<----[5] Adiciona [UNREAD]----|
   |                              |                              |
   |<---[6] Lê automaticamente----|                              |
   |                              |                              |
   |----[7] Move para [READ]----->|                              |
```

## 🎯 Resultado Esperado

Após implementar este protocolo:

✅ Múltiplos agentes trabalham de forma coordenada  
✅ Mudanças são comunicadas efetivamente  
✅ Conflitos são evitados  
✅ Contexto é compartilhado  
✅ Histórico é mantido  
✅ Produtividade aumenta  

---

**Versão**: 1.0.0  
**Última Atualização**: 2026-04-11  
**Autor**: Sistema de Sincronização Multi-Agente
