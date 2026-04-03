# Regras Globais do Domínio (Agon Domain Rules)

A matriz inflexível limitadora, garantindo solidez empresarial, protegida por lei. Nenhuma alteração arquitetural nas Views frontais ou *features* mágicas devem ir de encontro às premissas e obrigações fundamentais do repasse de informações de código restrito aqui fixadas.

## 1. Integridade Oficial e Determinismo em Preços
Sob hipótese alguma as interfaces expostas dos consumidores detêm o livre-arbítrio ditatorial de faturar a operação enviando preços manipulados em JSON contra os gateways sensíveis (Stripe/Paypal). O FrontEnd dita a Array do que se deseja, o Backend detém as chaves para bater o peso total, extraindo a conta via IDs registrados no Banco para evitar perdas ou fraudes matemáticas transacionais pelo cliente adulterado via JS.

## 2. Abstração Restritiva contra Bloqueios Fracionários Inválidos
O controle do volume logístico é regido via blocos atômicos. O Next Server rejeitará ordens vazadas em formulários numéricos quebrados, números negativados bizarros de unidades (ex `qnt: -1`) não importando o avanço. As `Server Actions` realizam bloqueios duplos (*Double-Check Locking*) e não dismistificam uma ordem se no milisegundo transcorrente os provedores alertarem vazios operacionais imprevistos de catálogo de inventário.

## 3. Segurança Isolada do Roteiro (Hardened Auth Guards)
Rotas relativas às visões da loja aberta funcionam separadas sem misturar vazamento imperativo no código React aos pacotes dedicados como `apps/web/src/app/admin`. Toda área B2E baseia-se num porteiro estático universal interceptador (*Next Middleware*) prevenindo e anulando fluxos errôneos da JWT Key e Session sem bater localmente em banco à cada frame das views pesadas do React, conferindo barateamento nas instâncias DB de checagem.

## 4. Ordem Temporalmente Isolada Irretroativa
A Ordem criada congela o *snapshot* fotográfico legal imutável. As *Cart Sessões* em andamento rejeitam avanços assim que interceptadas caso alterações desestabilizem o custo fixo durante compras em transição flutuante. A segurança proíbe forçar uma reidratação de pagamento retroativo.
