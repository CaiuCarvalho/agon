# Requirements Document - Admin Panel MVP

## Introduction

Este documento especifica os requisitos para o Admin Panel MVP (Minimum Viable Product) do e-commerce Agon. O painel administrativo fornecerá funcionalidades essenciais para operação real do negócio, incluindo gestão de produtos, visualização de pedidos, controle de envio (fulfillment) e dashboard com métricas reais.

O sistema prioriza segurança máxima, garantindo que apenas administradores autorizados possam acessar a área administrativa, com validação em múltiplas camadas (backend, frontend e banco de dados).

## Source of Truth

**CRITICAL DEFINITIONS:**

1. **Orders Source of Truth**: Orders are stored in the database as the single source of truth. Mercado Pago is used only as payment status provider via webhook.

2. **Payment Synchronization**: Payment status updates flow through webhook: `Mercado Pago → webhook → backend → update payments.status → update orders.status`. The system does NOT poll Mercado Pago. Webhook MUST be idempotent (duplicate webhooks must not cause duplicate updates or state corruption).

3. **Order Status Derivation Rule (CRITICAL)**: Application MUST NEVER derive `orders.status` outside the database. The ONLY valid derivation paths are:
   - **Trigger path**: `update_order_status_on_shipping_change()` trigger (automatic when shipping_status changes)
   - **RPC path**: `update_payment_from_webhook` RPC function calling `derive_order_status()` (explicit when payment status changes)
   - Frontend/services MUST read `orders.status` from database, NEVER compute it locally.

4. **Admin Identity**: Admin role is stored in `profiles.role = 'admin'`. Admin access is controlled by a hardcoded whitelist of 2 emails in environment variables (`ADMIN_EMAIL_PRIMARY` and `ADMIN_EMAIL_BACKUP`).

5. **Security Layers**: 
   - **Backend validation** = primary security (validates role + email whitelist on every admin API call)
   - **RLS policies** = last line of defense (database-level protection, returns empty result set if violated)
   - **Frontend guard** = UX layer only (redirects, does NOT provide security)

6. **Error Response Standard**: All API errors return structured format:
   ```typescript
   {
     code: string,        // e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR'
     message: string,     // Human-readable message
     details?: Record<string, string[]>  // Field-level errors (optional)
   }
   ```

7. **Order Status Semantics**: 
   - `orders.status` = derived summary status (pending, processing, shipped, delivered, cancelled)
   - `payments.status` = payment state from Mercado Pago (pending, approved, rejected, cancelled, refunded, in_process)
   - `orders.shipping_status` = fulfillment state (pending, processing, shipped, delivered)
   - **Rule**: `orders.status` is derived from `payments.status` + `orders.shipping_status` (e.g., if payment approved + shipping shipped → orders.status = 'shipped')

8. **Stock Management**: Stock is decremented when `payments.status` changes to 'approved' (handled by existing RPC function `update_payment_from_webhook`). Stock is NOT decremented on order creation or shipping.

9. **Carrier Definition**: Carrier is free text field (no enum in MVP). MUST NOT be empty when `shipping_status = 'shipped'`. Common values: "Correios", "Jadlog", "Total Express", but admin can enter any value.

10. **Webhook Idempotency**: Webhook handler MUST check if `payments.status` already matches incoming status before updating. If status unchanged, return 200 with `{received: true, skipped: true}` without database update.

11. **RPC Atomicity (CRITICAL)**: The `update_payment_from_webhook` RPC function MUST execute all operations atomically within a single database transaction:
    - Update `payments.status`
    - Update `orders.status` via `derive_order_status()`
    - Clear cart (if payment approved)
    - All operations MUST succeed or fail together (automatic rollback on error)

12. **Logging Standard**: All logs MUST include:
    - `timestamp` (ISO 8601 format)
    - `user_email` (if authenticated)
    - `endpoint` (API route)
    - `action` (e.g., 'admin_access_denied', 'validation_failed')
    - `error` (if applicable)

## Data Model

**Core Entities (existing schema):**

