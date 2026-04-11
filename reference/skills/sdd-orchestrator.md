# Skill: SDD Orchestrator

## Objetivo
Executar qualquer tarefa de produto/engenharia seguindo Spec-Driven Development sem desvios.

## Entradas obrigatórias
- Objetivo da tarefa.
- Spec em `.kiro/specs/<feature>/` com `requirements.md`, `design.md`, `tasks.md`.
- Referências principais: `reference/system.md`, `reference/domain.md`, `reference/agent.md`.

## GATES (não pule)
1. Gate de Contexto:
- Ler referências principais e resumir entendimento em 5-10 linhas.
2. Gate de Spec:
- Confirmar que os 3 arquivos da spec existem e estão coerentes.
3. Gate de Implementação:
- Implementar somente itens presentes em `tasks.md`.
4. Gate de Verificação:
- Validar comportamento + testes + TypeScript sem erro.
5. Gate de Handoff:
- Atualizar Notion com status, pendências e próxima ação.

## Algoritmo de execução
1. Identificar escopo exato da tarefa.
2. Mapear arquivos que serão alterados antes de codar.
3. Implementar em blocos pequenos e verificáveis.
4. Rodar validações locais relevantes.
5. Registrar resultado e próximos passos.

## Critérios de saída
- Implementação aderente à spec.
- Sem mudança fora do escopo.
- Estado operacional atualizado no Notion.

## Falhas críticas
- Iniciar código sem spec.
- Introduzir arquitetura não documentada.
- Finalizar sessão sem handoff.
