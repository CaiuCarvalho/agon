# Implementation Plan: Basic Checkout

## Overview

This implementation plan breaks down the Basic Checkout feature into discrete coding tasks. The feature enables authenticated users to complete purchases by creating orders with shipping information, validating stock, capturing price snapshots, and atomically clearing the cart.

The implementation follows a bottom-up approach: database schema → services layer → hooks → UI components → integration. Each task builds on previous work and includes specific requirements references for traceability.

## Tasks

- [x] 1. Set up database schema and RLS policies
  - [x] 1.1 Create orders table with constraints and indexes
    - Create `orders` table with all columns (id, user_id, status, total_amount, shipping fields, payment_method, timestamps)
    - Add CHECK constraints for status, total_amount, shipping_state, shipping_zip, shipping_phone, shipping_email
    - Create indexes on user_id, status, and created_at
    - Create trigger to update updated_at timestamp
    - _Requirements: 1.1-1.17_
  
  - [x] 1.2 Create order_items table with constraints and indexes
    - Create `order_items` table with all columns (id, order_id, product_id, product_name, product_price, quantity, size, subtotal, created_at)
    - Add CHECK constraints for quantity and subtotal
    - Add foreign keys with CASCADE for order_id and RESTRICT for product_id
    - Create indexes on order_id and product_id
    - _Requirements: 2.1-2.11, 20.1-20.5_
  
  - [x] 1.3 Create RLS policies for orders table
    - Enable RLS on orders table
    - Create policy for SELECT (users can read own orders)
    - Create policy for INSERT (users can create own orders)
    - Create policy for UPDATE (users can update own orders, admins can update any)
    - Create policy for DELETE (admins only)
    - _Requirements: 3.1-3.4_
  
  - [x] 1.4 Create RLS policies for order_items table
    - Enable RLS on order_items table
    - Create policy for SELECT (users can read items from own orders)
    - Create policy for INSERT (users can create items for own orders)
    - Create policy for UPDATE (admins only)
    - Create policy for DELETE (admins only)
    - _Requirements: 3.5-3.6_
  
  - [x] 1.5 Create atomic order creation RPC function
    - Create `create_order_atomic` PostgreSQL function with SECURITY DEFINER
    - Implement cart validation (check not empty)
    - Implement stock validation for each cart item
    - Implement price snapshot capture from products table
    - Insert order record with calculated total
    - Insert all order items with subtotals
    - Delete cart items for user
    - Return success response with order_id, total_amount, item_count
    - Handle errors with rollback and structured error messages
    - _Requirements: 8.1-8.7, 9.1-9.7, 10.1-10.7, 11.1-11.5_
  
  - [ ]* 1.6 Write integration tests for database schema
    - Test orders table constraints (status, total_amount, shipping validations)
    - Test order_items table constraints (quantity, subtotal)
    - Test foreign key behaviors (CASCADE, RESTRICT)
    - Test RLS policies for both tables
    - Test RPC function with valid data
    - Test RPC function with empty cart
    - Test RPC function with insufficient stock
    - Test RPC function rollback on failure
    - _Requirements: 1.1-1.17, 2.1-2.11, 3.1-3.6, 8.1-8.7, 10.1-10.7_

