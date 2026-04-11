# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de notificações e atualização automática de status de pedidos no e-commerce Agon. A feature resolve o problema atual onde pagamentos aprovados no Mercado Pago não atualizam o status do pedido no banco de dados e não geram notificações para o administrador.

O sistema atual possui webhook configurado mas não está processando corretamente as notificações de pagamento. Esta feature corrige o fluxo de webhook, adiciona notificações em tempo real para o admin, e garante sincronização consistente entre Mercado Pago e banco de dados.

## Glossary

- **Webhook_Handler**: Rota `/api/webhooks/mercadopago` que recebe notificações do Mercado Pago
- **Payment_Notification**: Notificação HTTP POST enviada pelo Mercado Pago quando status de pagamento muda
- **Admin_Notification_System**: Sistema de notificações em tempo real para administradores
- **Order_Status_Sync**: Processo de sincronização entre status de pagamento e status de pedido
- **Payments_Table**: Tabela Supabase com colunas: id, order_id, mercadopago_payment_id, mercadopago_preference_id, status, payment_method, amount
- **Orders_Table**: Tabela Supabase com informações de pedidos incluindo status e dados de entrega
- **Payment_Status**: Estado do pagamento (pending, approved, rejected, cancelled, refunded, in_process)
- **Order_Status**: Estado do pedido (pending, processing, shipped, delivered, cancelled)
- **Admin_Panel**: Interface em `/admin/orders` para visualizar e gerenciar pedidos
- **Real_Time_Subscription**: Supabase Realtime subscription para atualizações instantâneas
- **Toast_Notification**: Notificação visual temporária usando biblioteca Sonner
- **Email_Notification**: Notificação por email enviada via Resend (opcional)
- **Webhook_Signature**: Assinatura HMAC-SHA256 no header x-signature para validar autenticidade
- **External_Reference**: Campo order_id usado como referência externa no Mercado Pago
- **RPC_Function**: Função PostgreSQL `update_payment_from_webhook` para atualização atômica
- **Admin_Dashboard**: Página `/admin` com estatísticas e resumo de pedidos
- **Order_Badge**: Componente visual mostrando status do pedido com cores
- **Notification_Sound**: Som de alerta reproduzido quando novo pedido é aprovado
- **Browser_Notification**: Notificação nativa do navegador usando Web Notifications API
- **Notification_Permission**: Permissão do usuário para receber notificações do navegador
- **Admin_Role**: Role 'admin' na tabela profiles que identifica administradores
- **Webhook_Retry**: Tentativa automática de reenvio de webhook pelo Mercado Pago (até 12x em 48h)
- **Idempotency_Check**: Verificação para prevenir processamento duplicado de webhooks
- **Payment_Details**: Dados completos do pagamento obtidos via API do Mercado Pago
- **Correlation_ID**: Identificador único (x-request-id) para rastreamento de webhooks

## Requirements

### Requirement 1: Webhook Signature Validation Fix

**User Story:** Como sistema, preciso validar corretamente assinaturas de webhooks, para que apenas notificações legítimas do Mercado Pago sejam processadas.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL extract `x-signature` header from incoming requests
2. THE Webhook_Handler SHALL extract `x-request-id` header from incoming requests
3. THE Webhook_Handler SHALL parse x-signature to extract `ts` (timestamp) and `v1` (hash)
4. THE Webhook_Handler SHALL construct manifest string as: `id:{data.id};request-id:{x-request-id};ts:{ts};`
5. THE Webhook_Handler SHALL compute HMAC-SHA256 hash using MERCADOPAGO_WEBHOOK_SECRET
6. WHEN computed hash matches v1 signature, THE Webhook_Handler SHALL proceed with processing
7. WHEN computed hash does not match, THE Webhook_Handler SHALL return 401 Unauthorized
8. THE Webhook_Handler SHALL log signature validation failures with Correlation_ID
9. THE Webhook_Handler SHALL return 200 OK within 5 seconds to prevent Webhook_Retry

### Requirement 2: Payment Status Update from Webhook

**User Story:** Como sistema, preciso atualizar status de pagamentos automaticamente, para que pedidos reflitam o estado real no Mercado Pago.

#### Acceptance Criteria

