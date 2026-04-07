# Requirements Document

## Introduction

Este documento especifica os requisitos para integração do Mercado Pago no sistema de checkout do e-commerce Agon MVP. A feature permite que clientes autenticados finalizem compras usando múltiplos métodos de pagamento (cartão de crédito, PIX, boleto) através da plataforma Mercado Pago. O sistema cria preferências de pagamento, processa webhooks para atualizar status de pedidos, e mantém rastreamento completo de transações.

Esta implementação substitui o método "Pagamento na Entrega" por integração real de pagamento online, mantendo a estrutura de pedidos existente e adicionando tabela de pagamentos para rastreamento de transações.

## Glossary

- **Mercado_Pago_SDK**: Biblioteca oficial do Mercado Pago para Node.js usada para criar preferências e consultar pagamentos
- **Payment_Preference**: Objeto do Mercado Pago contendo informações do pedido, itens, valores e URLs de retorno
- **Preference_ID**: Identificador único da preferência de pagamento gerado pelo Mercado Pago
- **Payment_ID**: Identificador único do pagamento processado pelo Mercado Pago
- **Webhook**: Notificação HTTP POST enviada pelo Mercado Pago quando status de pagamento muda
- **Webhook_Signature**: Assinatura HMAC-SHA256 enviada no header x-signature para validar autenticidade do webhook
- **Payments_Table**: Tabela Supabase armazenando transações com colunas: id, order_id, mercadopago_payment_id, mercadopago_preference_id, status, payment_method, amount, created_at, updated_at
- **Payment_Status**: Estado do pagamento (pending, approved, rejected, cancelled, refunded, in_process)
- **Payment_Method**: Método de pagamento usado (credit_card, debit_card, pix, boleto, account_money)
- **Checkout_Pro**: Solução de checkout do Mercado Pago que redireciona usuário para página de pagamento
- **Access_Token**: Credencial privada do Mercado Pago armazenada em variável de ambiente
- **Public_Key**: Credencial pública do Mercado Pago (não usada em Checkout Pro server-side)
- **Webhook_Secret**: Chave secreta usada para validar assinatura de webhooks
- **Idempotency_Key**: Chave única para prevenir processamento duplicado de webhooks
- **Price_Snapshot**: Preço do produto capturado no momento da criação do pedido (já existente)
- **Order_Transaction**: Operação atômica de criação de pedido, itens e registro de pagamento inicial
- **Payment_Notification**: Notificação do Mercado Pago sobre mudança de status (via webhook)
- **ViaCEP_API**: API brasileira para consulta de endereços por CEP
- **CEP_Format**: Formato brasileiro de código postal (XXXXX-XXX)
- **Brazilian_States**: Códigos de estados brasileiros (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)
- **Brazilian_Phone**: Formato de telefone brasileiro ((XX) XXXXX-XXXX ou (XX) XXXX-XXXX)
- **Brazilian_Currency**: Formato monetário brasileiro (R$ X.XXX,XX)
- **Checkout_Page**: Página em `/checkout` com formulário de entrega e resumo do carrinho
- **Payment_Page**: Página do Mercado Pago para onde usuário é redirecionado para pagar
- **Success_Page**: Página em `/pedido/confirmado` exibindo detalhes do pedido após pagamento
- **Pending_Page**: Página em `/pedido/pendente` exibindo status de pagamento pendente
- **Failure_Page**: Página em `/pedido/falha` exibindo erro no pagamento
- **Webhook_Endpoint**: Rota `/api/webhooks/mercadopago` que recebe notificações do Mercado Pago
- **RLS_Policy**: Row Level Security garantindo que usuários vejam apenas seus próprios pedidos e pagamentos

## Requirements

### Requirement 1: Payments Database Schema

**User Story:** Como sistema, preciso de uma tabela de pagamentos estruturada, para que transações do Mercado Pago sejam rastreadas corretamente.

#### Acceptance Criteria