- [x] 2. Checkpoint - Verify database setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement services layer
  - [x] 3.1 Create TypeScript interfaces and types
    - Create Order, OrderItem, ShippingFormValues interfaces
    - Create CreateOrderRequest, CreateOrderResponse interfaces
    - Create OrderRow, OrderItemRow database types
    - Define Brazilian state codes constant
    - _Requirements: 1.1-1.17, 2.1-2.11, 6.1-6.12_
  
  - [x] 3.2 Create Zod validation schemas
    - Create shippingFormSchema with Brazilian format validations (CEP, phone, state, email)
    - Create paymentMethodSchema (cash_on_delivery only)
    - Create createOrderSchema combining shipping and payment
    - Add custom error messages in Portuguese
    - _Requirements: 6.9, 14.1-14.9_
  
  - [x] 3.3 Implement validationService
    - Implement validateCEP() with format checking and formatting
    - Implement validatePhone() with mobile/landline detection and formatting
    - Implement validateState() with Brazilian state code validation
    - Implement fetchAddressByCEP() with ViaCEP API integration
    - _Requirements: 14.1-14.9_
  
  - [x] 3.4 Implement orderService
    - Implement createOrder() calling RPC function with validation
    - Implement getOrderById() with RLS authorization check
    - Implement getUserOrders() with pagination
    - Implement updateOrderStatus() for admin use
    - Implement transformOrderRow() helper for camelCase conversion
    - Implement transformOrderItemRow() helper for camelCase conversion
    - _Requirements: 8.1-8.7, 9.1-9.7, 10.1-10.7, 12.2, 13.1-13.4_
  
  - [ ]* 3.5 Write unit tests for validation service
    - Test validateCEP with valid/invalid formats
    - Test validatePhone with mobile/landline formats
    - Test validateState with valid/invalid codes
    - Test fetchAddressByCEP with mocked API responses
    - _Requirements: 14.1-14.9_
  
  - [ ]* 3.6 Write unit tests for Zod schemas
    - Test shippingFormSchema with valid data
    - Test shippingFormSchema with invalid CEP, phone, state, email
    - Test field length constraints
    - Test required field validation
    - _Requirements: 6.9, 14.1-14.9_
  
  - [ ]* 3.7 Write unit tests for data transformations
    - Test transformOrderRow() with sample data
    - Test transformOrderItemRow() with sample data
    - Test decimal to number conversion
    - Test snake_case to camelCase conversion
    - _Requirements: 9.1-9.7_

- [ ] 4. Checkpoint - Verify services layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement hooks and state management
  - [x] 5.1 Create useCheckout hook
    - Implement form state management
    - Implement createOrderMutation with React Query
    - Implement submitOrder() with validation
    - Handle success (redirect to confirmation)
    - Handle errors (stock validation, empty cart, network errors)
    - Display toast notifications for feedback
    - _Requirements: 4.1-4.4, 10.1-10.7, 16.1-16.8_
  
  - [x] 5.2 Create useOrder hook
    - Implement order fetching with React Query
    - Cache order data with 5-minute stale time
    - Handle loading and error states
    - Verify user authentication
    - _Requirements: 12.2, 13.1-13.4_
  
  - [ ]* 5.3 Write tests for useCheckout hook
    - Test successful order creation flow
    - Test error handling (stock validation, empty cart)
    - Test loading states
    - Test toast notifications
    - _Requirements: 10.1-10.7, 16.1-16.8_
  
  - [ ]* 5.4 Write tests for useOrder hook
    - Test order fetching with valid order_id
    - Test authorization check
    - Test caching behavior
    - Test error states
    - _Requirements: 12.2, 13.1-13.4_

- [x] 6. Implement checkout page and components
  - [x] 6.1 Create checkout page server component
    - Implement authentication check (redirect to /login if not authenticated)
    - Fetch cart items for authenticated user
    - Implement empty cart check (redirect to /cart if empty)
    - Pass cart data and user to client component
    - _Requirements: 4.1-4.4, 19.1-19.4_
  
  - [x] 6.2 Create ShippingForm component
    - Render all shipping information fields (name, address, city, state, zip, phone, email)
    - Implement field validation with Zod schema
    - Display inline validation errors below each field
    - Implement CEP auto-fill with ViaCEP integration
    - Format CEP and phone inputs automatically
    - Pre-fill email from user profile
    - Disable submit button while validation errors exist
    - _Requirements: 6.1-6.12, 14.1-14.9_
  
  - [x] 6.3 Update CartSummary component for checkout
    - Display cart items with product image, name, size, quantity, unit price, subtotal
    - Calculate and display total quantity
    - Calculate and display subtotal (sum of all item subtotals)
    - Display shipping cost as "Grátis" (R$ 0,00)
    - Calculate and display total amount
    - Format currency as Brazilian Real (R$ X.XXX,XX)
    - Make summary sticky on desktop
    - Make summary collapsible on mobile
    - _Requirements: 5.1-5.7, 17.1-17.7, 18.1-18.6_
  
  - [x] 6.4 Create PaymentMethodSelector component
    - Display "Pagamento na Entrega" option (pre-selected)
    - Display payment method description
    - Set payment_method to 'cash_on_delivery'
    - _Requirements: 7.1-7.5_
  
  - [x] 6.5 Create CheckoutPageClient component
    - Integrate ShippingForm, CartSummary, and PaymentMethodSelector
    - Implement two-column layout (cart left, form right) on desktop
    - Stack components vertically on mobile
    - Implement form submission with useCheckout hook
    - Display loading spinner on submit button during processing
    - Disable submit button during processing
    - Handle success (redirect to confirmation)
    - Handle errors (display toast notifications)
    - Display breadcrumb navigation (Carrinho > Checkout)
    - Add "Voltar ao Carrinho" and "Continuar Comprando" links
    - _Requirements: 4.1-4.4, 5.1-5.7, 6.1-6.12, 7.1-7.5, 16.1-16.8, 17.1-17.7, 23.1-23.5_
  
  - [ ]* 6.6 Write component tests for ShippingForm
    - Test field rendering
    - Test validation error display
    - Test CEP auto-fill functionality
    - Test input formatting (CEP, phone)
    - Test submit button disabled state
    - _Requirements: 6.1-6.12, 14.1-14.9_
  
  - [ ]* 6.7 Write component tests for CartSummary
    - Test cart items display
    - Test total calculation
    - Test currency formatting
    - Test responsive behavior
    - _Requirements: 5.1-5.7, 18.1-18.6_