1. WHEN webhook signature is validated, THE Webhook_Handler SHALL extract Payment_ID from request body
2. THE Webhook_Handler SHALL fetch Payment_Details from Mercado Pago API using Payment_ID
3. THE Webhook_Handler SHALL extract External_Reference (order_id) from Payment_Details
4. THE Webhook_Handler SHALL find payment record in Payments_Table using External_Reference
5. WHEN payment record is not found, THE Webhook_Handler SHALL log error and return 404
6. THE Webhook_Handler SHALL check if mercadopago_payment_id already exists in payment record
7. WHEN mercadopago_payment_id is NULL, THE Webhook_Handler SHALL seed it with Payment_ID
8. WHEN mercadopago_payment_id exists and differs from Payment_ID, THE Webhook_Handler SHALL return 409 Conflict
9. THE Webhook_Handler SHALL perform Idempotency_Check comparing current status with new status
10. WHEN status is unchanged, THE Webhook_Handler SHALL skip update and return 200 OK
11. WHEN status changed, THE Webhook_Handler SHALL call RPC_Function to update payment and order

### Requirement 3: Atomic Payment and Order Status Update

**User Story:** Como sistema, preciso atualizar pagamento e pedido atomicamente, para que dados permaneçam consistentes.

#### Acceptance Criteria

1. THE RPC_Function SHALL accept parameters: p_mercadopago_payment_id, p_status, p_payment_method
2. THE RPC_Function SHALL find payment record by mercadopago_payment_id
3. THE RPC_Function SHALL determine new Order_Status based on Payment_Status
4. WHEN Payment_Status is 'approved', THE RPC_Function SHALL set Order_Status to 'processing'
5. WHEN Payment_Status is 'rejected' or 'cancelled', THE RPC_Function SHALL set Order_Status to 'cancelled'
6. WHEN Payment_Status is 'pending' or 'in_process', THE RPC_Function SHALL keep Order_Status as 'pending'
7. WHEN Payment_Status is 'refunded', THE RPC_Function SHALL set Order_Status to 'cancelled'
8. THE RPC_Function SHALL update Payments_Table with new status and payment_method
9. THE RPC_Function SHALL update Orders_Table with new status
10. WHEN Payment_Status is 'approved', THE RPC_Function SHALL delete cart_items for user
11. THE RPC_Function SHALL execute all updates in single database transaction
12. WHEN any update fails, THE RPC_Function SHALL rollback all changes

### Requirement 4: Real-Time Order Notifications for Admin

**User Story:** Como administrador, quero receber notificações em tempo real quando pedidos são aprovados, para que eu possa processar rapidamente.

#### Acceptance Criteria

1. THE Admin_Panel SHALL subscribe to Real_Time_Subscription on Orders_Table
2. THE Real_Time_Subscription SHALL filter for INSERT events on Orders_Table
3. THE Real_Time_Subscription SHALL filter for UPDATE events WHERE status changed to 'processing'
4. WHEN new order is created, THE Admin_Panel SHALL display Toast_Notification
5. WHEN order status changes to 'processing', THE Admin_Panel SHALL display Toast_Notification
6. THE Toast_Notification SHALL include: order number, customer name, total amount, payment method
7. THE Toast_Notification SHALL display for 10 seconds with action button "Ver Pedido"
8. WHEN user clicks "Ver Pedido", THE system SHALL navigate to order details page
9. THE Toast_Notification SHALL use green color for approved payments
10. THE Toast_Notification SHALL use yellow color for pending payments
11. THE Toast_Notification SHALL use red color for rejected payments

### Requirement 5: Browser Notification for New Orders

**User Story:** Como administrador, quero receber notificações do navegador quando novos pedidos chegam, para que eu seja alertado mesmo em outra aba.

#### Acceptance Criteria

1. THE Admin_Panel SHALL request Notification_Permission on component mount
2. WHEN Notification_Permission is granted, THE system SHALL enable Browser_Notification
3. WHEN new order with status 'processing' is detected, THE system SHALL show Browser_Notification
4. THE Browser_Notification SHALL display title: "Novo Pedido Aprovado!"
5. THE Browser_Notification SHALL display body: "Pedido #{order_number} - R$ {amount}"
6. THE Browser_Notification SHALL include Agon logo as icon
7. WHEN user clicks Browser_Notification, THE system SHALL focus window and navigate to order
8. THE Browser_Notification SHALL auto-close after 10 seconds
9. WHEN Notification_Permission is denied, THE system SHALL only show Toast_Notification
10. THE system SHALL NOT show Browser_Notification when Admin_Panel tab is active

