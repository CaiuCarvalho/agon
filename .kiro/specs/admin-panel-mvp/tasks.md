# Implementation Plan: Admin Panel MVP

## Overview

This implementation plan creates a secure administrative interface for the Agon e-commerce platform. The admin panel provides product management (CRUD), order viewing with filtering, shipping/fulfillment tracking, and a dashboard with real business metrics.

**Architecture**: Layered approach (Database → Services → Hooks → UI) with TypeScript end-to-end, Zod validation, and multi-layer security (backend validation, RLS policies, frontend guards).

**Key Features**:
- Admin authentication with email whitelist (2 authorized emails)
- Dashboard with revenue, order counts, average order value, recent orders
- Product CRUD with soft delete and stock management
- Order viewing with payment/shipping status filtering
- Fulfillment management with tracking codes and carrier info
- Webhook idempotency for payment updates

## Tasks

- [x] 1. Create database migration for shipping fields and order status derivation
  - Create migration file `supabase/migrations/20250409_admin_panel_shipping_fields.sql`
  - Add columns: `shipping_status`, `tracking_code`, `carrier`, `shipped_at` to orders table
  - Add check constraint: tracking_code and carrier required when shipping_status IN ('shipped', 'delivered')
  - Create index on `orders.shipping_status`
  - Create function `derive_order_status(p_payment_status TEXT, p_shipping_status TEXT)` that returns derived order status
  - Create trigger `update_order_status_on_shipping_change()` to auto-update orders.status when shipping_status changes
  - Add assertion function `assert_single_payment_per_order(p_order_id UUID)` for defensive 1:1 validation
  - Add comments to all new columns and functions
  - _Requirements: 1.8, 5.1, 5.2, 5.7, 11.2_

- [x] 2. Update existing RPC function to call derive_order_status
  - Modify `update_payment_from_webhook` RPC function to execute atomically:
    1. Call `assert_single_payment_per_order(v_order_id)` FIRST (defensive check for 1:1 relationship)
    2. Update `payments.status`
    3. Update `orders.status` using `derive_order_status(p_status, shipping_status)`
    4. Clear cart (if payment approved)
  - All operations MUST be atomic (single transaction with automatic rollback on error)
  - Ensure orders.status is updated when payment status changes via webhook
  - _Requirements: 9.5, 11.1, 11.2_

- [x] 3. Set up admin module structure and shared types
  - Create directory structure: `apps/web/src/modules/admin/` with subdirectories: components/, hooks/, services/
  - Create `apps/web/src/modules/admin/types.ts` with TypeScript types: Order, OrderWithDetails, OrderItem, Payment, Product, DashboardMetrics, OrderSummary, AdminUser, ApiError, PaymentStatus, ShippingStatus, OrderStatus
  - Create `apps/web/src/modules/admin/schemas.ts` with Zod schemas: productSchema, shippingUpdateSchema, stockUpdateSchema, orderFiltersSchema
  - Create `apps/web/src/modules/admin/constants.ts` with COMMON_CARRIERS array and PAGE_SIZE constant
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 7.1_

- [x] 4. Implement admin authentication service and middleware
  - Create `apps/web/src/modules/admin/services/adminService.ts` with validateAdmin middleware function
  - Implement admin role check (profiles.role = 'admin')
  - Implement email whitelist check (ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_BACKUP from env)
  - Return structured error responses: { code, message, details }
  - Log all failed admin access attempts with timestamp, user_email, endpoint
  - _Requirements: 1.1, 1.6, 1.7, 1.10, 8.1, 8.2, 8.6, 8.10_

- [x] 5. Checkpoint - Verify migration and authentication
  - Apply migration to local Supabase instance
  - Verify shipping fields exist in orders table
  - Verify derive_order_status function works correctly
  - Verify trigger updates orders.status when shipping_status changes
  - Test admin authentication with valid and invalid credentials
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement dashboard service and API endpoint
  - Create `apps/web/src/modules/admin/services/adminService.ts` with getDashboardMetrics function
  - Calculate total revenue: SUM(payments.amount) WHERE payments.status = 'approved'
  - Calculate order counts by orders.status (pending, processing, shipped, delivered, cancelled)
  - Calculate average order value: total revenue / approved orders count
  - Fetch 10 most recent orders sorted by created_at DESC
  - Create API endpoint `apps/web/src/app/api/admin/dashboard/route.ts` (GET)
  - Validate admin access using validateAdmin middleware
  - Return structured JSON response with metrics
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.2, 7.3, 10.5_

