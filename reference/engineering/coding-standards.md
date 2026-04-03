# Padrões de Código (Coding Standards)

## Naming Conventions
* **Pastas/Diretórios:** Utilize notação em minúsculo separada por traços `kebab-case` (ex: `shopping-cart`, `payment-methods`). Sem espaços ou camelCase na estrutura física.
* **Componentes React:** Notação hierárquica `PascalCase`. O nome do arquivo deve ser igual à declaração principal exportada (ex: `ProductCard.tsx`).
* **Funções Secundárias e Hooks:** `camelCase` (ex: `useAuth`, `formatCurrency`). Para valores ou computações booleanas adicione obrigatoriamente prefixos auto-explicativos como `is`, `has`, `should` (ex: `isValidEmail`).
* **Tipos Typescript e Interfaces:** Prefixados e auto-descritores em `PascalCase`. NUNCA use a interface pré-fixada antiga de C# (Evite `IUser`, use `User` direto). Sufixos unificadores como `DTO` ou `Payload` são permitidos.

## Organização de Arquivo
* **Ordem de Imports:** 
  1. Dependências React/Next (ex: `react`, `next/link`).
  2. Bibliotecas externas de vendors organizadas alfabeticamente (ex: `lucide-react`, `zod`).
  3. Imports internos de módulos mapeados via Alias estrito `@/`. NUNCA recorra ao inferno de imports relativos `../../../`.
  4. Interfaces/Tipos locais soltos.
* **Tamanho Estrutural Máximo:** Componentes ideais permanecem com até 200 - 300 linhas; passando desse limite o desenvolvedor ativamente cometeu um déficit de separação de responsabilidades sub-lógicas a extrair na pasta de contexto local.

## Acoplamento e Side-Effects
* Os componentes visuais alinhados sob a pasta reusável restrita (`ui/`) não conhecem ou transacionam ações globais complexas via rede. Não usam server actions internamente. Todo o poder mutacional lhes é passado injetado de forma limpa das camadas superiores da View ou Container Component onde foram declarados (Props explícitas ou Children pass that state forward).