1. THE Payments_Table SHALL have column `id` (UUID, primary key, auto-generated)
2. THE Payments_Table SHALL have column `order_id` (UUID, FOREIGN KEY to orders.id ON DELETE RESTRICT, NOT NULL, UNIQUE)
3. THE Payments_Table SHALL have column `mercadopago_payment_id` (TEXT, NULL, indexed for webhook lookups)
4. THE Payments_Table SHALL have column `mercadopago_preference_id` (TEXT, NOT NULL, indexed)
5. THE Payments_Table SHALL have column `status` (TEXT, NOT NULL, DEFAULT 'pending', CHECK status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'))
6. THE Payments_Table SHALL have column `payment_method` (TEXT, NULL)
7. THE Payments_Table SHALL have column `amount` (DECIMAL(10,2), NOT NULL, CHECK amount >= 0)
8. THE Payments_Table SHALL have column `created_at` (TIMESTAMPTZ, DEFAULT NOW())
9. THE Payments_Table SHALL have column `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
10. THE Payments_Table SHALL have an index on `mercadopago_payment_id` for efficient webhook processing
11. THE Payments_Table SHALL have an index on `mercadopago_preference_id` for preference lookups
12. THE Payments_Table SHALL have an index on `order_id` for order-payment relationship queries
13. THE Payments_Table SHALL have a trigger to update `updated_at` on row modification

### Requirement 2: Row Level Security for Payments

**User Story:** Como usuário, quero ter certeza de que apenas eu posso ver meus pagamentos, para que minha privacidade financeira seja protegida.

#### Acceptance Criteria

1. THE Payments_Table SHALL have RLS_Policy allowing SELECT only WHERE order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
2. THE Payments_Table SHALL have RLS_Policy allowing INSERT only WHERE order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
3. THE Payments_Table SHALL have RLS_Policy allowing UPDATE only WHERE user has role 'admin' OR order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
4. THE Payments_Table SHALL have RLS_Policy allowing DELETE only WHERE user has role 'admin'

### Requirement 3: Mercado Pago SDK Configuration

**User Story:** Como sistema, preciso configurar o SDK do Mercado Pago, para que eu possa criar preferências e consultar pagamentos.

#### Acceptance Criteria

1. THE system SHALL install mercadopago npm package (version ^2.0.0 or later)
2. THE system SHALL read Access_Token from environment variable `MERCADOPAGO_ACCESS_TOKEN`
3. THE system SHALL read Webhook_Secret from environment variable `MERCADOPAGO_WEBHOOK_SECRET`
4. THE system SHALL initialize Mercado_Pago_SDK with Access_Token in server-side code only
5. THE system SHALL NEVER expose Access_Token in client-side code or API responses
6. WHEN Access_Token is missing, THE system SHALL throw configuration error on server startup
7. THE system SHALL validate Access_Token format (starts with APP_USR-)

### Requirement 4: Payment Preference Creation

**User Story:** Como sistema, preciso criar preferências de pagamento no Mercado Pago, para que usuários possam pagar seus pedidos.

#### Acceptance Criteria

1. WHEN user submits checkout form, THE system SHALL create Payment_Preference using Mercado_Pago_SDK
2. THE Payment_Preference SHALL include `items` array with: title (product_name), quantity, unit_price (product_price), currency_id ('BRL')
3. THE Payment_Preference SHALL include `payer` object with: email (shipping_email), name (shipping_name), phone (shipping_phone)
4. THE Payment_Preference SHALL include `back_urls` object with: success ('/pedido/confirmado'), failure ('/pedido/falha'), pending ('/pedido/pendente')
5. THE Payment_Preference SHALL include `auto_return` set to 'approved'
6. THE Payment_Preference SHALL include `external_reference` set to order_id (UUID)
7. THE Payment_Preference SHALL include `notification_url` set to webhook endpoint URL
8. THE Payment_Preference SHALL include `statement_descriptor` set to 'AGON MVP'
9. THE Payment_Preference SHALL include `payment_methods` with excluded_payment_types empty (allow all methods)
10. WHEN preference creation succeeds, THE system SHALL store Preference_ID in Payments_Table
11. WHEN preference creation fails, THE system SHALL rollback order creation and display error to user

### Requirement 5: Checkout Flow with Mercado Pago

**User Story:** Como cliente, quero ser redirecionado para página de pagamento do Mercado Pago, para que eu possa escolher meu método de pagamento preferido.

#### Acceptance Criteria

1. WHEN user submits checkout form with valid data, THE system SHALL execute Order_Transaction atomically
2. THE Order_Transaction SHALL include: validate stock, create order record, create order_items records, create payment record with status 'pending', create Payment_Preference, clear cart
3. WHEN Order_Transaction succeeds, THE system SHALL redirect user to Mercado Pago Payment_Page using init_point URL from preference
4. THE Payment_Page SHALL display payment options: cartão de crédito, cartão de débito, PIX, boleto
5. WHEN user completes payment on Payment_Page, THE Mercado Pago SHALL redirect to appropriate back_url
6. WHEN user cancels payment, THE order SHALL remain with status 'pending' and payment status 'pending'
7. THE system SHALL NOT clear cart until payment is approved (handled by webhook)

### Requirement 6: Webhook Endpoint Implementation

**User Story:** Como sistema, preciso receber notificações do Mercado Pago, para que eu atualize status de pedidos automaticamente.

#### Acceptance Criteria

1. THE system SHALL implement Webhook_Endpoint at `/api/webhooks/mercadopago`
2. THE Webhook_Endpoint SHALL accept POST requests only
3. THE Webhook_Endpoint SHALL validate webhook signature using Webhook_Secret
4. THE Webhook_Endpoint SHALL extract Payment_ID from request body (`data.id`)
5. THE Webhook_Endpoint SHALL extract topic from request body (should be 'payment')
6. WHEN topic is not 'payment', THE Webhook_Endpoint SHALL return 200 OK and ignore notification
7. WHEN signature validation fails, THE Webhook_Endpoint SHALL return 401 Unauthorized
8. WHEN signature validation succeeds, THE Webhook_Endpoint SHALL proceed to process payment update
9. THE Webhook_Endpoint SHALL return 200 OK within 5 seconds to prevent Mercado Pago retries

### Requirement 7: Webhook Signature Validation

**User Story:** Como sistema, preciso validar assinaturas de webhooks, para que apenas notificações legítimas do Mercado Pago sejam processadas.

#### Acceptance Criteria

1. THE system SHALL extract `x-signature` header from webhook request
2. THE system SHALL extract `x-request-id` header from webhook request
3. THE system SHALL parse x-signature to extract `ts` (timestamp) and `v1` (signature hash)
4. THE system SHALL construct manifest string as: `id:{data.id};request-id:{x-request-id};ts:{ts};`
5. THE system SHALL compute HMAC-SHA256 hash of manifest using Webhook_Secret
6. THE system SHALL compare computed hash with v1 signature
7. WHEN hashes match, THE system SHALL consider webhook authentic
8. WHEN hashes do not match, THE system SHALL reject webhook with 401 status
9. THE system SHALL log signature validation failures for security monitoring

### Requirement 8: Payment Status Update Processing

**User Story:** Como sistema, preciso atualizar status de pagamentos e pedidos, para que clientes vejam informações corretas sobre suas compras.

#### Acceptance Criteria

1. WHEN webhook is validated, THE system SHALL fetch payment details from Mercado Pago API using Payment_ID
2. THE system SHALL extract `status` from payment details (pending, approved, rejected, cancelled, refunded, in_process)
3. THE system SHALL extract `payment_method_id` from payment details
4. THE system SHALL extract `external_reference` (order_id) from payment details
5. THE system SHALL update Payments_Table record matching mercadopago_payment_id with new status and payment_method
6. WHEN payment status is 'approved', THE system SHALL update orders.status to 'processing'
7. WHEN payment status is 'rejected' or 'cancelled', THE system SHALL update orders.status to 'cancelled'
8. WHEN payment status is 'pending' or 'in_process', THE system SHALL keep orders.status as 'pending'
9. WHEN payment status is 'refunded', THE system SHALL update orders.status to 'cancelled'
10. THE system SHALL update both payments and orders tables in a single transaction
11. WHEN payment is not found in database, THE system SHALL log warning and return 200 OK

### Requirement 9: Idempotent Webhook Processing

**User Story:** Como sistema, preciso processar webhooks de forma idempotente, para que notificações duplicadas não causem inconsistências.

#### Acceptance Criteria

1. THE system SHALL check if Payment_ID already exists in Payments_Table before processing
2. WHEN Payment_ID exists and status is already 'approved', THE system SHALL skip update and return 200 OK
3. WHEN Payment_ID exists and new status is different, THE system SHALL update status
4. THE system SHALL use database transaction isolation to prevent race conditions
5. THE system SHALL handle concurrent webhook deliveries gracefully
6. THE system SHALL log all webhook processing attempts with Payment_ID and status

### Requirement 10: Cart Clearing After Payment Approval

**User Story:** Como cliente, quero que meu carrinho seja limpo após pagamento aprovado, para que eu possa começar uma nova compra.

#### Acceptance Criteria

1. WHEN payment status changes to 'approved', THE system SHALL delete all cart_items for the user
2. THE cart clearing SHALL happen in webhook processing, not in checkout flow
3. WHEN cart clearing fails, THE system SHALL log error but NOT rollback payment status update
4. THE system SHALL NOT clear cart for pending, rejected, or cancelled payments

### Requirement 11: Success Page with Payment Details

**User Story:** Como cliente, quero ver confirmação do meu pedido após pagamento aprovado, para que eu tenha certeza de que a compra foi processada.

#### Acceptance Criteria

1. WHEN Mercado Pago redirects to Success_Page, THE system SHALL extract `payment_id` from query params
2. THE Success_Page SHALL fetch payment details from Payments_Table using mercadopago_payment_id
3. THE Success_Page SHALL fetch order details from orders table using order_id from payment
4. THE Success_Page SHALL display order number (first 8 chars of order_id)
5. THE Success_Page SHALL display payment status badge (Aprovado, Pendente, Rejeitado)
6. THE Success_Page SHALL display payment method used
7. THE Success_Page SHALL display order total amount in Brazilian_Currency format
8. THE Success_Page SHALL display shipping information
9. THE Success_Page SHALL display list of order items with: product name, quantity, size, price, subtotal
10. THE Success_Page SHALL display order creation date
11. THE Success_Page SHALL display success message: "Pagamento aprovado! Seu pedido está sendo processado."
12. THE Success_Page SHALL display "Continuar Comprando" button linking to `/products`
13. WHEN payment_id is invalid or not found, THE Success_Page SHALL display 404 error

### Requirement 12: Pending Payment Page

**User Story:** Como cliente, quero ver status de pagamento pendente, para que eu saiba que meu pedido está aguardando confirmação.

#### Acceptance Criteria

1. WHEN Mercado Pago redirects to Pending_Page, THE system SHALL extract `payment_id` from query params
2. THE Pending_Page SHALL fetch payment and order details
3. THE Pending_Page SHALL display pending status message based on payment_method
4. WHEN payment_method is 'pix', THE Pending_Page SHALL display: "Aguardando pagamento do PIX. Você receberá confirmação por email."
5. WHEN payment_method is 'boleto', THE Pending_Page SHALL display: "Boleto gerado. Pague até a data de vencimento para confirmar seu pedido."
6. WHEN payment_method is other, THE Pending_Page SHALL display: "Seu pagamento está sendo processado. Você receberá confirmação em breve."
7. THE Pending_Page SHALL display order number and total amount
8. THE Pending_Page SHALL display "Voltar para Produtos" button

### Requirement 13: Payment Failure Page

**User Story:** Como cliente, quero ver mensagem clara quando pagamento falha, para que eu saiba como proceder.

#### Acceptance Criteria

1. WHEN Mercado Pago redirects to Failure_Page, THE system SHALL extract `payment_id` from query params
2. THE Failure_Page SHALL display error message: "Não foi possível processar seu pagamento."
3. THE Failure_Page SHALL display possible reasons: cartão recusado, saldo insuficiente, dados incorretos
4. THE Failure_Page SHALL display "Tentar Novamente" button that redirects to `/checkout`
5. THE Failure_Page SHALL display "Voltar ao Carrinho" button
6. THE Failure_Page SHALL NOT delete the order (order remains with status 'pending')

### Requirement 14: Shipping Information Form with ViaCEP Integration

**User Story:** Como cliente, quero que meu endereço seja preenchido automaticamente ao digitar o CEP, para que eu economize tempo no checkout.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display shipping information form with fields: shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone, shipping_email
2. THE form SHALL include CEP field with mask XXXXX-XXX
3. WHEN user types valid CEP (8 digits), THE system SHALL call ViaCEP_API at `https://viacep.com.br/ws/{cep}/json/`
4. WHEN ViaCEP_API returns success, THE system SHALL auto-fill: shipping_address (logradouro), shipping_city (localidade), shipping_state (uf), neighborhood (bairro)
5. WHEN ViaCEP_API returns error or CEP not found, THE system SHALL display message: "CEP não encontrado. Preencha manualmente."
6. THE system SHALL allow manual editing of auto-filled fields
7. THE form SHALL validate shipping_zip matches CEP_Format (XXXXX-XXX)
8. THE form SHALL validate shipping_state matches Brazilian_States codes
9. THE form SHALL validate shipping_phone matches Brazilian_Phone format
10. THE form SHALL validate shipping_email is valid email format
11. THE form SHALL display validation errors inline below each field

### Requirement 15: Brazilian Format Validation

**User Story:** Como sistema, preciso validar formatos brasileiros, para que dados de entrega sejam consistentes e corretos.

#### Acceptance Criteria

1. THE system SHALL validate CEP format as XXXXX-XXX (5 digits, hyphen, 3 digits)
2. THE system SHALL validate phone format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
3. THE system SHALL validate state codes against Brazilian_States list
4. THE system SHALL format currency as R$ X.XXX,XX (Brazilian_Currency)
5. THE system SHALL accept only numeric input for CEP (auto-format with hyphen)
6. THE system SHALL accept only numeric input for phone (auto-format with parentheses and hyphen)
7. WHEN validation fails, THE system SHALL display specific error messages in Portuguese

### Requirement 16: Atomic Order Creation with Payment Record

**User Story:** Como sistema, preciso criar pedidos e registros de pagamento atomicamente, para que falhas parciais não deixem dados inconsistentes.

#### Acceptance Criteria

1. THE system SHALL execute order creation as a single Order_Transaction
2. THE Order_Transaction SHALL include: validate stock, insert into orders table, insert into order_items table, insert into payments table with status 'pending', create Payment_Preference, store preference_id in payments table
3. IF any step in Order_Transaction fails, THEN THE system SHALL rollback all changes
4. WHEN Order_Transaction fails, THE system SHALL display error message to user
5. WHEN Order_Transaction succeeds, THE system SHALL commit all changes and redirect to Payment_Page
6. THE system SHALL use Supabase RPC function or database transaction for atomicity
7. THE Order_Transaction SHALL complete within 10 seconds or timeout with error

### Requirement 17: Error Handling and User Feedback

**User Story:** Como cliente, quero feedback claro quando algo der errado, para que eu saiba como resolver o problema.

#### Acceptance Criteria

1. WHEN stock validation fails, THE system SHALL display error toast: "Produto [product_name] não tem estoque suficiente (disponível: X)"
2. WHEN Order_Transaction fails, THE system SHALL display error toast: "Erro ao processar pedido. Tente novamente."
3. WHEN Payment_Preference creation fails, THE system SHALL display error toast: "Erro ao conectar com Mercado Pago. Tente novamente."
4. WHEN network error occurs, THE system SHALL display error toast: "Erro de conexão. Verifique sua internet."
5. WHEN form validation fails, THE system SHALL display inline errors below each invalid field
6. THE system SHALL disable submit button during order processing
7. THE system SHALL display loading spinner on submit button with text "Processando..."
8. THE system SHALL log all errors to console with context (order_id, user_id, error message)

### Requirement 18: Webhook Error Handling and Retry Logic

**User Story:** Como sistema, preciso lidar com erros em webhooks graciosamente, para que o Mercado Pago possa retentar entregas.

#### Acceptance Criteria

1. WHEN webhook processing encounters error, THE system SHALL return 500 status to trigger Mercado Pago retry
2. WHEN webhook signature validation fails, THE system SHALL return 401 status (no retry)
3. WHEN payment is not found in Mercado Pago API, THE system SHALL return 404 status (no retry)
4. WHEN database update fails, THE system SHALL return 500 status (retry)
5. THE system SHALL log all webhook errors with Payment_ID and error details
6. THE system SHALL handle Mercado Pago retry attempts (up to 12 retries over 48 hours)
7. THE system SHALL use idempotency to prevent duplicate processing on retries

### Requirement 19: Payment Method Display

**User Story:** Como cliente, quero ver quais métodos de pagamento estão disponíveis, para que eu saiba minhas opções antes de prosseguir.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display payment methods section
2. THE payment methods section SHALL display icons and labels for: Cartão de Crédito, Cartão de Débito, PIX, Boleto
3. THE payment methods section SHALL display text: "Você será redirecionado para o Mercado Pago para finalizar o pagamento"
4. THE payment methods section SHALL display Mercado Pago logo
5. THE payment methods section SHALL display security badge: "Pagamento 100% seguro"

### Requirement 20: Environment Variables Documentation

**User Story:** Como desenvolvedor, preciso saber quais variáveis de ambiente configurar, para que a integração funcione corretamente.

#### Acceptance Criteria

1. THE system SHALL document required environment variables in `.env.example`
2. THE `.env.example` SHALL include `MERCADOPAGO_ACCESS_TOKEN` with description
3. THE `.env.example` SHALL include `MERCADOPAGO_WEBHOOK_SECRET` with description
4. THE `.env.example` SHALL include `NEXT_PUBLIC_APP_URL` for webhook URL construction
5. THE system SHALL provide instructions for obtaining credentials from Mercado Pago dashboard
6. THE system SHALL warn developers to NEVER commit actual credentials to git

### Requirement 21: Webhook URL Configuration

**User Story:** Como sistema, preciso configurar URL de webhook corretamente, para que o Mercado Pago envie notificações para o endpoint certo.

#### Acceptance Criteria

1. THE system SHALL construct webhook URL as `{NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
2. THE webhook URL SHALL be publicly accessible (not localhost)
3. THE system SHALL use HTTPS in production (required by Mercado Pago)
4. THE system SHALL accept HTTP in development for testing
5. THE system SHALL validate webhook URL format before creating Payment_Preference
6. WHEN NEXT_PUBLIC_APP_URL is not set, THE system SHALL throw configuration error

### Requirement 22: Payment Status Synchronization

**User Story:** Como sistema, preciso sincronizar status de pagamentos, para que dados locais reflitam estado atual no Mercado Pago.

#### Acceptance Criteria

1. THE system SHALL store mercadopago_payment_id in Payments_Table when webhook is first received
2. THE system SHALL update payment status based on webhook notifications
3. THE system SHALL handle status transitions: pending → approved, pending → rejected, approved → refunded
4. THE system SHALL NOT allow invalid status transitions (e.g., approved → pending)
5. THE system SHALL log all status changes with timestamp and previous status
6. THE system SHALL update orders.status to match payment status (approved → processing, rejected → cancelled)

### Requirement 23: Order Status Consistency

**User Story:** Como sistema, preciso manter consistência entre status de pedidos e pagamentos, para que dados sejam confiáveis.

#### Acceptance Criteria

1. WHEN payment status is 'approved', THE orders.status SHALL be 'processing'
2. WHEN payment status is 'rejected' or 'cancelled', THE orders.status SHALL be 'cancelled'
3. WHEN payment status is 'pending' or 'in_process', THE orders.status SHALL be 'pending'
4. THE system SHALL update both tables in a single transaction
5. THE system SHALL prevent manual order status changes that conflict with payment status (enforced by RLS or trigger)

### Requirement 24: Checkout Page Responsiveness

**User Story:** Como cliente em qualquer dispositivo, quero que a página de checkout seja responsiva, para que eu possa finalizar compras no celular ou desktop.

#### Acceptance Criteria

1. THE Checkout_Page SHALL use two-column layout on desktop: cart summary (left), shipping form (right)
2. THE Checkout_Page SHALL stack cart summary above shipping form on mobile
3. THE Checkout_Page SHALL make cart summary sticky on desktop while scrolling
4. THE Checkout_Page SHALL display "Finalizar Pedido" button at bottom of form
5. THE Checkout_Page SHALL be scrollable on small screens
6. THE cart summary SHALL be collapsible on mobile to save space
7. THE form fields SHALL be full-width on mobile, optimized width on desktop
8. THE payment methods section SHALL display icons in grid on mobile, row on desktop

### Requirement 25: Security Best Practices

**User Story:** Como sistema, preciso seguir práticas de segurança, para que dados de pagamento e credenciais sejam protegidos.

#### Acceptance Criteria

1. THE system SHALL store Access_Token only in server-side environment variables
2. THE system SHALL NEVER expose Access_Token in client-side code, API responses, or logs
3. THE system SHALL validate webhook signatures before processing any payment updates
4. THE system SHALL use HTTPS for all Mercado Pago API calls in production
5. THE system SHALL sanitize all user inputs before storing in database
6. THE system SHALL use RLS_Policy to prevent users from accessing other users' payment data
7. THE system SHALL log security events (failed signature validations, unauthorized access attempts)
8. THE system SHALL NOT log sensitive data (Access_Token, full credit card numbers, CVV)

### Requirement 26: Testing Considerations

**User Story:** Como desenvolvedor, preciso testar a integração, para que eu garanta funcionamento correto antes de produção.

#### Acceptance Criteria

1. THE system SHALL support Mercado Pago sandbox mode using test credentials
2. THE system SHALL document test credit card numbers for sandbox testing
3. THE system SHALL provide instructions for testing webhook locally using ngrok or similar
4. THE system SHALL log webhook payloads in development mode for debugging
5. THE system SHALL provide manual testing checklist covering: successful payment, failed payment, pending payment, webhook processing, idempotency

### Requirement 27: Performance Requirements

**User Story:** Como cliente, quero que o checkout seja rápido, para que eu não espere muito para finalizar a compra.

#### Acceptance Criteria

1. THE Checkout_Page SHALL load cart summary within 1 second
2. THE Checkout_Page SHALL render form fields within 500ms
3. THE ViaCEP_API call SHALL complete within 2 seconds or timeout
4. THE Order_Transaction SHALL complete within 10 seconds under normal conditions
5. THE Payment_Preference creation SHALL complete within 5 seconds
6. THE Webhook_Endpoint SHALL process notifications within 5 seconds
7. THE system SHALL use database indexes on mercadopago_payment_id and order_id for fast queries

### Requirement 28: Logging and Monitoring

**User Story:** Como desenvolvedor, preciso de logs detalhados, para que eu possa debugar problemas e monitorar integrações.

#### Acceptance Criteria

1. THE system SHALL log all Payment_Preference creations with order_id and preference_id
2. THE system SHALL log all webhook receptions with Payment_ID, status, and timestamp
3. THE system SHALL log all payment status updates with old and new status
4. THE system SHALL log all errors with stack traces and context
5. THE system SHALL log webhook signature validation failures with request details
6. THE system SHALL NOT log sensitive data (Access_Token, full payment details)
7. THE system SHALL use structured logging format (JSON) for easy parsing

### Requirement 29: Migration from Cash on Delivery

**User Story:** Como sistema, preciso migrar do método "Pagamento na Entrega" para Mercado Pago, para que a transição seja suave.

#### Acceptance Criteria

1. THE system SHALL update orders.payment_method CHECK constraint to include Mercado Pago methods
2. THE system SHALL keep existing 'cash_on_delivery' orders functional
3. THE system SHALL remove "Pagamento na Entrega" option from checkout UI
4. THE system SHALL display only Mercado Pago payment option in checkout
5. THE system SHALL maintain backward compatibility with existing order data

### Requirement 30: Preference Expiration Handling

**User Story:** Como sistema, preciso lidar com preferências expiradas, para que usuários possam retentar pagamentos.

#### Acceptance Criteria

1. THE Payment_Preference SHALL have default expiration of 30 days (Mercado Pago default)
2. WHEN user returns to expired preference, THE system SHALL display message: "Link de pagamento expirado. Crie um novo pedido."
3. THE system SHALL allow users to create new orders even if previous order is pending
4. THE system SHALL NOT automatically cancel orders with expired preferences
5. THE system SHALL document manual process for handling abandoned orders (admin feature, out of scope for MVP)
