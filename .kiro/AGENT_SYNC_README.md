# 🤝 Sistema de Sincronização Entre Agentes

## Visão Geral

Este sistema permite que múltiplos agentes Kiro trabalhando no mesmo projeto (em IDEs diferentes) se comuniquem e sincronizem mudanças em tempo real.

## 📁 Arquivos do Sistema

### 1. `.kiro/steering/agent-sync.md` (Auto-incluído)
**Propósito**: Quadro de avisos compartilhado entre agentes  
**Inclusão**: Automática (steering com `inclusion: auto`)  
**Função**: Contém lista de mudanças pendentes e processadas

### 2. `.kiro/skills/agent-sync-protocol.md` (Manual)
**Propósito**: Guia de como usar o sistema  
**Inclusão**: Manual (quando necessário)  
**Função**: Instruções detalhadas e exemplos

## 🔄 Fluxo de Trabalho

### Agente A (Faz Mudanças)
```
1. Trabalha no código
2. Completa mudanças significativas
3. Adiciona entrada [UNREAD] em agent-sync.md
4. Continua trabalhando
```

### Agente B (Lê Mudanças)
```
1. Inicia sessão
2. Lê automaticamente agent-sync.md (auto-incluído)
3. Vê entradas [UNREAD]
4. Atualiza contexto mental
5. Move entradas para [READ]
6. Adiciona suas próprias mudanças como [UNREAD]
```

## 📝 Formato de Entrada

```markdown
### [UNREAD] 2026-04-11 01:20 - Título Descritivo

**Agente**: Nome do Agente
**Tipo**: Feature | Bugfix | Refactor | Database | Config
**Prioridade**: 🔴 CRÍTICA | 🟡 IMPORTANTE | 🟢 NORMAL

**Resumo**:
Descrição breve do que foi feito

**Mudanças Realizadas**:
1. Mudança específica 1
2. Mudança específica 2

**Arquivos Criados/Modificados**:
- ✅ arquivo/criado.ts
- ✅ arquivo/modificado.ts
- ❌ arquivo/deletado.ts

**Impacto**:
- Impacto no sistema
- Breaking changes (se houver)

**Ações Necessárias para Outros Agentes**:
1. Ação que outros agentes devem tomar
2. Considerações importantes

**Status**: ✅ Completo | ⏳ Em Progresso | ⚠️ Requer Atenção
```

## 🎯 Quando Usar

### ✅ Use Para:
- Mudanças em banco de dados (migrations, funções, políticas)
- Refatorações que afetam múltiplos arquivos
- Novas features que outros agentes devem conhecer
- Mudanças em configuração ou estrutura do projeto
- Correções de bugs críticos
- Mudanças em APIs ou contratos

### ❌ Não Use Para:
- Typos ou correções triviais
- Mudanças puramente estéticas
- Commits de trabalho em progresso
- Mudanças em arquivos de teste isolados

## 🚀 Exemplo Prático

### Cenário: Dois Agentes Trabalhando

**Agente A** (IDE Principal) - 10:00:
- Corrige vulnerabilidades de segurança no banco
- Adiciona entrada [UNREAD] em agent-sync.md
- Continua trabalhando em outras features

**Agente B** (IDE Secundária) - 10:30:
- Inicia sessão
- Lê automaticamente agent-sync.md
- Vê entrada [UNREAD] sobre correções de segurança
- Atualiza contexto: "Funções do banco agora têm search_path"
- Move entrada para [READ]
- Começa a trabalhar em filtros de produtos
- Usa as funções atualizadas do banco
- Adiciona sua própria entrada [UNREAD] sobre filtros

**Agente A** - 11:00:
- Lê entrada [UNREAD] sobre filtros de produtos
- Atualiza contexto: "Página de produtos agora tem filtros"
- Move entrada para [READ]
- Continua seu trabalho

## 🛡️ Prevenção de Conflitos

### Detecção Automática
O arquivo `agent-sync.md` é auto-incluído, então:
- Agentes sempre veem mudanças recentes
- Conflitos são detectados antes de acontecer
- Comunicação é em tempo real

### Resolução de Conflitos
Se dois agentes modificam o mesmo arquivo:
1. Agente que detecta o conflito adiciona ⚠️ WARNING
2. Descreve o conflito claramente
3. Sugere resolução
4. Outro agente lê e resolve

## 📊 Manutenção

### Limpeza Periódica
A cada 7 dias, mova entradas antigas de "Processed Updates" para um arquivo de histórico:

```bash
# Criar arquivo de histórico mensal
.kiro/steering/agent-sync-history-2026-04.md
```

### Estrutura de Histórico
```markdown
# Agent Sync History - Abril 2026

## Semana 1 (01-07 Abril)
[Entradas processadas da semana]

## Semana 2 (08-14 Abril)
[Entradas processadas da semana]
```

## 🔧 Configuração Inicial

### Para Novo Agente
1. Leia `.kiro/AGENT_SYNC_README.md` (este arquivo)
2. Leia `.kiro/skills/agent-sync-protocol.md` para detalhes
3. Verifique `.kiro/steering/agent-sync.md` para mudanças recentes
4. Processe todas as entradas [UNREAD]
5. Comece a trabalhar

### Para Projeto Existente
Os arquivos já estão configurados e funcionando. Apenas:
1. Leia entradas [UNREAD] ao iniciar
2. Adicione suas mudanças como [UNREAD]
3. Mova entradas lidas para [READ]

## 📈 Benefícios

✅ **Comunicação em Tempo Real**: Agentes sabem o que outros estão fazendo  
✅ **Prevenção de Conflitos**: Detecta problemas antes de acontecer  
✅ **Contexto Compartilhado**: Todos os agentes têm visão completa  
✅ **Histórico Rastreável**: Todas as mudanças são documentadas  
✅ **Automático**: Steering auto-incluído, sem ação manual necessária  

## 🎓 Treinamento

### Para Novos Agentes
1. Leia este README
2. Leia a skill `agent-sync-protocol.md`
3. Veja exemplos em `agent-sync.md`
4. Pratique adicionando uma entrada de teste
5. Pratique processando uma entrada

### Para Usuários
Você não precisa fazer nada! Os agentes gerenciam tudo automaticamente.

## 🐛 Troubleshooting

### Problema: Agente não vê mudanças
**Solução**: Verifique se `agent-sync.md` tem `inclusion: auto` no frontmatter

### Problema: Muitas entradas [UNREAD]
**Solução**: Processe todas de uma vez, depois faça limpeza periódica

### Problema: Conflito não detectado
**Solução**: Sempre leia agent-sync.md antes de começar trabalho significativo

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte `.kiro/skills/agent-sync-protocol.md`
2. Veja exemplos em `.kiro/steering/agent-sync.md`
3. Pergunte ao usuário se necessário

---

**Criado em**: 2026-04-11  
**Versão**: 1.0  
**Status**: ✅ Ativo e Funcionando
