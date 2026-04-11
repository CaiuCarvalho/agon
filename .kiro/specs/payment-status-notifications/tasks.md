# Implementation Plan: Payment Status Notifications

## Overview

Este plano de implementação detalha as tarefas necessárias para construir o sistema completo de notificações e atualização automática de status de pedidos. A implementação segue uma abordagem incremental, começando pela infraestrutura crítica (webhook e banco de dados) e progredindo para funcionalidades de notificação em tempo real.

**Priorização**:
- **Crítico**: Webhook handler e RPC function (resolve problema principal de sincronização)
- **Alto**: Notificações em tempo real para admin (melhora experiência operacional)
- **Médio**: Preferências de notificação e email (funcionalidades complementares)
- **Baixo**: Features avançadas (centro de notificações, analytics)

## Tasks

- [x] 1. Criar RPC function para atualização atômica de pagamentos
  - Criar migration SQL com função `update_payment_from_webhook`
  - Implementar lógica de mapeamento de status (payment → order)
  - Adicionar limpeza de carrinho quando pagamento aprovado
  - Usar `SECURITY DEFINER` para bypass de RLS
  - Retornar JSONB com detalhes da operação (success, payment_id, order_id, old_status, new_status)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [ ]* 1.1 Escrever testes unitários para RPC function
  - Testar cada mapeamento de status (approved → processing, rejected → cancelled, etc.)
  - Testar rollback em caso de erro
  - Testar limpeza de carrinho apenas quando status = approved
  - _Requirements: 3.1-3.12_

- [x] 2. Implementar validação de assinatura de webhook
  - Criar função `validateWebhookSignature` no `mercadoPagoService`
  - Extrair timestamp e hash do header `x-signature`
  - Construir manifest string: `id:{data.id};request-id:{x-request-id};ts:{ts};`
  - Computar HMAC-SHA256 usando `MERCADOPAGO_WEBHOOK_SECRET`
  - Usar `crypto.timingSafeEqual` para comparação constant-time
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ]* 2.1 Escrever testes unitários para validação de assinatura
  - Testar assinatura válida
  - Testar assinatura inválida (hash incorreto)
  - Testar header malformado
  - Testar timestamp ausente
  - _Requirements: 1.1-1.9_

- [x] 3. Atualizar webhook handler com validação e processamento completo
  - Adicionar validação de assinatura antes de processar dados
  - Buscar detalhes do pagamento via API do Mercado Pago
  - Encontrar payment record usando `external_reference` (order_id)
  - Implementar seeding de `mercadopago_payment_id` na primeira notificação
  - Adicionar verificação de conflito de payment_id (retornar 409)
  - Implementar idempotency check (comparar status atual com novo)
  - Chamar RPC function para atualização atômica
  - Adicionar logging com correlation_id em todas as operações
  - Retornar códigos HTTP apropriados (200, 400, 401, 404, 409, 500)
  - _Requirements: 1.1-1.9, 2.1-2.11, 11.1-11.10, 12.1-12.8, 16.1-16.8, 25.1-25.10, 28.1-28.10_

- [ ]* 3.1 Escrever testes de integração para webhook handler
  - Testar fluxo completo com assinatura válida
  - Testar idempotency (webhooks duplicados)
  - Testar seeding de mercadopago_payment_id
  - Testar conflito de payment_id
  - Testar payment não encontrado (404)
  - Testar assinatura inválida (401)
  - _Requirements: 1.1-1.9, 2.1-2.11, 12.1-12.8_

- [x] 4. Checkpoint - Validar webhook funcionando
  - Testar webhook com ngrok em desenvolvimento
  - Verificar logs contêm correlation_id
  - Confirmar atualização de status no banco de dados
  - Verificar limpeza de carrinho após aprovação
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Criar hook useRealtimeOrders para subscriptions
  - Criar hook em `apps/web/src/hooks/useRealtimeOrders.ts`
  - Configurar subscription no canal 'admin-orders'
  - Filtrar eventos INSERT na tabela orders
  - Filtrar eventos UPDATE onde status mudou para 'processing'
  - Implementar callbacks para onInsert e onUpdate
  - Adicionar lógica de reconexão com exponential backoff (5 tentativas)
  - Retornar status da conexão (connected, disconnected, error)
  - Implementar cleanup na desmontagem do componente
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.9, 7.10, 21.1-21.10_

- [ ]* 5.1 Escrever testes para useRealtimeOrders
  - Testar setup e teardown de subscription
  - Testar filtros de eventos (INSERT, UPDATE)
  - Testar lógica de reconexão
  - Testar error handling
  - _Requirements: 4.1-4.3, 21.1-21.10_

