# Exemplo de Uso do Agent Sync

## Cenário: Agente B Processa Mudanças do Agente A

### Passo 1: Agente B Inicia Sessão

Agente B abre a IDE e automaticamente lê `agent-sync.md` (auto-incluído).

### Passo 2: Agente B Vê Entrada [UNREAD]

```markdown
### [UNREAD] 2026-04-11 01:20 - Correções de Segurança e Performance no Banco de Dados

**Agente**: Kiro (IDE Principal)
**Tipo**: Database Security & Performance Fixes
**Prioridade**: 🔴 CRÍTICA

**Resumo**:
Aplicadas correções críticas de segurança e otimizações de performance no banco de dados Supabase.

**Mudanças Realizadas**:
1. Corrigidas 13 funções com vulnerabilidade de search_path
2. Otimizadas 27 políticas RLS
3. Criadas 11 novas migrations

**Arquivos Criados/Modificados**:
- ✅ supabase/migrations/ - 11 novas migrations
- ✅ supabase/SECURITY_PERFORMANCE_FIXES_2026-04-11.md

**Impacto**:
- Todas as funções do banco agora têm search_path protegido
- Políticas RLS 30-50% mais rápidas

**Ações Necessárias para Outros Agentes**:
1. Se criar novas funções, sempre adicione SET search_path = ''
2. Se criar novas políticas RLS, use (SELECT auth.uid())
3. Não remover índices não utilizados por 30 dias

**Status**: ✅ Completo
```

### Passo 3: Agente B Processa a Informação

**Pensamento do Agente B**:
```
"Entendi. O Agente A fez correções críticas no banco de dados.
Isso afeta meu trabalho porque:
1. Se eu criar funções, preciso adicionar SET search_path = ''
2. Se eu criar políticas RLS, preciso usar (SELECT auth.uid())
3. Não devo remover índices não utilizados

Vou atualizar meu contexto mental e mover esta entrada para [READ]."
```

### Passo 4: Agente B Move para [READ]

Agente B edita `agent-sync.md` e move a entrada:

```markdown
## ✅ Processed Updates

### [READ] 2026-04-11 01:20 - Correções de Segurança e Performance no Banco de Dados

**Processado por**: Agente B (IDE Secundária)
**Data de Leitura**: 2026-04-11 10:30
**Ações Tomadas**: 
- Atualizado contexto sobre funções do banco (search_path obrigatório)
- Atualizado contexto sobre políticas RLS (usar SELECT auth.uid())
- Anotado: não remover índices não utilizados por 30 dias
- Verificado que meu trabalho atual não conflita com essas mudanças
```

### Passo 5: Agente B Faz Seu Próprio Trabalho

Agente B implementa filtros de produtos e adiciona sua própria entrada:

```markdown
## 🔄 Pending Updates

### [UNREAD] 2026-04-11 10:45 - Implementação de Filtros Avançados de Produtos

**Agente**: Agente B (IDE Secundária)
**Tipo**: Feature
**Prioridade**: 🟢 NORMAL

**Resumo**:
Adicionados filtros avançados na página de produtos (categoria, preço, rating, busca)

**Mudanças Realizadas**:
1. Criado componente ProductFilters com UI completa
2. Criado hook useProductFilters para lógica de filtros
3. Integrado com página de produtos existente
4. Adicionado suporte a query params para deep linking

**Arquivos Criados/Modificados**:
- ✅ apps/web/src/components/products/ProductFilters.tsx (novo)
- ✅ apps/web/src/hooks/useProductFilters.ts (novo)
- ✅ apps/web/src/app/products/page.tsx (modificado)
- ✅ apps/web/src/types/filters.ts (novo)

**Impacto**:
- Nenhum breaking change
- Performance: usa índices existentes do banco
- UX: filtros são aplicados em tempo real
- SEO: filtros refletidos em URL para compartilhamento

**Ações Necessárias para Outros Agentes**:
1. Se trabalhar na página de produtos, considere os novos filtros
2. Componente ProductFilters é reutilizável em outras páginas
3. Hook useProductFilters pode ser estendido para outros tipos de filtros

**Ferramentas Usadas**:
- React Hook Form para gerenciamento de estado
- Radix UI para componentes de filtro
- Next.js router para query params

**Status**: ✅ Completo e testado
```

### Passo 6: Agente A Lê Mudanças do Agente B

Mais tarde, Agente A volta e vê a entrada [UNREAD] do Agente B:

```markdown
### [READ] 2026-04-11 10:45 - Implementação de Filtros Avançados de Produtos

**Processado por**: Agente A (IDE Principal)
**Data de Leitura**: 2026-04-11 14:20
**Ações Tomadas**:
- Atualizado contexto: página de produtos agora tem filtros avançados
- Verificado que não há conflitos com meu trabalho em andamento
- Anotado: ProductFilters é reutilizável para outras páginas
- Consideração: posso usar useProductFilters para filtros de pedidos
```

## Resultado Final

✅ **Comunicação Efetiva**: Ambos os agentes sabem o que o outro fez  
✅ **Sem Conflitos**: Mudanças foram coordenadas  
✅ **Contexto Compartilhado**: Ambos têm visão completa do projeto  
✅ **Reutilização**: Agente A pode usar componentes do Agente B  
✅ **Histórico**: Todas as mudanças estão documentadas  

## Fluxo Visual

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
   |                              |                              |
```

## Dicas para Sucesso

1. **Seja Específico**: Quanto mais detalhes, melhor
2. **Seja Oportuno**: Atualize logo após completar trabalho
3. **Seja Considerado**: Marque prioridade corretamente
4. **Seja Claro**: Use formatação e emojis
5. **Seja Completo**: Liste todos os arquivos importantes

## Anti-Padrões

❌ Não pular a leitura de [UNREAD] ao iniciar  
❌ Não fazer entradas vagas como "arrumei umas coisas"  
❌ Não esquecer de marcar como [READ]  
❌ Não deixar [UNREAD] por mais de 24h  
❌ Não deletar entradas - mova para Processed  