- [x] 7. Implement dashboard UI components
  - Create `apps/web/src/modules/admin/hooks/useAdminDashboard.ts` with state management for metrics, loading, error
  - Create `apps/web/src/modules/admin/components/Dashboard/DashboardPage.tsx` as main dashboard page
  - Create `apps/web/src/modules/admin/components/Dashboard/MetricsCard.tsx` for displaying individual metrics
  - Create `apps/web/src/modules/admin/components/Dashboard/RecentOrdersList.tsx` for recent orders table
  - Create `apps/web/src/modules/admin/components/Dashboard/LoadingSkeleton.tsx` for loading state
  - Format currency as BRL (R$) using Intl.NumberFormat
  - Format dates as DD/MM/YYYY HH:mm using date-fns
  - Display loading skeleton while fetching, error message on failure
  - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 7.4, 7.5, 7.8, 7.9, 10.4_

- [x] 8. Implement product service layer
  - Create `apps/web/src/modules/admin/services/productService.ts` with functions: listProducts, createProduct, updateProduct, toggleProduct, updateStock
  - Implement pagination (20 per page)
  - Include soft-deleted products in list (deleted_at IS NOT NULL)
  - Validate all inputs using Zod schemas (productSchema, stockUpdateSchema)
  - Return ServiceResult<T> with success, data, error structure
  - Enforce constraints: price >= 0, stock >= 0, name not empty
  - _Requirements: 3.1, 3.3, 3.4, 3.6, 3.7, 3.8, 3.11, 7.2, 7.3, 7.7, 8.3, 8.11, 10.1_

- [x] 9. Implement product API endpoints
  - Create `apps/web/src/app/api/admin/products/route.ts` (GET, POST)
  - Create `apps/web/src/app/api/admin/products/[id]/route.ts` (PUT)
  - Create `apps/web/src/app/api/admin/products/[id]/stock/route.ts` (PATCH)
  - Create `apps/web/src/app/api/admin/products/[id]/toggle/route.ts` (PATCH)
  - Validate admin access on all endpoints using validateAdmin
  - Validate request bodies using Zod schemas
  - Return structured error responses with appropriate HTTP status codes
  - _Requirements: 3.4, 3.5, 3.6, 3.9, 8.1, 8.3, 8.5, 8.6_

- [x] 10. Implement product UI components
  - Create `apps/web/src/modules/admin/hooks/useAdminProducts.ts` with state management for products, pagination, CRUD operations
  - Create `apps/web/src/modules/admin/components/Products/ProductsPage.tsx` as main products page
  - Create `apps/web/src/modules/admin/components/Products/ProductTable.tsx` for product list with pagination
  - Create `apps/web/src/modules/admin/components/Products/ProductForm.tsx` for create/edit form with Zod validation
  - Create `apps/web/src/modules/admin/components/Products/ProductFormModal.tsx` for modal wrapper
  - Create `apps/web/src/modules/admin/components/Products/StockUpdateInput.tsx` for inline stock updates
  - Display validation errors below each field
  - Show success toast on successful operations
  - _Requirements: 3.2, 3.3, 3.5, 3.9, 3.10, 3.12, 7.4, 7.5, 7.8, 7.9, 10.8_

- [x] 11. Checkpoint - Verify product management
  - Test product creation with valid and invalid data
  - Test product editing and stock updates
  - Test product toggle (soft delete/restore)
  - Verify pagination works correctly
  - Verify validation errors display properly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement order service layer
  - Create `apps/web/src/modules/admin/services/orderService.ts` with functions: listOrders, getOrderDetails
  - Implement pagination (20 per page)
  - Implement filtering by payment_status and shipping_status
  - Fetch orders with order_items and payment in single query using JOIN (prevent N+1)
  - Select only needed fields (no SELECT *)
  - Sort by created_at DESC
  - Return ServiceResult<OrderListResult> with orders, total, page, pageSize
  - _Requirements: 4.1, 4.2, 4.4, 4.8, 4.9, 7.2, 7.3, 7.7, 10.1, 10.3, 10.5_