- [ ] 7. Checkpoint - Verify checkout page
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement order confirmation page
  - [x] 8.1 Create order confirmation page server component
    - Implement authentication check (redirect to /login if not authenticated)
    - Extract order_id from query params
    - Fetch order with items from database
    - Verify user authorization (RLS enforces ownership)
    - Handle 404 if order not found
    - Handle 403 if user doesn't own order
    - Pass order data to client component
    - _Requirements: 12.1-12.12, 13.1-13.4_
  
  - [x] 8.2 Create OrderConfirmationClient component
    - Display success message "Pedido realizado com sucesso!"
    - Display order number (formatted as "Pedido #[first 8 chars of UUID]")
    - Display order status
    - Display order total amount (formatted as Brazilian Real)
    - Display shipping information (name, address, city, state, zip, phone, email)
    - Display order creation date
    - Display list of order items (product name, quantity, size, price, subtotal)
    - Add "Continuar Comprando" button linking to /products
    - Add "Ver Meus Pedidos" button linking to /perfil
    - Implement click-to-copy for order number
    - _Requirements: 12.1-12.12, 22.1-22.4_
  
  - [ ]* 8.3 Write component tests for OrderConfirmationClient
    - Test order details display
    - Test order items list
    - Test action buttons
    - Test order number copy functionality
    - _Requirements: 12.1-12.12, 22.1-22.4_

- [ ] 9. Integration testing and error handling
  - [ ]* 9.1 Write integration tests for order creation flow
    - Test successful order creation with cart clearing
    - Test empty cart error handling
    - Test insufficient stock error handling
    - Test price snapshot capture
    - Test transaction rollback on failure
    - Test RLS policy enforcement
    - _Requirements: 8.1-8.7, 9.1-9.7, 10.1-10.7, 11.1-11.5_
  
  - [ ]* 9.2 Write E2E tests for complete checkout flow
    - Test full flow: login → add to cart → checkout → fill form → submit → confirmation
    - Test redirect to login if not authenticated
    - Test redirect to cart if cart is empty
    - Test form validation errors
    - Test stock validation error display
    - _Requirements: 4.1-4.4, 5.1-5.7, 6.1-6.12, 12.1-12.12, 16.1-16.8, 19.1-19.4_
  
  - [ ] 9.3 Implement comprehensive error handling
    - Add error messages constant with Portuguese translations
    - Implement error parsing in useCheckout hook
    - Add error toast notifications for all error types
    - Add inline error display for form validation
    - Add 404 error page for order not found
    - Add 403 error page for unauthorized access
    - Add loading skeletons for async operations
    - _Requirements: 16.1-16.8_
  
  - [ ] 9.4 Add performance optimizations
    - Verify database indexes are used (user_id, status, created_at)
    - Implement debouncing for CEP lookup (500ms)
    - Enable React Query caching for order data (5 minutes)
    - Use server-side rendering for auth checks
    - Verify RPC function completes within 3 seconds
    - _Requirements: 21.1-21.5_

- [ ] 10. Final checkpoint and polish
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation follows a bottom-up approach: database → services → hooks → UI
- All validation happens at multiple layers: client (Zod) → service → database constraints
- The atomic RPC function ensures order creation is all-or-nothing (no partial state)
- Brazilian-specific validations (CEP, phone, state codes) are implemented throughout
- Error handling provides clear, actionable feedback in Portuguese
- Performance optimizations ensure sub-3-second order creation
