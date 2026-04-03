# Tech Stack

## Lista de Tecnologias Escolhidas

### 1. Framework Base: Next.js (App Router)
* **Justificativa:** Estrutura unificada simplificando criação de APIs internas, SSR contínuo crucial para performance de SEO orgânica dos produtos, roteamento intuitivo baseado em hierarquia de arquivo e Server Actions nativas mitigando over-fetching de dados.

### 2. Linguagem: TypeScript
* **Justificativa:** Fornece sistema de tipos estático essencial para prevenir os imprevistos (falsos null, cast inválido em preço de produtos, problemas em payloads), mantendo toda a codebase da refatoração blindada, legível e determinista.

### 3. Gerenciamento Monorepo: Turborepo
* **Justificativa:** Orquestra fluxos complexos em `packages/` e `apps/` transparentemente com caching de build agressivo na máquina local e Vercel, otimizando CI de ponta-a-ponta em segundos em vez de minutos.

### 4. Estilização: Tailwind CSS + Radix UI
* **Justificativa:** Tailwind acelera o *Styling by proximity* com performance altíssima e zero *dead CSS*. Já Radix fornece componentes headless primordiais (Acessibilidade garantida por default) servindo como espinha dorsal para nossos botões, modais, dropdowns e selects em conjunção com as variantes limpas.

### 5. Validação Estrita: Zod + React Hook Form
* **Justificativa:** Zod unifica esquemas entre servidor e cliente com uma declaração única em TypeScript (Domain truth). O React Hook Form otimiza a conversão e gestão de interações minimizando as renders desbalanceadas no browser.