- [x] 6. Implementar componente OrderStatusBadge
  - Criar componente em `apps/web/src/components/admin/OrderStatusBadge.tsx`
  - Mapear status para labels em português (pending → "Pendente", processing → "Processando", etc.)
  - Aplicar cores por status (green para processing, yellow para pending, red para cancelled, blue para shipped, gray para delivered)
  - Usar Tailwind classes para styling consistente
  - Adicionar ARIA labels para acessibilidade
  - Exportar tipo OrderStatus
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 7. Criar sistema de notificações toast
  - Instalar biblioteca Sonner (se não instalada)
  - Criar hook `useOrderNotifications` em `apps/web/src/hooks/useOrderNotifications.ts`
  - Implementar função para exibir toast com detalhes do pedido (order_number, customer_name, amount, payment_method)
  - Adicionar botão de ação "Ver Pedido" que navega para detalhes
  - Configurar duração de 10 segundos
  - Aplicar cores por status (green para approved, yellow para pending, red para rejected)
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

- [ ] 8. Implementar notificações do navegador (Browser Notifications)
  - Adicionar lógica para solicitar `Notification.permission` no mount do Admin Panel
  - Criar função para exibir Browser Notification quando novo pedido aprovado
  - Configurar título: "Novo Pedido Aprovado!"
  - Configurar body: "Pedido #{order_number} - R$ {amount}"
  - Adicionar logo Agon como ícone
  - Implementar handler de click para focar janela e navegar para pedido
  - Auto-fechar após 10 segundos
  - Exibir apenas quando tab não está ativa (`document.hidden`)
  - Fallback para toast se permissão negada
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [ ] 9. Adicionar alerta sonoro para notificações
  - Adicionar arquivo de áudio em `apps/web/public/sounds/notification.mp3`
  - Criar hook `useSoundAlert` para gerenciar reprodução
  - Reproduzir som quando novo pedido aprovado detectado
  - Respeitar políticas de autoplay do navegador
  - Adicionar toggle para habilitar/desabilitar som
  - Armazenar preferência em localStorage
  - Reproduzir apenas quando tab está ativa
  - Tratar erros de reprodução graciosamente
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 10. Criar componente NotificationPreferences
  - Criar componente em `apps/web/src/components/admin/NotificationPreferences.tsx`
  - Adicionar toggles para: toast, browser, sound
  - Armazenar preferências em localStorage com chave 'admin-notification-preferences'
  - Carregar preferências no mount
  - Aplicar mudanças imediatamente
  - Exibir status atual de `Notification.permission`
  - Adicionar botão para solicitar permissão se negada
  - Usar componentes Radix UI (Switch)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

- [ ] 11. Atualizar Admin Orders Page com real-time updates
  - Modificar `apps/web/src/app/admin/orders/page.tsx`
  - Integrar hook `useRealtimeOrders`
  - Atualizar lista de pedidos quando eventos recebidos
  - Prepend novos pedidos ao topo da lista
  - Atualizar pedidos existentes quando status muda
  - Integrar sistema de notificações (toast, browser, sound)
  - Exibir indicador de status de conexão (green/red)
  - Adicionar botão "Reconectar" em caso de erro
  - Exibir loading skeleton durante fetch inicial
  - Ordenar pedidos por created_at DESC
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [ ]* 11.1 Escrever testes de integração para Admin Orders Page
  - Testar atualização em tempo real da lista
  - Testar exibição de notificações
  - Testar reconexão após erro
  - _Requirements: 7.1-7.10_

- [ ] 12. Checkpoint - Validar notificações funcionando
  - Criar pedido de teste e aprovar pagamento
  - Verificar toast notification aparece
  - Verificar browser notification aparece (se permissão concedida)
  - Verificar som reproduz (se habilitado)
  - Verificar lista de pedidos atualiza em tempo real
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implementar estatísticas em tempo real no Admin Dashboard
  - Modificar `apps/web/src/app/admin/page.tsx`
  - Adicionar subscription para atualizar estatísticas quando orders mudam
  - Calcular: total orders, pending orders, processing orders, total revenue
  - Exibir em cards com ícones
  - Usar formatação de moeda brasileira (R$ X.XXX,XX)
  - Atualizar contadores quando novo pedido criado
  - Atualizar contadores quando status de pedido muda
  - Exibir loading state durante fetch inicial
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [ ] 14. Adicionar exibição de método de pagamento no Admin
  - Criar função helper para mapear payment_method para português
  - Mapear: credit_card → "Cartão de Crédito", debit_card → "Cartão de Débito", pix → "PIX", boleto → "Boleto Bancário", account_money → "Saldo Mercado Pago"
  - Adicionar ícones para cada método de pagamento (lucide-react)
  - Exibir "Não informado" quando payment_method é NULL
  - Integrar na lista de pedidos e página de detalhes
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_

