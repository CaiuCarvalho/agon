# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de Checkout Básico do e-commerce Agon MVP. A feature permite que clientes autenticados completem compras de forma simplificada, criando pedidos no banco de dados com informações de entrega e método de pagamento (apenas Pagamento na Entrega para MVP). O sistema valida estoque, captura preços atuais dos produtos, e limpa o carrinho após confirmação do pedido.

Esta é uma implementação MVP focada em funcionalidade essencial, sem integrações de pagamento online, cálculo de frete, ou cupons de desconto.

## Glossary

- **Checkout_System**: Sistema responsável por processar a finalização de compras
- **Authenticated_User**: Usuário com sessão ativa no Supabase Auth
- **Cart_Item**: Item no carrinho do usuário (produto + quantidade + tamanho)
- **Order**: Pedido criado no sistema contendo informações de entrega e itens
- **Order_Item**: Item individual dentro de um pedido (snapshot de produto + quantidade + preço)
- **Orders_Table**: Tabela Supabase armazenando pedidos com colunas: id, user_id, status, total_amount, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone, shipping_email, payment_method, created_at, updated_at
- **Order_Items_Table**: Tabela Supabase armazenando itens de pedidos com colunas: id, order_id, product_id, product_name, product_price, quantity, size, subtotal, created_at
- **Shipping_Info**: Informações de entrega fornecidas pelo cliente (nome, endereço, telefone, email)
- **Price_Snapshot**: Preço do produto capturado no momento da criação do pedido
- **Stock_Validation**: Verificação de disponibilidade de produtos antes de criar pedido
- **Order_Status**: Estado do pedido (pending, processing, shipped, delivered, cancelled)
- **Payment_Method**: Método de pagamento selecionado (cash_on_delivery para MVP)
- **Order_Transaction**: Operação atômica de criação de pedido e itens
- **Cart_Clear**: Processo de limpar carrinho após pedido bem-sucedido
- **Order_Confirmation**: Página exibindo detalhes do pedido criado
- **RLS_Policy**: Row Level Security garantindo que usuários vejam apenas seus próprios pedidos
- **Checkout_Page**: Página em `/checkout` com formulário e resumo do carrinho
- **Confirmation_Page**: Página em `/pedido/confirmado` exibindo detalhes do pedido

## Requirements

### Requirement 1: Orders Database Schema

**User Story:** Como sistema, preciso de uma tabela de pedidos estruturada, para que os dados de pedidos sejam armazenados corretamente.

#### Acceptance Criteria