- [x] 13. Implement order API endpoints
  - Create `apps/web/src/app/api/admin/orders/route.ts` (GET) with query params: page, pageSize, paymentStatus, shippingStatus
  - Create `apps/web/src/app/api/admin/orders/[id]/route.ts` (GET)
  - Validate admin access using validateAdmin
  - Validate query params using orderFiltersSchema
  - Return structured JSON response with orders and pagination metadata
  - _Requirements: 4.1, 4.8, 4.9, 8.1, 8.3, 8.5, 8.6_

- [x] 14. Implement order UI components
  - Create `apps/web/src/modules/admin/hooks/useAdminOrders.ts` with state management for orders, filters, pagination
  - Create `apps/web/src/modules/admin/components/Orders/OrdersPage.tsx` as main orders page
  - Create `apps/web/src/modules/admin/components/Orders/OrderTable.tsx` for order list with expandable rows
  - Create `apps/web/src/modules/admin/components/Orders/OrderDetailsRow.tsx` for expanded order details
  - Create `apps/web/src/modules/admin/components/Orders/OrderFilters.tsx` for payment/shipping status filters
  - Create `apps/web/src/modules/admin/components/Orders/OrderItemsList.tsx` for order items display
  - Display columns: order ID, customer name, total amount, payment status, shipping status, created_at
  - Display full order details on row click: items, shipping address, payment info
  - Format dates as DD/MM/YYYY HH:mm, currency as BRL
  - Provide "Refresh" button to reload order list
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10, 4.11, 7.4, 7.5, 7.8, 7.9, 10.8, 11.6_

- [x] 15. Implement fulfillment service layer
  - Create `apps/web/src/modules/admin/services/fulfillmentService.ts` with updateShipping function
  - Validate payment status = 'approved' before allowing shipping
  - Validate shipping status progression (no regression: pending → processing → shipped → delivered)
  - Validate tracking_code and carrier presence when shipping_status = 'shipped'
  - Set shipped_at = NOW() when shipping_status changes to 'shipped'
  - Return ServiceResult<Order> with updated order
  - Log validation failures with timestamp, order_id, error
  - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.10, 7.2, 7.3, 7.7, 8.4, 8.7, 8.8, 8.10_

- [x] 16. Implement fulfillment API endpoint
  - Create `apps/web/src/app/api/admin/orders/[id]/shipping/route.ts` (PATCH)
  - Validate admin access using validateAdmin
  - Validate request body using shippingUpdateSchema
  - Call fulfillmentService.updateShipping
  - Return structured error responses for business rule violations
  - _Requirements: 5.6, 5.11, 8.1, 8.3, 8.4, 8.5, 8.6_

- [x] 17. Implement fulfillment UI components
  - Create `apps/web/src/modules/admin/hooks/useAdminShipping.ts` with state management for shipping updates
  - Create `apps/web/src/modules/admin/components/Fulfillment/ShippingUpdateModal.tsx` for shipping update form
  - Create `apps/web/src/modules/admin/components/Fulfillment/ShippingStatusBadge.tsx` for status display
  - Create `apps/web/src/modules/admin/components/Fulfillment/TrackingDisplay.tsx` for tracking code/carrier display
  - Create `apps/web/src/modules/admin/components/Fulfillment/ShippingForm.tsx` for form with tracking code and carrier inputs
  - Disable "Mark as Shipped" button if payment status != 'approved' with tooltip
  - Show modal requiring tracking_code and carrier when marking as shipped
  - Display current tracking code and carrier for shipped/delivered orders
  - Allow editing tracking code and carrier for shipped orders
  - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.9, 5.10, 7.4, 7.5, 7.8, 7.9_

- [x] 18. Checkpoint - Verify order and fulfillment management
  - Test order list with pagination and filtering
  - Test order details expansion
  - Test shipping update with valid and invalid data
  - Verify cannot ship unpaid order (button disabled)
  - Verify cannot regress shipping status
  - Verify tracking code and carrier required when marking as shipped
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement admin layout and navigation
  - Create `apps/web/src/modules/admin/components/shared/AdminLayout.tsx` with navigation sidebar
  - Create `apps/web/src/modules/admin/components/shared/AdminNav.tsx` with links to Dashboard, Products, Orders
  - Create `apps/web/src/modules/admin/components/shared/ErrorBoundary.tsx` for error handling
  - Create `apps/web/src/modules/admin/components/shared/EmptyState.tsx` for empty data states
  - Apply AdminLayout to all admin pages
  - _Requirements: 7.4, 7.5, 10.7, 11.9_

