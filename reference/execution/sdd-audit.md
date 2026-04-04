# Auditoria de Aderência SDD (Spec-Driven Development)

## 1. PROPÓSITO

Este documento serve como a autoridade definitiva para auditoria de qualidade e integridade do projeto Agon. Seu objetivo é garantir que:
- O desenvolvimento siga estritamente o fluxo **Referência -> Spec -> Código**.
- A arquitetura modular e desacoplada não seja corrompida por "hacks" ou pressa.
- Exista consistência total entre o que foi prometido na documentação e o que foi implementado no código.

---

## 2. FLUXO DE AUDITORIA

Todo agente ou revisor deve seguir estes passos sequencialmente:

1. **Imersão na Referência**: Ler todos os arquivos em `/reference` para entender os princípios de produto, arquitetura e engenharia.
2. **Mapeamento de Padrões**: Identificar quais padrões (ex: Services puros, Mocks com latência) são exigidos.
3. **Varredura de Implementação**: Analisar o código em `/apps` e `/packages`.
4. **Confronto de Dados**: Comparar a implementação real com as especificações.
5. **Relatório de Divergências**: Listar onde o código se desviou da especificação ou referência.
6. **Classificação de Severidade**:
   - 🔴 **CRÍTICO**: Viola princípios básicos da arquitetura (ex: lógica de negócio no componente, quebra de contrato).
   - 🟡 **MÉDIO**: Desalinhamento técnico (ex: falta de carregamento/skeleton, mock sem latência).
   - 🟢 **BAIXO**: Melhoria de estilo ou otimização secundária.

---

## 3. CHECKLIST GLOBAL

### 🏗️ Arquitetura
- [ ] A estrutura de pastas respeita o padrão modular (ex: `/modules/checkout`)?
- [ ] Existe dependência cruzada proibida entre módulos?
- [ ] O Monorepo está sendo respeitado ou existem importações relativas inválidas?

### 📝 SDD (Spec-Driven Development)
- [ ] Cada feature implementada possui um arquivo de especificação em `/reference/specs`?
- [ ] O código implementado reflete exatamente os critérios de aceite da spec?
- [ ] Existe "fogo amigo" (código criado sem spec prévia validada)?

### 🤝 Contratos (Contracts)
- [ ] Existe um arquivo `contracts.ts` (ou similar) definindo Schemas Zod e Tipos?
- [ ] O Frontend, o Service e o Mock utilizam o mesmo contrato?
- [ ] A validação de dados ocorre na entrada dos dados?

### ⚙️ Services
- [ ] Os Services são classes/funções puras (sem estado interno)?
- [ ] O Service desconhece completamente a existência da UI (sem toasts ou navegação dentro do service)?
- [ ] O Service retorna apenas Promises/Dados ou lança Erros padronizados?

### 🎣 Hooks
- [ ] O Hook atua como orquestrador entre Contexto e Service?
- [ ] O Hook implementa lógica de UI (Loading, Error Handling, Optimistic UI)?
- [ ] O Hook evita lógica de domínio pesada que deveria estar no Service?

### 🎨 UI & Componentes
- [ ] Os componentes são "burros" (recebem dados via props e emitem eventos)?
- [ ] Estados de **Loading** (Skeletons) estão implementados e visualmente estáveis?
- [ ] Estados de **Erro** e **Vazio** são tratados graciosamente?

### 🧪 Mocks
- [ ] Os Mocks simulam o comportamento real do backend (latência, erros aleatórios)?
- [ ] O Mock segue o contrato definido em `contracts.ts`?
- [ ] O Mock é independente o suficiente para ser substituído por uma API real sem mudar a lógica do Hook?

---

## 4. DETECÇÃO DE ANTI-PATTERNS

Qualquer um dos itens abaixo deve ser reportado imediatamente:
- **Business in View**: Lógica de cálculo ou decisão de negócio dentro de arquivos JSX/TSX.
- **Any-Type Infection**: Uso de `any` para ignorar o sistema de tipos e contratos.
- **Single Source of Truth Violation**: Dados sendo duplicados ou estados globais sendo manipulados de forma inconsistente.
- **Silent Failures**: Try/catch que silenciam erros sem informar o usuário ou o log.
- **Spec-less Code**: Código de feature que "apareceu" sem passar pelo processo de design da spec.

---

## 5. FORMATO DE SAÍDA (Relatório de Auditoria)

O resultado da auditoria deve sempre seguir este template:

### 🔴 Problemas Críticos
> Lista de falhas que impedem a aprovação ou quebram a integridade do sistema.

### 🟡 Problemas Médios
> Lista de pontos que precisam de ajuste para pleno alinhamento aos padrões Agon.

### 🟢 Melhorias Sugeridas
> Oportunidades de refatoração ou polimento.

### 🔧 Ações Recomendadas
> Passo a passo direto para remediar os problemas encontrados.

---

---

## 6. REGRA FINAL

Se houver inconsistência entre o **Código** e a **Referência**:
- **Opção A**: Corrigir o código para espelhar a referência (Padrão).
- **Opção B**: Se a mudança no código for intencional e melhor, a documentação de **Referência/Decisões** deve ser atualizada antes da aprovação.

**NUNCA** ignore uma divergência. Se a regra mudou, a documentação deve mudar.

---

## 7. 🔒 SEGURANÇA & SIGILO

O projeto Agon impõe um **Gate de Segurança Absoluto** contra o vazamento de segredos.

### 🔴 Violações Críticas (Bloqueio Imediato)
- **Produção**: Uso de chaves reais (`sk_live_`, `ghp_`, `AIza_`).
- **Infraestrutura**: Arquivos `.env` rastreados pelo Git ou fora do `.gitignore`.
- **Protocolo**: Authorization Bearer hardcoded no código fonte.
- **Bypass Inválido**: Uso de `// sdd-ignore-secret` sem o parâmetro obrigatório `reason`.

### 🟡 Alinhamento Médio
- **Placeholders de Teste**: `sk_test_` fora de diretórios de `/mocks` ou `/tests`.
- **Heurística**: Strings de alta entropia (> 32 chars) ou padrões JWT/Base64 suspeitos.
- **Fallbacks**: Uso de `process.env.KEY || "fallback"` com valores reais.

### 🤖 Regras para Geração por Agentes (AI)
Para garantir a segurança, qualquer agente deve:
- **NUNCA** gerar chaves reais; use sempre placeholders como `"sk_test_xxx"`.
- **NUNCA** hardcodar segredos; utilize sempre `process.env`.
- **NUNCA** criar arquivos `.env` fora do padrão documentado.
- **SEMPRE** justificar bypasses usando `// sdd-ignore-secret: reason=<motivo>`.

---

## 8. AUDITORIA AUTOMATIZADA

O projeto utiliza scripts automatizados (`npm run audit`) que verificam:
- Mapeamento módulo ↔ spec
- Presença e uso de contratos Zod
- Detecção de segredos (Secret Scanning)
- Anti-patterns (`any`)
- Score de qualidade (threshold: 80/100)

