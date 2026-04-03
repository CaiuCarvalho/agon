# Spec-Driven Development (SDD) Guidelines

## Como aplicar Spec-Driven Development no Agon
O SDD (Desenvolvimento Orientado a Especificações) nos confina e governa a regra que proíbe programar funcionalidades puras de app sem um contrato textual de requisitos prévio. A Inteligência Artificial desenvolvedora deve ler e seguir obrigatoriamente essas regras documentadas para evitar halucinação corporativa.

## Fluxo (Ciclo Contínuo)
1. **Especificação (Spec):** 
   - Ao receber o escopo funcional, gera-se ou atualiza-se os arquivos na dimensão de referenciamento (ex: `/reference/specs/example-feature.md`). Detalham-se Contratos de Input, Estrutura Funcional Esperada, Outputs, e Asserções Válidas/Erros. A interface só decola se a fundação for compreendida.
2. **Revisão Autoral:**
   - Conferimos se nenhuma regra imposta na Especificação bate de frente corrompendo arquiteturas bases descritas formalmente nos arquétipos `/reference/domain/domain-rules.md`.
3. **Implementação Cegamente Fiel:**
   - O desenvolvimento e a geração do código ativamente restringe-se fielmente aos requisitos declarados no Spec. Atalhos que alterem comportamentos sem estar na spec invalidam a operação.
4. **Validação Estrita do Círculo:**
   - Ferramentas estáticas nativas de checagem do Typescript ativamente comprovam a fidelidade no contrato em nível binário (no errors).

## A Meta-Diretriz de Base
**Jamais assuma premissas de lógica escondida**. Se uma tela, fluxo ou backend comporta de certo modo esperado, ele não "aparece", ele deve ter sido originado de uma declaração textual na `/reference/specs`. 
Se as *specs* são limpas, consistentes e fáceis, o software que resulta delas será indestrutível e expansível.
