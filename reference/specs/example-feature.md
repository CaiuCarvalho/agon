# Feature Contextual: Adição Dinâmica Expressa ao Carrinho

> Tipo: **Exemplo de Spec de Fluxo (Frontend Centric)**  
> Aplicação: `apps/web`

## A Raiz do Problema
O usuário final navega em listagens e grelhas infinitas em velocidade no design principal B2C de alta conversão para localizar acessórios de futebol rápido, mas sua jornada era frequentemente quebrada se cada clique forçasse transicionamentos visuais longos para a rota de fechamento inteira isolada ou demorasse para dar o rastro claro que adicionou o artefato a sua sessão local ou remota, esvaindo energia em retornos à lista principal originária.

## Solução Guiada Desenhada (A Spec)
Um sistema interceptador offcanvas lateral, o **Flyout Sidebar Cart**; Desliza agilmente de trás do viewport e se impõe limpo à visualização retendo controle do scroll primário, interceptando inputs nativos na página inicial para injetar atualizações automáticas via fluxos do ecossistema React.

## Regramentos Exatos Funcionais
- Bater cliques em 'Adicionar/Injetar+' nos artigos ativa um componente visual dinâmico com renderização prévia *Optimistic Update* (assuma o clique como garantido na View local caso dependa de sync), diminuindo o overhead local visual percebido da operação API para exatos **0ms** visuais local.
- O fechamento físico visual não encerra a permanência estática da lista em background State; o acumulado perdura sinalizado como bolha minimalista notificadora (*Badge*) no próprio Header global ininterrupto.
- Volumes extremoss absurdamente irreais além de `+10` recebem negação controlada num discreto componente *Sonner Toast*, desarmando falhas frontais críticas indesejadas pelo input solto manual do fã hiperativo.

## Critérios Extremos de Aceitação
1. **[  ]** O acionador (Botão UI Comprar) preenche nativo com Toast sinalizador unificado amigável.
2. **[  ]** O painel descola da lateral sem trepidações ou reconfigurações brutas na DOM porção das renderizações da árvore, gerando animações usando Framer Motion fluidas do Radix UI.
3. **[  ]** Alterações negativas contendo "Redução para QNT = 0" no SidePanel excluem e evaporam naturalmente a array itemística da View sem relógios ou mensagens modais agressivas (Basta desaparecer).
4. **[  ]** A totalização calculística visível global das prévias moedas (R$/BRL Total no Rodapé do Sidebar) ocorre no componente React em precisão automática de vírgula limpa, prevenindo confusão centesimal baseada na formatação utilitária global do `utils`.
