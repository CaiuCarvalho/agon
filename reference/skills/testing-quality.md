# Skill: Testing & Quality Gate

## Objetivo
Garantir qualidade mínima obrigatória antes de considerar uma tarefa concluída.

## Estratégia de testes
- Unitário: funções puras, validações e transformações.
- Integração: service + contrato + acesso a dados.
- Regressão: cenário que reproduzia bug deve virar teste.
- Manual crítico: checkout, auth, admin e fluxos de pagamento.

## Matriz mínima por tipo de tarefa
- Nova feature:
  - testes do caminho feliz;
  - ao menos 1 edge case;
  - validação de erro relevante.
- Bugfix:
  - teste que falhava antes e passa após fix;
  - cobertura de cenário adjacente para evitar recaída.
- Refactor:
  - preservar comportamento com testes existentes + spot checks.

## Quality Gate (obrigatório)
- [ ] Aceite da spec atendido.
- [ ] Testes relevantes executados.
- [ ] Sem erro de TypeScript nas áreas alteradas.
- [ ] Sem regressão evidente no fluxo crítico.
- [ ] Handoff documenta o que foi testado.

## Evidências esperadas no handoff
- Comandos rodados.
- Resultado resumido.
- Riscos residuais.