### Requirement 6: Notification Sound Alert

**User Story:** Como administrador, quero ouvir um som quando novo pedido chega, para que eu seja alertado mesmo sem olhar a tela.

#### Acceptance Criteria

1. THE Admin_Panel SHALL include audio file for Notification_Sound
2. WHEN new order with status 'processing' is detected, THE system SHALL play Notification_Sound
3. THE Notification_Sound SHALL be short (1-2 seconds) and pleasant
4. THE Notification_Sound SHALL respect browser autoplay policies
5. THE system SHALL provide toggle to enable/disable Notification_Sound in Admin_Panel
6. THE sound preference SHALL be stored in localStorage
7. THE Notification_Sound SHALL NOT play when Admin_Panel tab is not active
8. THE system SHALL handle audio playback errors gracefully

### Requirement 7: Admin Orders Page Real-Time Updates

**User Story:** Como administrador, quero ver lista de pedidos atualizada em tempo real, para que eu sempre veja dados corretos.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display orders list with columns: order number, customer, status, amount, date
2. THE Admin_Panel SHALL subscribe to Real_Time_Subscription on Orders_Table
3. WHEN order status changes, THE Admin_Panel SHALL update order in list without page refresh
4. WHEN new order is created, THE Admin_Panel SHALL prepend it to list
5. THE Admin_Panel SHALL display Order_Badge with color-coded status
6. THE Order_Badge SHALL use green for 'processing', yellow for 'pending', red for 'cancelled'
7. THE Admin_Panel SHALL sort orders by created_at DESC (newest first)
8. THE Admin_Panel SHALL display loading skeleton while fetching initial data
9. THE Admin_Panel SHALL handle Real_Time_Subscription errors gracefully
10. THE Admin_Panel SHALL reconnect Real_Time_Subscription on connection loss

### Requirement 8: Order Status Badge Component

**User Story:** Como administrador, quero ver status de pedidos visualmente, para que eu identifique rapidamente o estado de cada pedido.

#### Acceptance Criteria

1. THE Order_Badge SHALL display status text in Portuguese
2. THE Order_Badge SHALL map 'pending' to "Pendente" with yellow background
3. THE Order_Badge SHALL map 'processing' to "Processando" with green background
4. THE Order_Badge SHALL map 'shipped' to "Enviado" with blue background
5. THE Order_Badge SHALL map 'delivered' to "Entregue" with gray background
6. THE Order_Badge SHALL map 'cancelled' to "Cancelado" with red background
7. THE Order_Badge SHALL use rounded corners and padding for visual appeal
8. THE Order_Badge SHALL use contrasting text color for readability
9. THE Order_Badge SHALL be reusable across Admin_Panel pages

### Requirement 9: Admin Dashboard Statistics Update

**User Story:** Como administrador, quero ver estatísticas atualizadas em tempo real, para que eu monitore performance do negócio.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display total orders count
2. THE Admin_Dashboard SHALL display pending orders count
3. THE Admin_Dashboard SHALL display processing orders count
4. THE Admin_Dashboard SHALL display total revenue (sum of approved orders)
5. THE Admin_Dashboard SHALL subscribe to Real_Time_Subscription on Orders_Table
6. WHEN order status changes, THE Admin_Dashboard SHALL recalculate statistics
7. WHEN new order is created, THE Admin_Dashboard SHALL increment counters
8. THE Admin_Dashboard SHALL display statistics in card layout with icons
9. THE Admin_Dashboard SHALL use currency formatting for revenue (R$ X.XXX,XX)
10. THE Admin_Dashboard SHALL display loading state while fetching initial data

### Requirement 10: Email Notification for Approved Orders (Optional)

**User Story:** Como administrador, quero receber email quando pedido é aprovado, para que eu seja notificado mesmo offline.

#### Acceptance Criteria

