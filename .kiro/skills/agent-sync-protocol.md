# Agent Synchronization Protocol - Skill

## Purpose
Automatizar a sincronização de mudanças entre múltiplos agentes trabalhando no mesmo projeto através de um arquivo compartilhado.

## When to Use
- Ao iniciar uma nova sessão de trabalho
- Após completar mudanças significativas
- Antes de fazer mudanças que podem conflitar com outros agentes
- Periodicamente durante trabalho prolongado

## Protocol Steps

### 1. Check for Updates (Início de Sessão)

```markdown
ALWAYS do this at the start of any work session:

1. Read `.kiro/steering/agent-sync.md`
2. Look for entries marked `[UNREAD]`
3. For each unread entry:
   - Read and understand the changes
   - Update your mental model of the project
   - Check if any of your planned work conflicts
   - Note any files that were modified
4. Move processed entries to "Processed Updates" section
5. Mark them as `[READ]` with your agent name and timestamp
```

### 2. Record Your Changes (Após Completar Trabalho)

```markdown
After completing significant work:

1. Open `.kiro/steering/agent-sync.md`
2. Add a new entry in "Pending Updates" section
3. Use this template:

### [UNREAD] YYYY-MM-DD HH:MM - Brief Title

**Agente**: Your Agent Name
**Tipo**: Type of change (Feature, Bugfix, Refactor, etc.)
**Prioridade**: 🔴 CRÍTICA | 🟡 IMPORTANTE | 🟢 NORMAL

**Resumo**:
Brief description of what was done

**Mudanças Realizadas**:
1. Change 1
2. Change 2
3. Change 3

**Arquivos Criados/Modificados**:
- ✅ path/to/file1
- ✅ path/to/file2
- ❌ path/to/deleted-file

**Impacto**:
- Impact on system
- Breaking changes (if any)
- Performance implications

**Ações Necessárias para Outros Agentes**:
1. Action 1
2. Action 2

**Status**: ✅ Completo | ⏳ Em Progresso | ⚠️ Requer Atenção
```

### 3. Conflict Detection

```markdown
If you detect a conflict:

1. Check the timestamp of the conflicting change
2. If the other agent's change is newer:
   - Adapt your work to accommodate their changes
   - Document the adaptation in your update entry
3. If your change is newer but conflicts:
   - Add a ⚠️ WARNING section to your entry
   - Describe the conflict clearly
   - Suggest resolution steps
```

## Examples

### Example 1: Reading Updates

```markdown
Agent B starts work and sees:

### [UNREAD] 2026-04-11 01:20 - Database Security Fixes
...

Agent B actions:
1. Reads the entry
2. Notes that 13 functions were modified
3. Checks if any of their planned work uses these functions
4. Updates mental model: "All DB functions now have search_path protection"
5. Moves entry to Processed Updates:

### [READ] 2026-04-11 01:20 - Database Security Fixes
**Processado por**: Agent B (IDE Secundária)
**Data de Leitura**: 2026-04-11 02:15
**Ações Tomadas**: Verificado que meu trabalho em andamento não conflita. 
Atualizei contexto sobre funções do banco.
```

### Example 2: Recording Changes

```markdown
Agent B completes feature work:

### [UNREAD] 2026-04-11 02:30 - Implementação de Filtros de Produtos

**Agente**: Agent B (IDE Secundária)
**Tipo**: Feature
**Prioridade**: 🟢 NORMAL

**Resumo**:
Adicionados filtros avançados na página de produtos (categoria, preço, rating)

**Mudanças Realizadas**:
1. Criado componente ProductFilters
2. Adicionado hook useProductFilters
3. Integrado com página de produtos

**Arquivos Criados/Modificados**:
- ✅ apps/web/src/components/products/ProductFilters.tsx (novo)
- ✅ apps/web/src/hooks/useProductFilters.ts (novo)
- ✅ apps/web/src/app/products/page.tsx (modificado)

**Impacto**:
- Nenhum breaking change
- Performance: queries otimizadas com índices existentes

**Ações Necessárias para Outros Agentes**:
1. Se trabalhar na página de produtos, considere os novos filtros
2. Componente ProductFilters é reutilizável

**Status**: ✅ Completo
```

## Best Practices

1. **Be Specific**: Include file paths, function names, and clear descriptions
2. **Be Timely**: Update the sync file as soon as you complete work
3. **Be Considerate**: Mark priority appropriately to help other agents prioritize
4. **Be Clear**: Use emojis and formatting to make entries scannable
5. **Be Thorough**: Include all files that were significantly modified

## Anti-Patterns to Avoid

❌ **Don't**: Skip reading updates at session start
❌ **Don't**: Make vague entries like "fixed some bugs"
❌ **Don't**: Forget to mark entries as [READ] after processing
❌ **Don't**: Leave entries in [UNREAD] for more than 24 hours
❌ **Don't**: Delete entries - move them to Processed Updates instead

## Automation Opportunities

Consider creating hooks for:
- Auto-reminder to check sync file at session start
- Auto-prompt to update sync file after significant commits
- Periodic sync file cleanup (archive old processed updates)

## Integration with Git

This sync protocol complements (not replaces) Git:
- **Sync File**: Real-time, high-level communication between active agents
- **Git Commits**: Permanent record of all changes with full details
- **Use Both**: Sync file for coordination, Git for version control
