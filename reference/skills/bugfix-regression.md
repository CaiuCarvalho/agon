# Skill: Bugfix & Regressão Controlada

## Objetivo
Corrigir defeitos com rastreabilidade e baixa chance de regressão.

## Protocolo
1. Reproduzir bug e registrar cenário.
2. Confirmar spec/bugfix spec correspondente.
3. Identificar causa raiz (não tratar só sintoma).
4. Implementar correção mínima necessária.
5. Criar teste de regressão.
6. Validar impacto lateral no fluxo relacionado.
7. Atualizar documentação/handoff.

## Checklist obrigatório
- [ ] Causa raiz documentada.
- [ ] Fix não altera comportamento fora do escopo.
- [ ] Teste de regressão criado/atualizado.
- [ ] Cenário original validado manualmente (se aplicável).
- [ ] Próxima ação registrada no Notion.

## Sinais de alerta
- Fix exige mudanças amplas sem spec revisada.
- Não é possível reproduzir bug com consistência.
- Dúvida sobre regra de negócio não documentada.

Nesses casos: pausar e abrir `OPEN QUESTIONS`.