- [ ] 15. Implementar busca e filtros na Admin Orders Page
  - Adicionar input de busca para order_number ou customer_name
  - Adicionar dropdown de filtro por status
  - Adicionar filtro de data range (date picker)
  - Implementar filtros em tempo real (debounce 300ms)
  - Permitir combinação de filtros
  - Exibir contagem de resultados filtrados
  - Persistir filtros em URL query params
  - Adicionar botão "Limpar Filtros"
  - Manter real-time updates mesmo com filtros ativos
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9_

- [ ] 16. Criar página de detalhes do pedido
  - Criar ou atualizar `apps/web/src/app/admin/orders/[id]/page.tsx`
  - Exibir informações do cliente (name, email, phone)
  - Exibir endereço de entrega (street, city, state, zip)
  - Exibir itens do pedido (product name, quantity, size, price)
  - Exibir informações de pagamento (method, status, amount)
  - Exibir OrderStatusBadge com status atual
  - Exibir datas (created_at, updated_at)
  - Formatar valor total em moeda brasileira
  - Adicionar botão "Voltar para Pedidos"
  - Exibir 404 quando pedido não encontrado
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_

- [ ] 17. Implementar validação de transições de status
  - Criar função helper `isValidStatusTransition` em utils
  - Permitir: pending → processing, processing → shipped, shipped → delivered
  - Permitir: qualquer status → cancelled
  - Prevenir: delivered → processing, cancelled → processing
  - Adicionar validação no RPC function
  - Retornar erro quando transição inválida
  - Logar tentativas de transição inválida
  - Exibir transições permitidas no Admin Panel
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8, 27.9, 27.10_

- [ ] 18. Adicionar otimizações de performance no Admin Panel
  - Implementar paginação (20 pedidos por página)
  - Adicionar virtual scrolling para listas grandes
  - Configurar React Query cache para pedidos
  - Implementar optimistic updates para mudanças de status
  - Debounce search input (300ms)
  - Lazy load detalhes de pedidos
  - Usar React.memo para componentes de lista
  - Adicionar loading skeletons
  - Verificar índices no banco de dados (order_id, mercadopago_payment_id)
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.10_

- [ ] 19. Implementar responsividade mobile no Admin Panel
  - Usar layout responsivo para telas mobile
  - Empilhar colunas verticalmente em mobile
  - Adicionar hamburger menu para navegação
  - Tornar notification center acessível via menu mobile
  - Garantir página de detalhes scrollable em mobile
  - Usar tamanhos de botão touch-friendly (min 44x44px)
  - Ocultar colunas menos importantes em mobile
  - Usar bottom sheet para filtros em mobile
  - Suportar gestos de swipe para navegação
  - Testar em iOS Safari e Android Chrome
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9, 23.10_

- [ ] 20. Checkpoint - Validar Admin Panel completo
  - Testar todas as funcionalidades em desktop
  - Testar todas as funcionalidades em mobile
  - Verificar performance com muitos pedidos
  - Verificar acessibilidade com teclado
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implementar notificações por email (opcional)
  - Instalar e configurar Resend SDK
  - Criar template HTML de email em `email-templates/order-approved.html`
  - Criar função para enviar email quando pagamento aprovado
  - Incluir detalhes do pedido no email (customer, items, total, payment_method)
  - Adicionar link para detalhes do pedido no Admin Panel
  - Usar variável de ambiente `RESEND_API_KEY` e `ADMIN_EMAIL_PRIMARY`
  - Pular envio se `RESEND_API_KEY` não configurado
  - Não bloquear webhook se envio de email falhar
  - Não enviar email para pedidos de teste (sandbox)
  - Logar erros de envio de email
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

- [ ] 22. Criar endpoint de health check para webhook
  - Criar GET endpoint em `/api/webhooks/mercadopago/health`
  - Retornar 200 OK com status: "healthy"
  - Verificar `MERCADOPAGO_WEBHOOK_SECRET` está configurado
  - Verificar `MERCADOPAGO_ACCESS_TOKEN` está configurado
  - Não expor valores reais das credenciais
  - Retornar status de configuração (configured/missing)
  - Tornar endpoint acessível sem autenticação
  - Incluir timestamp na resposta
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ] 23. Implementar centro de notificações (opcional)
  - Criar componente NotificationCenter em `apps/web/src/components/admin/NotificationCenter.tsx`
  - Exibir ícone de sino no header do Admin Panel
  - Mostrar lista das últimas 50 notificações
  - Exibir tipo, mensagem e timestamp de cada notificação
  - Marcar notificações como lidas/não lidas
  - Exibir badge com contagem de não lidas
  - Armazenar notificações em localStorage
  - Limpar notificações antigas após 7 dias
  - Adicionar botão "Marcar todas como lidas"
  - Adicionar botão "Limpar histórico"
  - Navegar para pedido ao clicar em notificação
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10_