- **Order**: `id`, `user_id`, `status`, `total_amount`, `shipping_*`, `payment_method`, `created_at`, `updated_at`
- **Order_Item**: `id`, `order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `size`, `subtotal`
- **Payment**: `id`, `order_id`, `mercadopago_payment_id`, `mercadopago_preference_id`, `status`, `payment_method`, `amount`, `created_at`, `updated_at`
- **Product**: `id`, `name`, `description`, `price`, `stock`, `category`, `sizes`, `images`, `deleted_at`, `created_at`, `updated_at`

**New Fields Required:**

- **Order**: Add `shipping_status` (enum: 'pending', 'processing', 'shipped', 'delivered'), `tracking_code` (text, nullable), `carrier` (text, nullable), `shipped_at` (timestamptz, nullable)

**Status Relationships:**

- `orders.status` is derived from `payments.status` + `orders.shipping_status`:
  - If `payments.status = 'pending'` → `orders.status = 'pending'`
  - If `payments.status = 'approved'` AND `shipping_status = 'pending'` → `orders.status = 'processing'`
  - If `payments.status = 'approved'` AND `shipping_status = 'shipped'` → `orders.status = 'shipped'`
  - If `payments.status = 'approved'` AND `shipping_status = 'delivered'` → `orders.status = 'delivered'`
  - If `payments.status IN ('rejected', 'cancelled', 'refunded')` → `orders.status = 'cancelled'`

## Glossary

- **Admin_Panel**: Interface web administrativa acessível via rota /admin
- **Admin_User**: Usuário com role='admin' e email na whitelist de administradores
- **Dashboard**: Página inicial do Admin_Panel exibindo métricas e resumos
- **Product_Manager**: Módulo de gestão de produtos (CRUD)
- **Order_Viewer**: Módulo de visualização de pedidos
- **Fulfillment_Manager**: Módulo de gestão de envio e rastreamento
- **Payment_Status**: Status do pagamento (pending, approved, rejected, cancelled, refunded, in_process) - stored in payments.status, source: Mercado Pago via webhook
- **Shipping_Status**: Status do envio (pending, processing, shipped, delivered) - stored in orders.shipping_status, managed by admin
- **Order_Status**: Derived summary status (pending, processing, shipped, delivered, cancelled) - stored in orders.status, computed from Payment_Status + Shipping_Status
- **Tracking_Code**: Código de rastreamento fornecido pela transportadora (free text, required when shipping_status = 'shipped')
- **Carrier**: Transportadora responsável pelo envio (free text, required when shipping_status = 'shipped', examples: "Correios", "Jadlog", "Total Express")
- **RLS_Policy**: Row Level Security policy no Supabase (última linha de defesa, returns empty result set if violated)
- **Whitelist**: Lista de 2 emails autorizados (env vars: ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_BACKUP)
- **Backend_Validation**: Validação de permissões executada no servidor (camada principal de segurança)
- **Frontend_Guard**: Proteção de rotas no cliente (camada de UX apenas)
- **Webhook_Idempotency**: Garantia de que webhooks duplicados não causam atualizações duplicadas ou corrupção de estado

## Requirements

### Requirement 1: Segurança de Acesso ao Admin Panel

**User Story:** Como proprietário do e-commerce, eu quero que apenas administradores autorizados possam acessar o painel administrativo, para que dados sensíveis e operações críticas estejam protegidos contra acesso não autorizado.

#### Acceptance Criteria

1. THE System SHALL read admin whitelist from environment variables: ADMIN_EMAIL_PRIMARY and ADMIN_EMAIL_BACKUP
2. THE Admin_Panel SHALL be accessible only at route /admin and its sub-routes
3. WHEN a non-authenticated user attempts to access /admin, THE Frontend_Guard SHALL redirect to /login with redirect parameter
4. WHEN an authenticated user with role != 'admin' attempts to access /admin, THE Frontend_Guard SHALL redirect to home page with error toast
5. WHEN an authenticated user with email NOT in whitelist attempts to access /admin, THE Frontend_Guard SHALL redirect to home page with error toast
6. THE Backend_Validation SHALL verify both (role='admin' AND email in whitelist) on every admin API endpoint
7. WHEN an unauthorized API request is made to admin endpoints, THE Backend_Validation SHALL return 403 with structured error
8. THE RLS_Policy SHALL restrict admin-only database operations to users with role='admin' (last line of defense)
9. THE System SHALL NOT cache admin permissions (validate on every request)
10. THE Backend_Validation SHALL log all failed admin access attempts to console with timestamp and user email

### Requirement 2: Dashboard com Métricas Reais

**User Story:** Como administrador, eu quero visualizar métricas reais do negócio no dashboard, para que eu possa monitorar a performance e tomar decisões informadas.

#### Acceptance Criteria

1. THE Dashboard SHALL display total revenue by summing payments.amount WHERE payments.status = 'approved'
2. THE Dashboard SHALL display total number of orders with count by orders.status
3. THE Dashboard SHALL calculate and display average order value (total revenue / approved orders count)
4. THE Dashboard SHALL list the 10 most recent orders sorted by created_at DESC
5. THE Dashboard SHALL fetch metrics data on page load via single API endpoint /api/admin/dashboard
6. THE Dashboard SHALL display loading skeleton while fetching data
7. THE Dashboard SHALL display error message if data fetch fails
8. THE Dashboard SHALL format currency values in BRL (R$) with 2 decimal places using Intl.NumberFormat
9. THE Dashboard SHALL display dates in Brazilian format (DD/MM/YYYY HH:mm) using date-fns
10. THE Dashboard SHALL NOT display any mocked or placeholder data

### Requirement 3: Gestão de Produtos (CRUD)

**User Story:** Como administrador, eu quero criar, editar e gerenciar produtos no catálogo, para que eu possa manter o inventário atualizado.

#### Acceptance Criteria

1. THE Product_Manager SHALL display a paginated list of all products (20 per page) including soft-deleted products
2. WHEN admin clicks "Create Product", THE Product_Manager SHALL display a form with fields: name, description, price, stock, category, sizes (array), images (array)
3. THE Product_Manager SHALL validate all product fields on frontend using Zod schema before submission
4. WHEN admin submits valid product data, THE Backend_Validation SHALL validate using same Zod schema and create product record
5. THE Product_Manager SHALL allow editing of existing products with pre-filled form
6. THE Product_Manager SHALL allow toggling product active/inactive status via button
7. WHEN a product is deactivated, THE System SHALL set deleted_at = NOW() (soft delete)
8. WHEN a product is reactivated, THE System SHALL set deleted_at = NULL
9. THE Product_Manager SHALL display product stock levels and allow inline stock updates
10. THE Product_Manager SHALL display validation errors clearly below each field
11. THE Backend_Validation SHALL enforce constraints: price >= 0, stock >= 0, name not empty
12. THE Product_Manager SHALL show success toast on successful create/update/delete

### Requirement 4: Visualização de Pedidos

**User Story:** Como administrador, eu quero visualizar todos os pedidos realizados, para que eu possa acompanhar vendas e identificar pedidos que precisam de atenção.

#### Acceptance Criteria

1. THE Order_Viewer SHALL display a paginated list of all orders (20 per page) sorted by created_at DESC
2. THE Order_Viewer SHALL display columns: order ID, customer name, total amount, Payment_Status, Shipping_Status, created_at
3. WHEN admin clicks on an order row, THE Order_Viewer SHALL expand to show full order details inline
4. THE Order_Viewer SHALL display all order items with: product_name, quantity, size, product_price, subtotal
5. THE Order_Viewer SHALL display shipping address: name, address, city, state, zip, phone, email
6. THE Order_Viewer SHALL display Payment_Status from payments.status (source: database, updated by webhook)
7. THE Order_Viewer SHALL display payment_method from payments.payment_method
8. THE Order_Viewer SHALL allow filtering orders by Payment_Status via dropdown
9. THE Order_Viewer SHALL allow filtering orders by Shipping_Status via dropdown
10. THE Order_Viewer SHALL display created_at and updated_at timestamps in Brazilian format
11. THE Order_Viewer SHALL provide "Refresh" button to reload order list

### Requirement 5: Gestão de Envio (Fulfillment)

**User Story:** Como administrador, eu quero gerenciar o processo de envio dos pedidos, para que eu possa atualizar clientes sobre o status de entrega e fornecer códigos de rastreamento.

#### Acceptance Criteria

1. THE Fulfillment_Manager SHALL display Shipping_Status from orders.shipping_status (separate from payments.status)
2. THE Fulfillment_Manager SHALL display Shipping_Status with values: pending, processing, shipped, delivered
3. WHEN admin selects an order in Order_Viewer, THE Fulfillment_Manager SHALL display "Update Shipping" button
4. IF payments.status != 'approved', THEN THE Fulfillment_Manager SHALL disable "Mark as Shipped" button with tooltip explaining payment not approved
5. WHEN admin clicks "Mark as Shipped", THE Fulfillment_Manager SHALL show modal requiring Tracking_Code and Carrier inputs
6. WHEN admin submits shipping update, THE Backend_Validation SHALL validate: tracking_code not empty, carrier not empty
7. THE Backend_Validation SHALL prevent Shipping_Status regression: shipped cannot go back to pending/processing, delivered cannot go back to any previous status
8. WHEN Shipping_Status changes to 'shipped', THE System SHALL set orders.shipped_at = NOW()
9. THE Fulfillment_Manager SHALL display current Tracking_Code and Carrier if orders.shipping_status = 'shipped' or 'delivered'
10. THE Fulfillment_Manager SHALL allow editing Tracking_Code and Carrier for orders with shipping_status = 'shipped'
11. THE Backend_Validation SHALL enforce shipping status transition rules via API endpoint /api/admin/orders/[id]/shipping
12. THE System SHALL update orders.updated_at timestamp when Shipping_Status changes

### Requirement 6: Tipagem End-to-End

**User Story:** Como desenvolvedor, eu quero que todo o código seja completamente tipado, para que erros de tipo sejam detectados em tempo de desenvolvimento e o código seja mais confiável.

#### Acceptance Criteria

1. THE System SHALL use TypeScript for all frontend and backend code
2. THE System SHALL define Zod schemas for all data validation (products, orders, shipping updates)
3. THE System SHALL infer TypeScript types from Zod schemas using z.infer<typeof schema>
4. THE System SHALL NOT use 'any' type anywhere in the codebase
5. THE System SHALL define explicit types for all function parameters and return values
6. THE System SHALL define types for all database entities: Order, OrderItem, Payment, Product
7. THE System SHALL define types for all API request and response payloads
8. THE System SHALL use strict TypeScript configuration (strict: true in tsconfig.json)
9. THE System SHALL pass TypeScript compilation without errors or warnings
10. THE System SHALL use type guards for runtime type checking where necessary (e.g., checking payment status values)

### Requirement 7: Arquitetura em Camadas

**User Story:** Como desenvolvedor, eu quero que o código siga uma arquitetura clara em camadas, para que seja fácil de manter, testar e estender.

#### Acceptance Criteria

1. THE System SHALL organize code into layers: Database → Services → Hooks → UI
2. THE System SHALL implement all database operations in Service layer (e.g., adminService.ts)
3. THE System SHALL implement all business logic and validation in Service layer
4. THE System SHALL implement state management in Hooks layer (e.g., useAdminDashboard.ts)
5. THE System SHALL implement UI rendering in Components layer (e.g., DashboardPage.tsx)
6. THE Services SHALL be pure functions without UI dependencies (no toast, no router, no React)
7. THE Services SHALL return structured results: { success: boolean, data?: T, error?: Error }
8. THE Hooks SHALL manage loading, error, and success states
9. THE Components SHALL only handle rendering and user interaction
10. THE System SHALL ensure each layer has clear, single responsibility

### Requirement 8: Validação Backend Obrigatória

**User Story:** Como desenvolvedor de segurança, eu quero que todas as operações críticas sejam validadas no backend, para que o sistema não dependa de validações do frontend que podem ser contornadas.

#### Acceptance Criteria

1. THE Backend_Validation SHALL validate admin role on every admin API endpoint via middleware
2. THE Backend_Validation SHALL validate admin email against whitelist on every admin operation
3. THE Backend_Validation SHALL validate all input data using Zod schemas (same schemas as frontend)
4. THE Backend_Validation SHALL enforce business rules: no shipping without payment approved, no status regression
5. THE Backend_Validation SHALL return appropriate HTTP status codes: 400 (validation), 403 (forbidden), 404 (not found), 500 (server error)
6. THE Backend_Validation SHALL return structured error messages: { code, message, details }
7. THE Backend_Validation SHALL validate Shipping_Status transitions: pending → processing → shipped → delivered (no backwards)
8. THE Backend_Validation SHALL validate Tracking_Code presence when shipping_status = 'shipped'
9. THE RLS_Policy SHALL restrict admin-only database operations to users with role='admin' (last line of defense)
10. THE Backend_Validation SHALL log all validation failures to console with: timestamp, user email, endpoint, error

### Requirement 9: Webhook Robustez e Idempotência

**User Story:** Como desenvolvedor de sistema, eu quero que o webhook do Mercado Pago seja robusto e idempotente, para que pagamentos duplicados ou webhooks repetidos não corrompam o estado do sistema.

#### Acceptance Criteria

1. THE Webhook_Handler SHALL validate webhook signature using Mercado Pago's x-signature and x-request-id headers
2. THE Webhook_Handler SHALL reject webhooks with invalid signature returning 401 Unauthorized
3. THE Webhook_Handler SHALL check if payments.status already matches incoming status before updating
4. IF payments.status equals incoming status, THEN THE Webhook_Handler SHALL return 200 with {received: true, skipped: true} without database update
5. THE Webhook_Handler SHALL use existing RPC function update_payment_from_webhook which handles idempotency
6. THE Webhook_Handler SHALL log all webhook events to console with: timestamp, payment_id, old_status, new_status, action (updated/skipped)
7. THE Webhook_Handler SHALL return 500 on database errors so Mercado Pago retries
8. THE Webhook_Handler SHALL return 200 on successful processing so Mercado Pago stops retrying
9. THE Webhook_Handler SHALL handle duplicate webhooks gracefully without creating duplicate state
10. THE Webhook_Handler SHALL validate webhook origin by checking signature before processing any data

### Requirement 10: Performance e Otimização (MVP Scope)

**User Story:** Como administrador, eu quero que o painel administrativo seja rápido e responsivo, para que eu possa trabalhar eficientemente sem esperas desnecessárias.

#### Acceptance Criteria

1. THE System SHALL implement pagination for all list views: products (20/page), orders (20/page)
2. THE System SHALL use existing database indexes on: orders.created_at, orders.status, payments.status, products.deleted_at
3. THE System SHALL fetch orders with order_items in single query using JOIN to avoid N+1
4. THE System SHALL display loading skeleton during data fetching
5. THE System SHALL limit API response payload size by selecting only needed fields (no SELECT *)
6. THE System SHALL implement request timeout of 30 seconds for all admin API calls
7. THE System SHALL display empty state message when no data available
8. THE System SHALL use React.memo for expensive list item components
9. THE System SHALL debounce search inputs with 300ms delay (if search implemented)
10. THE System SHALL cache static data (carrier list) in component state during session

### Requirement 11: Dados Confiáveis e Consistentes

**User Story:** Como administrador, eu quero que todos os dados exibidos sejam confiáveis e consistentes, para que eu possa confiar nas informações ao tomar decisões.

#### Acceptance Criteria

1. THE System SHALL fetch Payment_Status from payments.status (database is source of truth, updated by webhook)
2. THE System SHALL use database transactions for multi-step operations (already implemented in RPC functions)
3. THE System SHALL implement proper error handling with automatic rollback on failures (already in RPC functions)
4. THE System SHALL validate data consistency before displaying to admin (e.g., check payment approved before allowing shipping)
5. THE System SHALL display last update timestamp (orders.updated_at) for each order
6. THE System SHALL provide manual "Refresh" button to reload data on demand
7. THE System SHALL display warning toast if API call takes longer than 10 seconds
8. THE System SHALL handle stale data by refetching on user action (refresh button, filter change)
9. THE System SHALL display error boundary if critical data fetch fails
10. THE System SHALL log data inconsistencies to console (e.g., order with no payment record)

## Validation Final

### Requirement 12: Testes de Aceitação

**User Story:** Como desenvolvedor, eu quero validar que o sistema funciona corretamente end-to-end, para que possamos ter confiança no deploy para produção.

#### Acceptance Criteria

1. WHEN a non-admin user attempts direct API call to /api/admin/*, THE Backend_Validation SHALL return 403 with structured error
2. WHEN a non-admin user attempts to access /admin via URL, THE Frontend_Guard SHALL redirect to home with error toast
3. WHEN an admin creates a product, THE Product_Manager SHALL display it in the list immediately after successful API response
4. WHEN an admin deactivates a product, THE System SHALL set deleted_at and hide it from customer catalog
5. WHEN an admin views an order, THE Order_Viewer SHALL display correct Payment_Status from payments.status
6. WHEN an admin attempts to ship an unpaid order (payments.status != 'approved'), THE Fulfillment_Manager SHALL prevent the action with disabled button
7. WHEN an admin marks order as shipped without Tracking_Code, THE Backend_Validation SHALL return 400 with field-level error
8. WHEN an admin updates Shipping_Status to 'shipped', THE System SHALL persist tracking_code, carrier, shipped_at, and display updated status
9. THE Dashboard SHALL display accurate revenue by summing payments.amount WHERE status = 'approved'
10. THE System SHALL complete full workflow: admin creates product → customer orders → webhook updates payment → admin ships with tracking → status updates correctly