1. WHEN Payment_Status changes to 'approved', THE system SHALL send Email_Notification
2. THE Email_Notification SHALL be sent to ADMIN_EMAIL_PRIMARY from environment variables
3. THE Email_Notification SHALL include subject: "Novo Pedido Aprovado - #{order_number}"
4. THE Email_Notification SHALL include order details: customer name, items, total, payment method
5. THE Email_Notification SHALL include link to order details page in Admin_Panel
6. THE Email_Notification SHALL use Resend API with RESEND_API_KEY
7. WHEN RESEND_API_KEY is not configured, THE system SHALL skip email sending
8. WHEN email sending fails, THE system SHALL log error but NOT block webhook processing
9. THE Email_Notification SHALL use HTML template with Agon branding
10. THE system SHALL NOT send email for test orders (sandbox mode)

### Requirement 11: Webhook Error Logging and Monitoring

**User Story:** Como desenvolvedor, preciso de logs detalhados de webhooks, para que eu possa debugar problemas de integração.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL log all incoming webhook requests with Correlation_ID
2. THE Webhook_Handler SHALL log signature validation results (success/failure)
3. THE Webhook_Handler SHALL log Payment_Details fetched from Mercado Pago
4. THE Webhook_Handler SHALL log payment status updates with old and new status
5. THE Webhook_Handler SHALL log all errors with stack traces and context
6. THE Webhook_Handler SHALL use structured logging format with timestamps
7. THE Webhook_Handler SHALL include Payment_ID and order_id in all log entries
8. THE Webhook_Handler SHALL log idempotency checks (skipped updates)
9. THE system SHALL NOT log sensitive data (access tokens, full payment details)
10. THE logs SHALL be accessible via server console in development mode

### Requirement 12: Webhook Idempotency Handling

**User Story:** Como sistema, preciso processar webhooks de forma idempotente, para que notificações duplicadas não causem inconsistências.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL check current payment status before updating
2. WHEN current status equals new status, THE Webhook_Handler SHALL skip update
3. WHEN update is skipped, THE Webhook_Handler SHALL log idempotency check
4. WHEN update is skipped, THE Webhook_Handler SHALL return 200 OK with skipped flag
5. THE Webhook_Handler SHALL handle concurrent webhook deliveries using database locks
6. THE RPC_Function SHALL use transaction isolation to prevent race conditions
7. THE system SHALL handle Mercado Pago retry attempts gracefully
8. THE system SHALL NOT send duplicate notifications for same status change

### Requirement 13: Admin Panel Access Control

**User Story:** Como sistema, preciso garantir que apenas administradores vejam notificações, para que dados sensíveis sejam protegidos.

#### Acceptance Criteria

1. THE Admin_Panel SHALL verify user has Admin_Role before rendering
2. THE Admin_Panel SHALL check profiles.role = 'admin' for current user
3. WHEN user is not admin, THE Admin_Panel SHALL redirect to homepage
4. THE Real_Time_Subscription SHALL only be active for users with Admin_Role
5. THE Admin_Panel SHALL verify admin status on component mount
6. THE system SHALL NOT expose admin endpoints to non-admin users
7. THE Admin_Panel SHALL display "Acesso Negado" message for unauthorized users

### Requirement 14: Order Details Page Enhancement

**User Story:** Como administrador, quero ver detalhes completos do pedido, para que eu possa processar e enviar corretamente.

#### Acceptance Criteria

1. THE order details page SHALL display customer information: name, email, phone
2. THE order details page SHALL display shipping address: street, city, state, zip
3. THE order details page SHALL display order items with: product name, quantity, size, price
4. THE order details page SHALL display payment information: method, status, amount
5. THE order details page SHALL display Order_Badge with current status
6. THE order details page SHALL display order creation date and last update date
7. THE order details page SHALL display total amount in Brazilian currency format
8. THE order details page SHALL include "Voltar para Pedidos" button
9. THE order details page SHALL fetch data using order_id from URL params
10. WHEN order is not found, THE order details page SHALL display 404 error

### Requirement 15: Notification Preferences Storage

**User Story:** Como administrador, quero configurar preferências de notificação, para que eu controle como sou alertado.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide settings section for notification preferences
2. THE settings SHALL include toggle for Toast_Notification (default: enabled)
3. THE settings SHALL include toggle for Browser_Notification (default: enabled)
4. THE settings SHALL include toggle for Notification_Sound (default: enabled)
5. THE settings SHALL store preferences in localStorage
6. THE settings SHALL persist across browser sessions
7. THE settings SHALL be loaded on Admin_Panel mount
8. THE settings SHALL apply immediately when changed
9. THE settings SHALL display current Notification_Permission status
10. THE settings SHALL provide button to request Notification_Permission if denied