- [ ] 24. Adicionar melhorias de acessibilidade
  - Usar elementos HTML semânticos (header, nav, main, section)
  - Adicionar ARIA labels para elementos interativos
  - Garantir navegação por teclado (Tab, Enter, Escape)
  - Adicionar indicadores de foco para usuários de teclado
  - Verificar contraste de cores (WCAG AA)
  - Adicionar alternativas de texto para ícones
  - Anunciar notificações para screen readers
  - Usar hierarquia de headings correta (h1, h2, h3)
  - Suportar zoom do navegador até 200%
  - Testar com screen readers (NVDA, JAWS)
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8, 29.9, 29.10_

- [ ] 25. Criar documentação de setup e troubleshooting
  - Criar arquivo `PAYMENT-NOTIFICATIONS-SETUP.md` na raiz do projeto
  - Documentar configuração de webhook no Mercado Pago
  - Documentar variáveis de ambiente necessárias
  - Incluir instruções para testar webhook com ngrok
  - Documentar formato de assinatura de webhook
  - Adicionar exemplos de payload de webhook
  - Criar seção de troubleshooting para problemas comuns
  - Documentar códigos de erro HTTP e significados
  - Incluir checklist de validação de webhook
  - Adicionar guia de uso do Admin Panel
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9, 30.1-30.10_

- [ ] 26. Checkpoint final - Validação completa do sistema
  - Testar fluxo completo: criar pedido → aprovar pagamento → receber notificação
  - Validar webhook com assinatura real do Mercado Pago
  - Verificar idempotency com webhooks duplicados
  - Testar todos os tipos de notificação (toast, browser, sound)
  - Validar preferências de notificação persistem
  - Testar Admin Panel em múltiplos navegadores
  - Verificar responsividade em mobile
  - Validar acessibilidade com teclado e screen reader
  - Revisar logs para garantir correlation_id presente
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental do sistema
- Implementação segue ordem de prioridade: crítico → alto → médio → baixo
- Testes de integração e E2E são opcionais mas recomendados
- Property-based tests não são aplicáveis (feature é infrastructure-heavy)
- Documentação é essencial para manutenção futura

## Testing Strategy

### Unit Tests (Optional)
- Validação de assinatura de webhook
- Mapeamento de status (payment → order)
- Preferências de notificação (localStorage)

### Integration Tests (Optional)
- Fluxo completo de webhook
- Atualização atômica via RPC function
- Real-time subscriptions

### Manual Testing (Required)
- Webhook com Mercado Pago sandbox
- Notificações em tempo real
- Admin Panel em múltiplos dispositivos
- Acessibilidade com teclado e screen reader

## Environment Variables Required

```bash
# Mercado Pago (Required)
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL (Required for webhooks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Email (Optional)
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL_PRIMARY=admin@yourdomain.com
ADMIN_EMAIL_BACKUP=backup@yourdomain.com
```

## Migration Files to Create

1. `supabase/migrations/YYYYMMDD_create_update_payment_from_webhook_function.sql`
   - RPC function for atomic payment/order updates
   - Status mapping logic
   - Cart clearing on approval

## Key Files to Create/Modify

### New Files
- `apps/web/src/hooks/useRealtimeOrders.ts`
- `apps/web/src/hooks/useOrderNotifications.ts`
- `apps/web/src/hooks/useSoundAlert.ts`
- `apps/web/src/components/admin/OrderStatusBadge.tsx`
- `apps/web/src/components/admin/NotificationPreferences.tsx`
- `apps/web/src/components/admin/NotificationCenter.tsx` (optional)
- `apps/web/public/sounds/notification.mp3`
- `email-templates/order-approved.html` (optional)
- `PAYMENT-NOTIFICATIONS-SETUP.md`

### Modified Files
- `apps/web/src/app/api/webhooks/mercadopago/route.ts`
- `apps/web/src/modules/payment/services/mercadoPagoService.ts`
- `apps/web/src/app/admin/orders/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/admin/orders/[id]/page.tsx`

## Success Criteria

✅ Webhook processa notificações do Mercado Pago corretamente  
✅ Status de pedidos atualiza automaticamente no banco de dados  
✅ Administradores recebem notificações em tempo real  
✅ Admin Panel exibe pedidos atualizados sem refresh  
✅ Sistema é idempotente (webhooks duplicados não causam problemas)  
✅ Logs contêm correlation_id para debugging  
✅ Performance é adequada com muitos pedidos  
✅ Interface é responsiva e acessível  
✅ Documentação está completa e clara  

---

**Status**: ✅ Pronto para implementação

**Próximos Passos**:
1. Revisar tasks com equipe
2. Configurar ambiente de desenvolvimento
3. Começar pela Task 1 (RPC function)
4. Testar incrementalmente em cada checkpoint