- [x] 20. Implement frontend admin guard
  - Create `apps/web/src/modules/admin/hooks/useAdminAuth.ts` with admin authentication check
  - Check user authentication status
  - Check user role = 'admin'
  - Check user email in whitelist (ADMIN_EMAIL_PRIMARY, ADMIN_EMAIL_BACKUP)
  - Redirect to /login with redirect parameter if not authenticated
  - Redirect to home with error toast if not admin or not in whitelist
  - Apply guard to all admin pages: /admin, /admin/products, /admin/orders
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 7.4, 7.5_

- [x] 21. Update webhook handler for idempotency
  - Modify `apps/web/src/app/api/webhooks/mercadopago/route.ts` to check if payments.status already matches incoming status
  - If status unchanged, return 200 with {received: true, skipped: true} without database update
  - Log all webhook events with timestamp, payment_id, old_status, new_status, action (updated/skipped)
  - Use optional correlation_id from x-request-id header for request tracing
  - Ensure RPC function update_payment_from_webhook handles idempotency
  - _Requirements: 9.3, 9.4, 9.6, 9.9_

- [x] 22. Add environment variables for admin whitelist
  - Add ADMIN_EMAIL_PRIMARY and ADMIN_EMAIL_BACKUP to .env.example
  - Document admin whitelist configuration in README or setup guide
  - _Requirements: 1.1_

- [x] 23. Create RLS policies for admin operations
  - Create RLS policy for products table: allow all operations for role='admin'
  - Create RLS policy for orders table: allow read for role='admin'
  - Create RLS policy for order_items table: allow read for role='admin'
  - Create RLS policy for payments table: allow read for role='admin'
  - Ensure RLS policies return empty result set if violated (last line of defense)
  - _Requirements: 1.8, 8.9_

- [x]* 24. Write unit tests for service layer
  - Test adminService.validateAdmin with valid/invalid credentials
  - Test productService CRUD operations with valid/invalid data
  - Test orderService list and filter operations
  - Test fulfillmentService.updateShipping with business rule violations
  - Mock Supabase client for all tests
  - _Requirements: 6.9, 8.10_

- [x]* 25. Write integration tests for API endpoints
  - Test all admin API endpoints with authenticated/unauthenticated requests
  - Test admin API endpoints with admin/non-admin users
  - Test request validation and error responses
  - Test response format and HTTP status codes
  - _Requirements: 8.5, 8.6, 12.1, 12.2_

- [x]* 26. Write component tests for UI
  - Test dashboard components render correctly with data
  - Test product form validation and submission
  - Test order table filtering and pagination
  - Test shipping update modal validation
  - Mock hooks for all component tests
  - _Requirements: 6.9_

- [x] 27. Manual testing and validation
  - Follow manual testing checklist from design document
  - Test security: non-admin access, direct API calls, whitelist enforcement
  - Test dashboard: metrics accuracy, formatting, loading states
  - Test products: CRUD operations, pagination, validation
  - Test orders: list, filtering, details expansion
  - Test fulfillment: shipping updates, business rules, tracking display
  - Test webhook: idempotency, signature validation, status updates
  - Document any issues found and verify fixes
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

- [x] 28. Final checkpoint - End-to-end workflow validation
  - Verify complete workflow: admin creates product → customer orders → webhook updates payment → admin ships with tracking → status updates correctly
  - Verify all security layers work: backend validation, RLS policies, frontend guards
  - Verify data consistency: payment status from database, order status derived correctly
  - Verify performance: pagination, optimized queries, loading states
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The design uses TypeScript (not pseudocode), so all implementation will be in TypeScript
- Security is enforced in 3 layers: backend validation (primary), RLS policies (last defense), frontend guards (UX only)
- Database is single source of truth for all data (orders, payments, products)
- Webhook idempotency prevents duplicate updates from Mercado Pago
- Order status is derived from payment status + shipping status using centralized database function