### Requirement 16: Webhook Retry Handling

**User Story:** Como sistema, preciso lidar com falhas de webhook graciosamente, para que Mercado Pago possa retentar entregas.

#### Acceptance Criteria

1. WHEN webhook processing encounters error, THE Webhook_Handler SHALL return 500 status
2. WHEN signature validation fails, THE Webhook_Handler SHALL return 401 status (no retry)
3. WHEN payment not found in database, THE Webhook_Handler SHALL return 404 status (no retry)
4. WHEN database update fails, THE Webhook_Handler SHALL return 500 status (triggers retry)
5. WHEN Mercado Pago API call fails, THE Webhook_Handler SHALL return 500 status (triggers retry)
6. THE Webhook_Handler SHALL handle up to 12 retry attempts over 48 hours
7. THE Webhook_Handler SHALL use Idempotency_Check to prevent duplicate processing
8. THE Webhook_Handler SHALL log all retry attempts with attempt number

### Requirement 17: Payment Method Display in Admin

**User Story:** Como administrador, quero ver método de pagamento usado, para que eu saiba como cliente pagou.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display payment_method for each order
2. THE system SHALL map 'credit_card' to "Cartão de Crédito"
3. THE system SHALL map 'debit_card' to "Cartão de Débito"
4. THE system SHALL map 'pix' to "PIX"
5. THE system SHALL map 'boleto' to "Boleto Bancário"
6. THE system SHALL map 'account_money' to "Saldo Mercado Pago"
7. THE system SHALL display payment method icon next to text
8. WHEN payment_method is NULL, THE system SHALL display "Não informado"

### Requirement 18: Order Search and Filter in Admin

**User Story:** Como administrador, quero buscar e filtrar pedidos, para que eu encontre rapidamente pedidos específicos.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide search input for order number or customer name
2. THE Admin_Panel SHALL provide filter dropdown for Order_Status
3. THE Admin_Panel SHALL provide date range filter for order creation date
4. THE search SHALL filter orders in real-time as user types
5. THE filters SHALL be combinable (search + status + date range)
6. THE Admin_Panel SHALL display count of filtered results
7. THE Admin_Panel SHALL persist filter state in URL query params
8. THE Admin_Panel SHALL clear filters with "Limpar Filtros" button
9. THE filtered list SHALL still receive Real_Time_Subscription updates

### Requirement 19: Webhook Health Check Endpoint

**User Story:** Como desenvolvedor, preciso verificar se webhook está funcionando, para que eu valide configuração.

#### Acceptance Criteria

1. THE system SHALL provide GET endpoint at `/api/webhooks/mercadopago/health`
2. THE health check SHALL return 200 OK with status: "healthy"
3. THE health check SHALL verify MERCADOPAGO_WEBHOOK_SECRET is configured
4. THE health check SHALL verify MERCADOPAGO_ACCESS_TOKEN is configured
5. THE health check SHALL NOT expose actual credential values
6. THE health check SHALL return configuration status (configured/missing)
7. THE health check SHALL be accessible without authentication
8. THE health check SHALL include timestamp in response

### Requirement 20: Admin Notification Center

**User Story:** Como administrador, quero ver histórico de notificações, para que eu revise alertas perdidos.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display notification center icon in header
2. THE notification center SHALL show list of recent notifications (last 50)
3. THE notification center SHALL display notification type, message, and timestamp
4. THE notification center SHALL mark notifications as read/unread
5. THE notification center SHALL display unread count badge on icon
6. THE notification center SHALL store notifications in localStorage
7. THE notification center SHALL clear old notifications after 7 days
8. THE notification center SHALL provide "Marcar todas como lidas" button
9. THE notification center SHALL provide "Limpar histórico" button
10. WHEN user clicks notification, THE system SHALL navigate to related order

### Requirement 21: Error Handling for Real-Time Subscriptions

**User Story:** Como sistema, preciso lidar com erros de conexão em tempo real, para que Admin_Panel continue funcionando.

#### Acceptance Criteria