1. THE Orders_Table SHALL have column `id` (UUID, primary key, auto-generated)
2. THE Orders_Table SHALL have column `user_id` (UUID, FOREIGN KEY to auth.users.id, NOT NULL)
3. THE Orders_Table SHALL have column `status` (TEXT, NOT NULL, DEFAULT 'pending', CHECK status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
4. THE Orders_Table SHALL have column `total_amount` (DECIMAL(10,2), NOT NULL, CHECK total_amount >= 0)
5. THE Orders_Table SHALL have column `shipping_name` (TEXT, NOT NULL)
6. THE Orders_Table SHALL have column `shipping_address` (TEXT, NOT NULL)
7. THE Orders_Table SHALL have column `shipping_city` (TEXT, NOT NULL)
8. THE Orders_Table SHALL have column `shipping_state` (TEXT, NOT NULL)
9. THE Orders_Table SHALL have column `shipping_zip` (TEXT, NOT NULL)
10. THE Orders_Table SHALL have column `shipping_phone` (TEXT, NOT NULL)
11. THE Orders_Table SHALL have column `shipping_email` (TEXT, NOT NULL)
12. THE Orders_Table SHALL have column `payment_method` (TEXT, NOT NULL, DEFAULT 'cash_on_delivery')
13. THE Orders_Table SHALL have column `created_at` (TIMESTAMPTZ, DEFAULT NOW())
14. THE Orders_Table SHALL have column `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
15. THE Orders_Table SHALL have an index on `user_id` for efficient user order queries
16. THE Orders_Table SHALL have an index on `status` for admin filtering
17. THE Orders_Table SHALL have a trigger to update `updated_at` on row modification

### Requirement 2: Order Items Database Schema

**User Story:** Como sistema, preciso de uma tabela de itens de pedido, para que os produtos comprados sejam registrados com preços e quantidades.

#### Acceptance Criteria

1. THE Order_Items_Table SHALL have column `id` (UUID, primary key, auto-generated)
2. THE Order_Items_Table SHALL have column `order_id` (UUID, FOREIGN KEY to orders.id ON DELETE CASCADE, NOT NULL)
3. THE Order_Items_Table SHALL have column `product_id` (UUID, FOREIGN KEY to products.id, NOT NULL)
4. THE Order_Items_Table SHALL have column `product_name` (TEXT, NOT NULL)
5. THE Order_Items_Table SHALL have column `product_price` (DECIMAL(10,2), NOT NULL, CHECK product_price >= 0)
6. THE Order_Items_Table SHALL have column `quantity` (INTEGER, NOT NULL, CHECK quantity > 0)
7. THE Order_Items_Table SHALL have column `size` (TEXT, NULL)
8. THE Order_Items_Table SHALL have column `subtotal` (DECIMAL(10,2), NOT NULL, CHECK subtotal >= 0)
9. THE Order_Items_Table SHALL have column `created_at` (TIMESTAMPTZ, DEFAULT NOW())
10. THE Order_Items_Table SHALL have an index on `order_id` for efficient order item queries
11. THE Order_Items_Table SHALL have an index on `product_id` for product sales analytics

### Requirement 3: Row Level Security for Orders

**User Story:** Como usuário, quero ter certeza de que apenas eu posso ver meus pedidos, para que minha privacidade seja protegida.

#### Acceptance Criteria

1. THE Orders_Table SHALL have RLS_Policy allowing SELECT only WHERE user_id = auth.uid()
2. THE Orders_Table SHALL have RLS_Policy allowing INSERT only WHERE user_id = auth.uid()
3. THE Orders_Table SHALL have RLS_Policy allowing UPDATE only WHERE user_id = auth.uid() OR user has role 'admin'
4. THE Orders_Table SHALL have RLS_Policy allowing DELETE only WHERE user has role 'admin'
5. THE Order_Items_Table SHALL have RLS_Policy allowing SELECT only WHERE order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
6. THE Order_Items_Table SHALL have RLS_Policy allowing INSERT only WHERE order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())

### Requirement 4: Checkout Page Access Control

**User Story:** Como sistema, preciso garantir que apenas usuários autenticados acessem o checkout, para que visitantes sejam direcionados ao login.

#### Acceptance Criteria

1. WHEN um usuário não autenticado tenta acessar `/checkout`, THE Checkout_System SHALL redirecionar para `/login`
2. WHEN um Authenticated_User acessa `/checkout`, THE Checkout_System SHALL exibir a página de checkout
3. WHEN um Authenticated_User tem carrinho vazio, THE Checkout_System SHALL redirecionar para `/cart` com mensagem "Seu carrinho está vazio"
4. THE Checkout_System SHALL verificar autenticação no servidor (middleware ou server component)

### Requirement 5: Cart Summary Display

**User Story:** Como cliente, quero revisar os itens do meu carrinho antes de finalizar, para que eu confirme o que estou comprando.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display a cart summary section
2. THE cart summary SHALL display each Cart_Item with: product image, name, size, quantity, unit price, subtotal
3. THE cart summary SHALL display total quantity of items
4. THE cart summary SHALL display total amount (sum of all subtotals)
5. THE cart summary SHALL fetch Cart_Items from the cart_items table for Authenticated_User
6. THE cart summary SHALL update automatically if cart changes (via Realtime subscription)
7. THE cart summary SHALL display "Calculating..." while loading cart data

### Requirement 6: Shipping Information Form

**User Story:** Como cliente, quero fornecer informações de entrega, para que meu pedido seja enviado ao endereço correto.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display a shipping information form
2. THE form SHALL include field `shipping_name` (TEXT, required, max 200 chars)
3. THE form SHALL include field `shipping_address` (TEXT, required, max 500 chars)
4. THE form SHALL include field `shipping_city` (TEXT, required, max 100 chars)
5. THE form SHALL include field `shipping_state` (TEXT, required, max 2 chars for Brazilian states)
6. THE form SHALL include field `shipping_zip` (TEXT, required, format XXXXX-XXX for Brazilian CEP)
7. THE form SHALL include field `shipping_phone` (TEXT, required, format (XX) XXXXX-XXXX)
8. THE form SHALL include field `shipping_email` (TEXT, required, valid email format)
9. THE form SHALL validate all fields using Zod schema
10. THE form SHALL display validation errors inline below each field
11. THE form SHALL disable submit button while validation errors exist
12. THE form SHALL pre-fill email with user's auth email if available

### Requirement 7: Payment Method Selection

**User Story:** Como cliente, quero selecionar o método de pagamento, para que eu possa escolher como pagar meu pedido.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display a payment method selection section
2. WHERE MVP is active, THE Checkout_Page SHALL display only "Pagamento na Entrega" option
3. THE payment method SHALL be pre-selected as "cash_on_delivery"
4. THE Checkout_Page SHALL display payment method description: "Pague em dinheiro ou cartão na entrega"
5. THE Checkout_Page SHALL include payment_method field in order creation

### Requirement 8: Stock Validation Before Order Creation

**User Story:** Como sistema, preciso validar estoque antes de criar pedido, para que clientes não comprem produtos indisponíveis.

#### Acceptance Criteria

1. WHEN the user submits the checkout form, THE Checkout_System SHALL validate stock for all Cart_Items
2. THE Checkout_System SHALL fetch current stock from products table for each product_id
3. IF any Cart_Item has quantity > available stock, THEN THE Checkout_System SHALL reject the order
4. WHEN stock validation fails, THE Checkout_System SHALL display error message: "Produto [product_name] não tem estoque suficiente (disponível: X)"
5. WHEN stock validation fails, THE Checkout_System SHALL highlight the out-of-stock items in cart summary
6. THE Checkout_System SHALL perform Stock_Validation within the Order_Transaction to prevent race conditions
7. WHEN all items pass stock validation, THE Checkout_System SHALL proceed to order creation

### Requirement 9: Price Snapshot Capture

**User Story:** Como sistema, preciso capturar preços atuais dos produtos no momento do pedido, para que mudanças futuras de preço não afetem pedidos históricos.

#### Acceptance Criteria

1. WHEN creating an order, THE Checkout_System SHALL fetch current price from products table for each Cart_Item
2. THE Checkout_System SHALL store the fetched price in Order_Items_Table.product_price (Price_Snapshot)
3. THE Checkout_System SHALL calculate subtotal as product_price * quantity for each Order_Item
4. THE Checkout_System SHALL calculate total_amount as sum of all subtotals
5. THE Checkout_System SHALL store product_name from products table in Order_Items_Table.product_name
6. THE Price_Snapshot SHALL remain immutable after order creation
7. IF a product price changes after order creation, THE Order_Item SHALL retain the original Price_Snapshot

### Requirement 10: Atomic Order Creation

**User Story:** Como sistema, preciso criar pedidos de forma atômica, para que falhas parciais não deixem dados inconsistentes.

#### Acceptance Criteria

1. THE Checkout_System SHALL execute order creation as a single Order_Transaction
2. THE Order_Transaction SHALL include: insert into Orders_Table, insert all Order_Items into Order_Items_Table, clear cart_items for user
3. IF any step in Order_Transaction fails, THEN THE Checkout_System SHALL rollback all changes
4. WHEN Order_Transaction fails, THE Checkout_System SHALL display error message to user
5. WHEN Order_Transaction succeeds, THE Checkout_System SHALL commit all changes
6. THE Checkout_System SHALL use Supabase RPC function or database transaction for atomicity
7. THE Order_Transaction SHALL complete within 5 seconds or timeout with error

### Requirement 11: Cart Clearing After Order

**User Story:** Como cliente, quero que meu carrinho seja limpo após finalizar o pedido, para que eu possa começar uma nova compra.

#### Acceptance Criteria

1. WHEN an Order is successfully created, THE Checkout_System SHALL delete all Cart_Items for the user from cart_items table
2. THE Cart_Clear SHALL be part of the Order_Transaction (atomic operation)
3. IF Cart_Clear fails, THEN THE entire Order_Transaction SHALL rollback
4. WHEN Cart_Clear succeeds, THE Checkout_System SHALL update cart UI to show empty state
5. THE Checkout_System SHALL NOT clear wishlist items

### Requirement 12: Order Confirmation Page

**User Story:** Como cliente, quero ver confirmação do meu pedido após finalizar, para que eu tenha certeza de que a compra foi processada.

#### Acceptance Criteria

1. WHEN an Order is successfully created, THE Checkout_System SHALL redirect to `/pedido/confirmado?order_id={order_id}`
2. THE Confirmation_Page SHALL fetch Order details from Orders_Table by order_id
3. THE Confirmation_Page SHALL display order number (order_id)
4. THE Confirmation_Page SHALL display order status
5. THE Confirmation_Page SHALL display order total amount
6. THE Confirmation_Page SHALL display shipping information
7. THE Confirmation_Page SHALL display list of Order_Items with: product name, quantity, size, price, subtotal
8. THE Confirmation_Page SHALL display order creation date
9. THE Confirmation_Page SHALL display success message: "Pedido realizado com sucesso!"
10. THE Confirmation_Page SHALL display "Continuar Comprando" button linking to `/products`
11. THE Confirmation_Page SHALL display "Ver Meus Pedidos" button linking to `/perfil` (future feature)
12. WHEN order_id is invalid or not found, THE Confirmation_Page SHALL display 404 error

### Requirement 13: Order Confirmation Access Control

**User Story:** Como usuário, quero ter certeza de que apenas eu posso ver a confirmação do meu pedido, para que minha privacidade seja protegida.

#### Acceptance Criteria

1. THE Confirmation_Page SHALL verify that the order belongs to the authenticated user
2. WHEN an Authenticated_User tries to access another user's order confirmation, THE Confirmation_Page SHALL display 403 error
3. WHEN a non-authenticated user tries to access order confirmation, THE Confirmation_Page SHALL redirect to `/login`
4. THE Confirmation_Page SHALL use RLS_Policy to enforce access control at database level

### Requirement 14: Shipping Information Validation

**User Story:** Como sistema, preciso validar informações de entrega, para que pedidos tenham dados corretos para envio.

#### Acceptance Criteria

1. THE Checkout_System SHALL validate shipping_name is not empty and has max 200 characters
2. THE Checkout_System SHALL validate shipping_address is not empty and has max 500 characters
3. THE Checkout_System SHALL validate shipping_city is not empty and has max 100 characters
4. THE Checkout_System SHALL validate shipping_state matches Brazilian state codes (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)
5. THE Checkout_System SHALL validate shipping_zip matches format XXXXX-XXX (Brazilian CEP)
6. THE Checkout_System SHALL validate shipping_phone matches format (XX) XXXXX-XXXX or (XX) XXXX-XXXX
7. THE Checkout_System SHALL validate shipping_email is a valid email format
8. WHEN validation fails, THE Checkout_System SHALL display specific error messages for each field
9. THE Checkout_System SHALL perform validation on both client and server

### Requirement 15: Order Status Initialization

**User Story:** Como sistema, preciso inicializar pedidos com status correto, para que o fluxo de processamento seja consistente.

#### Acceptance Criteria

1. WHEN an Order is created, THE Checkout_System SHALL set status to 'pending'
2. THE Orders_Table SHALL enforce status values via CHECK constraint (pending, processing, shipped, delivered, cancelled)
3. THE Checkout_System SHALL NOT allow creating orders with status other than 'pending'
4. THE Order status SHALL be updatable only by admin users (enforced by RLS_Policy)

### Requirement 16: Error Handling and User Feedback

**User Story:** Como cliente, quero feedback claro quando algo der errado no checkout, para que eu saiba como resolver o problema.

#### Acceptance Criteria

1. WHEN Stock_Validation fails, THE Checkout_System SHALL display error toast with product name and available stock
2. WHEN Order_Transaction fails, THE Checkout_System SHALL display error toast: "Erro ao processar pedido. Tente novamente."
3. WHEN network error occurs, THE Checkout_System SHALL display error toast: "Erro de conexão. Verifique sua internet."
4. WHEN form validation fails, THE Checkout_System SHALL display inline errors below each invalid field
5. THE Checkout_System SHALL disable submit button during order processing
6. THE Checkout_System SHALL display loading spinner on submit button during processing
7. WHEN order creation succeeds, THE Checkout_System SHALL display success toast before redirecting
8. THE Checkout_System SHALL log errors to console for debugging

### Requirement 17: Checkout Page Layout and Responsiveness

**User Story:** Como cliente em qualquer dispositivo, quero que a página de checkout seja responsiva, para que eu possa finalizar compras no celular ou desktop.

#### Acceptance Criteria

1. THE Checkout_Page SHALL use two-column layout on desktop: cart summary (left), shipping form (right)
2. THE Checkout_Page SHALL stack cart summary above shipping form on mobile
3. THE Checkout_Page SHALL make cart summary sticky on desktop while scrolling
4. THE Checkout_Page SHALL display "Finalizar Pedido" button at bottom of form
5. THE Checkout_Page SHALL be scrollable on small screens
6. THE cart summary SHALL be collapsible on mobile to save space
7. THE form fields SHALL be full-width on mobile, optimized width on desktop

### Requirement 18: Order Total Calculation

**User Story:** Como cliente, quero ver o total do pedido calculado corretamente, para que eu saiba quanto vou pagar.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display subtotal (sum of all Cart_Item subtotals)
2. WHERE MVP is active, THE Checkout_Page SHALL display shipping cost as "Grátis" (R$ 0,00)
3. THE Checkout_Page SHALL display total amount (subtotal + shipping)
4. THE Checkout_Page SHALL format currency as Brazilian Real (R$ X.XXX,XX)
5. THE Checkout_Page SHALL update total automatically when cart changes
6. THE Checkout_System SHALL store total_amount in Orders_Table matching the displayed total

### Requirement 19: Empty Cart Handling

**User Story:** Como sistema, preciso prevenir checkout com carrinho vazio, para que pedidos inválidos não sejam criados.

#### Acceptance Criteria

1. WHEN an Authenticated_User has empty cart, THE Checkout_Page SHALL redirect to `/cart`
2. WHEN redirecting from empty cart, THE Checkout_System SHALL display message: "Seu carrinho está vazio. Adicione produtos antes de finalizar."
3. THE Checkout_System SHALL verify cart is not empty before processing order
4. IF cart becomes empty during checkout (e.g., via another device), THE Checkout_System SHALL display error and redirect to `/cart`

### Requirement 20: Product Reference Integrity

**User Story:** Como sistema, preciso manter referência aos produtos nos pedidos, para que dados históricos sejam preservados mesmo se produtos forem deletados.

#### Acceptance Criteria

1. THE Order_Items_Table SHALL define foreign key product_id referencing products.id
2. THE Order_Items_Table foreign key SHALL use ON DELETE RESTRICT to prevent deleting products with order history
3. THE Order_Items_Table SHALL store product_name as denormalized data for historical reference
4. WHEN a product is soft-deleted, THE Order_Items SHALL remain accessible with product_name
5. THE Checkout_System SHALL fetch product data from products table WHERE deleted_at IS NULL

### Requirement 21: Checkout Performance

**User Story:** Como cliente, quero que o checkout seja rápido, para que eu não espere muito para finalizar a compra.

#### Acceptance Criteria

1. THE Checkout_Page SHALL load cart summary within 1 second
2. THE Checkout_Page SHALL render form fields within 500ms
3. THE Order_Transaction SHALL complete within 3 seconds under normal conditions
4. THE Checkout_System SHALL use database indexes on user_id and order_id for fast queries
5. THE Checkout_Page SHALL prefetch cart data on page load (server-side rendering)

### Requirement 22: Order Number Display

**User Story:** Como cliente, quero ver um número de pedido único, para que eu possa referenciar meu pedido em comunicações.

#### Acceptance Criteria

1. THE Confirmation_Page SHALL display order_id as order number
2. THE order number SHALL be formatted as "Pedido #[first 8 chars of UUID]"
3. THE order number SHALL be copyable (click to copy functionality)
4. THE Confirmation_Page SHALL display full order_id in page metadata for support reference

### Requirement 23: Checkout Navigation and Breadcrumbs

**User Story:** Como cliente, quero navegar facilmente durante o checkout, para que eu possa voltar ao carrinho se necessário.

#### Acceptance Criteria

1. THE Checkout_Page SHALL display breadcrumb: Carrinho > Checkout
2. THE Checkout_Page SHALL display "Voltar ao Carrinho" link
3. WHEN user clicks "Voltar ao Carrinho", THE Checkout_System SHALL navigate to `/cart`
4. THE Checkout_Page SHALL display "Continuar Comprando" link to `/products`
5. THE Checkout_Page SHALL NOT display main navigation header (focused checkout experience)