1. WHEN Real_Time_Subscription connection fails, THE system SHALL log error
2. WHEN Real_Time_Subscription disconnects, THE system SHALL attempt reconnection
3. THE system SHALL retry connection up to 5 times with exponential backoff
4. WHEN all retries fail, THE system SHALL display error toast to admin
5. THE error toast SHALL include "Tentar Reconectar" button
6. WHEN user clicks "Tentar Reconectar", THE system SHALL restart subscription
7. THE system SHALL display connection status indicator in Admin_Panel
8. THE connection indicator SHALL show green for connected, red for disconnected
9. THE system SHALL NOT crash Admin_Panel when subscription fails
10. THE system SHALL fall back to manual refresh when real-time unavailable

### Requirement 22: Performance Optimization for Admin Panel

**User Story:** Como administrador, quero que painel carregue rapidamente, para que eu trabalhe eficientemente.

#### Acceptance Criteria

1. THE Admin_Panel SHALL load initial orders list within 2 seconds
2. THE Admin_Panel SHALL use pagination for orders list (20 orders per page)
3. THE Admin_Panel SHALL implement virtual scrolling for large lists
4. THE Admin_Panel SHALL cache fetched orders in React Query
5. THE Admin_Panel SHALL use optimistic updates for status changes
6. THE Admin_Panel SHALL debounce search input (300ms delay)
7. THE Admin_Panel SHALL lazy load order details on demand
8. THE Admin_Panel SHALL use database indexes for fast queries
9. THE Admin_Panel SHALL display loading skeletons during data fetch
10. THE Admin_Panel SHALL minimize re-renders using React.memo

### Requirement 23: Mobile Responsiveness for Admin Panel

**User Story:** Como administrador em dispositivo móvel, quero usar painel admin, para que eu gerencie pedidos em qualquer lugar.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use responsive layout for mobile screens
2. THE orders list SHALL stack columns vertically on mobile
3. THE Admin_Panel SHALL use hamburger menu for navigation on mobile
4. THE notification center SHALL be accessible from mobile menu
5. THE order details page SHALL be scrollable on mobile
6. THE Admin_Panel SHALL use touch-friendly button sizes (min 44x44px)
7. THE Admin_Panel SHALL hide less important columns on mobile
8. THE Admin_Panel SHALL use bottom sheet for filters on mobile
9. THE Admin_Panel SHALL support swipe gestures for navigation
10. THE Admin_Panel SHALL test on iOS Safari and Android Chrome

### Requirement 24: Webhook Testing in Development

**User Story:** Como desenvolvedor, preciso testar webhooks localmente, para que eu valide implementação antes de produção.

#### Acceptance Criteria

1. THE system SHALL provide instructions for testing webhooks with ngrok
2. THE system SHALL accept webhooks from localhost in development mode
3. THE system SHALL log detailed webhook payloads in development
4. THE system SHALL provide sample webhook payload in documentation
5. THE system SHALL support manual webhook triggering via curl command
6. THE system SHALL validate webhook signature in development mode
7. THE system SHALL provide test credentials for Mercado Pago sandbox
8. THE system SHALL document test credit card numbers for sandbox
9. THE system SHALL provide troubleshooting guide for common webhook issues
10. THE system SHALL include webhook testing checklist in documentation

### Requirement 25: Security Best Practices for Webhooks

**User Story:** Como sistema, preciso seguir práticas de segurança, para que webhooks sejam processados com segurança.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL validate signature before processing any data
2. THE Webhook_Handler SHALL use HTTPS in production (required by Mercado Pago)
3. THE Webhook_Handler SHALL sanitize all input data before database operations
4. THE Webhook_Handler SHALL use parameterized queries to prevent SQL injection
5. THE Webhook_Handler SHALL rate limit webhook requests (max 100 per minute)
6. THE Webhook_Handler SHALL log suspicious webhook patterns
7. THE Webhook_Handler SHALL NOT expose internal error details in responses
8. THE Webhook_Handler SHALL use RPC_Function with SECURITY DEFINER for database updates
9. THE system SHALL rotate MERCADOPAGO_WEBHOOK_SECRET periodically
10. THE system SHALL monitor for webhook replay attacks

### Requirement 26: Admin Notification Delivery Guarantee

**User Story:** Como administrador, quero garantia de receber notificações, para que eu não perca pedidos importantes.

#### Acceptance Criteria

1. WHEN Real_Time_Subscription fails, THE system SHALL fall back to polling (every 30 seconds)
2. WHEN Browser_Notification fails, THE system SHALL show Toast_Notification
3. WHEN Toast_Notification fails, THE system SHALL log error and continue
4. THE system SHALL queue notifications during connection loss
5. WHEN connection restored, THE system SHALL deliver queued notifications
6. THE system SHALL NOT duplicate notifications after reconnection
7. THE system SHALL persist critical notifications in localStorage
8. THE system SHALL display notification delivery status in Admin_Panel
9. THE system SHALL provide manual refresh button for orders list
10. THE system SHALL alert admin if notifications are failing consistently

### Requirement 27: Order Status Transition Validation

**User Story:** Como sistema, preciso validar transições de status, para que pedidos sigam fluxo correto.

#### Acceptance Criteria

1. THE system SHALL allow transition from 'pending' to 'processing'
2. THE system SHALL allow transition from 'processing' to 'shipped'
3. THE system SHALL allow transition from 'shipped' to 'delivered'
4. THE system SHALL allow transition from any status to 'cancelled'
5. THE system SHALL prevent transition from 'delivered' to 'processing'
6. THE system SHALL prevent transition from 'cancelled' to 'processing'
7. THE system SHALL log invalid transition attempts
8. WHEN invalid transition attempted, THE system SHALL return error message
9. THE system SHALL enforce transition rules in RPC_Function
10. THE system SHALL display allowed transitions in Admin_Panel

### Requirement 28: Webhook Payload Validation

**User Story:** Como sistema, preciso validar payload de webhooks, para que dados malformados sejam rejeitados.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL validate webhook payload structure using Zod schema
2. THE Webhook_Handler SHALL require 'data' field with 'id' property
3. THE Webhook_Handler SHALL require 'type' field with value 'payment'
4. THE Webhook_Handler SHALL validate Payment_ID is non-empty string
5. WHEN payload validation fails, THE Webhook_Handler SHALL return 400 Bad Request
6. THE Webhook_Handler SHALL log validation errors with payload details
7. THE Webhook_Handler SHALL sanitize string fields to prevent XSS
8. THE Webhook_Handler SHALL validate numeric fields are valid numbers
9. THE Webhook_Handler SHALL reject payloads larger than 1MB
10. THE Webhook_Handler SHALL validate content-type is application/json

### Requirement 29: Admin Panel Accessibility

**User Story:** Como administrador com deficiência, quero usar painel admin acessível, para que eu gerencie pedidos independentemente.

#### Acceptance Criteria

1. THE Admin_Panel SHALL use semantic HTML elements (header, nav, main, section)
2. THE Admin_Panel SHALL provide ARIA labels for interactive elements
3. THE Admin_Panel SHALL support keyboard navigation (Tab, Enter, Escape)
4. THE Admin_Panel SHALL provide focus indicators for keyboard users
5. THE Admin_Panel SHALL use sufficient color contrast (WCAG AA)
6. THE Admin_Panel SHALL provide text alternatives for icons
7. THE Admin_Panel SHALL announce notifications to screen readers
8. THE Admin_Panel SHALL use proper heading hierarchy (h1, h2, h3)
9. THE Admin_Panel SHALL support browser zoom up to 200%
10. THE Admin_Panel SHALL test with screen readers (NVDA, JAWS)

### Requirement 30: Documentation and Onboarding

**User Story:** Como novo administrador, preciso de documentação clara, para que eu aprenda a usar sistema rapidamente.

#### Acceptance Criteria

1. THE system SHALL provide admin user guide in Portuguese
2. THE guide SHALL include screenshots of Admin_Panel features
3. THE guide SHALL explain how to view and manage orders
4. THE guide SHALL explain notification system and preferences
5. THE guide SHALL include troubleshooting section for common issues
6. THE guide SHALL document keyboard shortcuts for Admin_Panel
7. THE guide SHALL provide video tutorial for first-time users
8. THE guide SHALL include FAQ section with common questions
9. THE guide SHALL be accessible from Admin_Panel help menu
10. THE guide SHALL be kept up-to-date with feature changes
