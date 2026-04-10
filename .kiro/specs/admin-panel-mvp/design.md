# Design Document - Admin Panel MVP

## Overview


This design document specifies the technical architecture for the Admin Panel MVP, a secure administrative interface for managing the Agon e-commerce platform. The system provides essential business operations including product management, order viewing, fulfillment tracking, and real-time dashboard metrics.

**Key Design Principles:**
- **Security First**: Multi-layer security (backend validation, RLS policies, frontend guards)
- **Layered Architecture**: Clear separation between Database → Services → Hooks → UI
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Data Integrity**: Database as single source of truth, webhook-driven updates
- **Performance**: Pagination, optimized queries, minimal payload sizes

**Scope:**
- Admin authentication and authorization
- Dashboard with real business metrics
- Product CRUD operations
- Order viewing and filtering
- Shipping/fulfillment management
- Webhook idempotency for payment updates

**Out of Scope (MVP):**
- Customer management interface
- Advanced analytics and reporting
- Bulk operations
- Email notifications
- Inventory forecasting

## Architecture

### System Architecture

The admin panel follows a strict layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  (React Components, Pages, Forms, Modals)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Hooks Layer                             │
│  (State Management, Data Fetching, Error Handling)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Services Layer                            │
│  (Business Logic, API Calls, Data Transformation)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Database Layer                             │
│  (Supabase, RLS Policies, RPC Functions)                    │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

Three-layer security model:

1. **Backend Validation (Primary Security)**
   - Validates admin role + email whitelist on every API call
   - Enforces business rules and data constraints
   - Returns structured error responses
   - Logs all security violations

2. **RLS Policies (Last Line of Defense)**
   - Database-level protection
   - Returns empty result set if violated
   - Prevents direct database access bypass

3. **Frontend Guards (UX Layer)**
   - Redirects unauthorized users
   - Provides user feedback
   - Does NOT provide security (can be bypassed)

### Data Flow

**Admin Dashboard Load:**
```
User → /admin → Frontend Guard → API /api/admin/dashboard
→ Backend Validation → adminService.getDashboardMetrics()
→ Database Query → Transform Data → Return JSON → Display
```

**Order Shipping Update:**
```
Admin → Update Shipping Form → Validate (Zod) → API /api/admin/orders/[id]/shipping
→ Backend Validation → Check payment approved → fulfillmentService.updateShipping()
→ Database Update → Webhook (if needed) → Return Success → Refresh UI
```

**Payment Webhook:**
```
Mercado Pago → POST /api/webhooks/mercadopago → Validate Signature
→ Check Idempotency → update_payment_from_webhook RPC
→ Update payments.status → Trigger updates orders.status → Clear cart → Return 200
```

### Query Optimization Notes

**Order List with Items (N+1 Prevention)**:
```typescript
// AVOID: N+1 query (fetches orders, then items separately for each)
const orders = await supabase.from('orders').select('*');
for (const order of orders) {
  const items = await supabase.from('order_items').select('*').eq('order_id', order.id);
}

// CORRECT: Single query with JOIN
const { data: orders } = await supabase
  .from('orders')
  .select(`
    id,
    user_id,
    status,
    total_amount,
    shipping_status,
    tracking_code,
    carrier,
    created_at,
    updated_at,
    order_items (
      id,
      product_name,
      quantity,
      size,
      product_price,
      subtotal
    ),
    payment:payments (
      status,
      payment_method
    )
  `)
  .order('created_at', { ascending: false })
  .range(offset, offset + pageSize - 1);
```

**Performance Considerations**:
- Use explicit column selection (avoid `SELECT *`)
- Limit nested data to essential fields only
- For large datasets (>1000 orders), consider:
  - Separate endpoint for order details (fetch on demand)
  - Virtual scrolling instead of pagination
  - Caching frequently accessed data

**Index Strategy** (already exists):
- `orders.created_at` - for sorting recent orders
- `orders.status` - for filtering by order status
- `orders.shipping_status` - for filtering by shipping status (NEW)
- `payments.status` - for filtering by payment status
- `products.deleted_at` - for filtering active products

### Design Decisions and Trade-offs

**1. Service Layer Coupling to Supabase**
- **Current**: Services call `createClient()` directly
- **Trade-off**: Simpler code, faster development vs. harder to test, harder to swap infrastructure
- **MVP Decision**: Accept coupling for speed
- **Future**: Inject database client as dependency for better testability

**2. Concurrency Control in Shipping Updates**
- **Current**: Last-write-wins (PostgreSQL default)
- **Trade-off**: Simple implementation vs. potential race condition if two admins update simultaneously
- **MVP Decision**: Accept race condition (rare in practice, UI disables button after click)
- **Mitigation**: Backend validates status progression (prevents invalid transitions)
- **Future**: Add optimistic locking with version column if needed

**3. JOIN Performance at Scale**
- **Current**: Fetch orders with items and payment in single query
- **Trade-off**: Fewer queries vs. larger payload size
- **MVP Decision**: Use JOIN for simplicity (works well up to ~1000 orders)
- **Mitigation**: Explicit column selection, pagination
- **Future**: Separate endpoint for order details if payload becomes too large

**4. Carrier as Free Text**
- **Current**: Free text field with autocomplete suggestions
- **Trade-off**: Flexibility vs. data quality
- **MVP Decision**: Accept free text for flexibility (new carriers, edge cases)
- **Mitigation**: UI autocomplete, backend trim/validate non-empty
- **Future**: Add normalization script or migrate to enum if data quality degrades

**5. Console Logging**
- **Current**: Structured console.log/error
- **Trade-off**: Simple setup vs. limited observability in production
- **MVP Decision**: Use console for speed (works with VPS stdout/stderr)
- **Mitigation**: Structured format makes migration easy
- **Future**: Migrate to proper logging service (Winston, Pino, CloudWatch)

**6. Trigger Performance (SELECT in Trigger)**
- **Current**: Trigger reads `payments.status` via SELECT query
- **Trade-off**: Simple implementation vs. potential latency on high-volume updates
- **MVP Decision**: Accept SELECT in trigger (works well for expected order volume)
- **Mitigation**: 1:1 relationship ensures single-row lookup, indexed by order_id
- **Future**: If performance becomes issue, denormalize payment_status into orders table or use materialized view

### Centralized Business Rules

**Order Status Derivation Rule**:
The logic for deriving `orders.status` from `payments.status` + `orders.shipping_status` is centralized in the database function `derive_order_status()`. This ensures consistency across all update paths:

1. **Trigger path** (shipping update): Calls `derive_order_status()` automatically
2. **RPC path** (payment webhook): MUST call `derive_order_status()` explicitly
3. **Manual query path** (if needed): Can call `derive_order_status()` directly

**Benefits of Centralization**:
- Single source of truth for status derivation logic
- Changes to derivation rules only need to be made in one place
- Impossible to have inconsistent derivation logic across different code paths
- Database function is testable independently

**Example Usage**:
```sql
-- In trigger (automatic)
NEW.status := derive_order_status(v_payment_status, NEW.shipping_status);

-- In RPC function (explicit)
UPDATE orders 
SET status = derive_order_status(p_new_payment_status, shipping_status)
WHERE id = v_order_id;

-- In manual query (if needed)
SELECT 
  id,
  derive_order_status(
    (SELECT status FROM payments WHERE order_id = orders.id),
    shipping_status
  ) as computed_status
FROM orders;
```

## Components and Interfaces

### Module Structure

```
apps/web/src/modules/admin/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardPage.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── RecentOrdersList.tsx
│   │   └── LoadingSkeleton.tsx
│   ├── Products/
│   │   ├── ProductsPage.tsx
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductFormModal.tsx
│   │   └── StockUpdateInput.tsx
│   ├── Orders/
│   │   ├── OrdersPage.tsx
│   │   ├── OrderTable.tsx
│   │   ├── OrderDetailsRow.tsx
│   │   ├── OrderFilters.tsx
│   │   └── OrderItemsList.tsx
│   ├── Fulfillment/
│   │   ├── ShippingUpdateModal.tsx
│   │   ├── ShippingStatusBadge.tsx
│   │   ├── TrackingDisplay.tsx
│   │   └── ShippingForm.tsx
│   └── shared/
│       ├── AdminLayout.tsx
│       ├── AdminNav.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useAdminDashboard.ts
│   ├── useAdminProducts.ts
│   ├── useAdminOrders.ts
│   ├── useAdminShipping.ts
│   └── useAdminAuth.ts
├── services/
│   ├── adminService.ts
│   ├── productService.ts
│   ├── orderService.ts
│   └── fulfillmentService.ts
├── types.ts
├── schemas.ts
└── constants.ts
```

### API Endpoints

**Admin Dashboard:**
- `GET /api/admin/dashboard` - Get dashboard metrics

**Product Management:**
- `GET /api/admin/products` - List products (paginated)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `PATCH /api/admin/products/[id]/stock` - Update stock
- `PATCH /api/admin/products/[id]/toggle` - Toggle active/inactive

**Order Management:**
- `GET /api/admin/orders` - List orders (paginated, filterable)
- `GET /api/admin/orders/[id]` - Get order details

**Fulfillment:**
- `PATCH /api/admin/orders/[id]/shipping` - Update shipping status

### Service Layer Interfaces

```typescript
// adminService.ts
interface DashboardMetrics {
  totalRevenue: number;
  orderCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  averageOrderValue: number;
  recentOrders: OrderSummary[];
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// productService.ts
interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

// orderService.ts
interface OrderListResult {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

// fulfillmentService.ts
interface ShippingUpdate {
  shippingStatus: 'pending' | 'processing' | 'shipped' | 'delivered';
  trackingCode?: string;
  carrier?: string;
}
```

### Hook Interfaces

```typescript
// useAdminDashboard.ts
interface UseAdminDashboardReturn {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// useAdminProducts.ts
interface UseAdminProductsReturn {
  products: Product[];
  total: number;
  page: number;
  isLoading: boolean;
  error: Error | null;
  createProduct: (data: ProductInput) => Promise<void>;
  updateProduct: (id: string, data: ProductInput) => Promise<void>;
  toggleProduct: (id: string) => Promise<void>;
  updateStock: (id: string, stock: number) => Promise<void>;
  goToPage: (page: number) => void;
}

// useAdminOrders.ts
interface UseAdminOrdersReturn {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  filters: OrderFilters;
  isLoading: boolean;
  error: Error | null;
  setFilters: (filters: OrderFilters) => void;
  goToPage: (page: number) => void;
  refetch: () => Promise<void>;
}

// useAdminShipping.ts
interface UseAdminShippingReturn {
  updateShipping: (orderId: string, update: ShippingUpdate) => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
}
```

## Data Models

### Database Schema Changes

**New Migration: `20250409_admin_panel_shipping_fields.sql`**

```sql
-- Add shipping fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Create index for shipping status queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Add constraint: tracking_code and carrier required when shipped
ALTER TABLE orders 
ADD CONSTRAINT orders_shipping_fields_check 
CHECK (
  (shipping_status IN ('shipped', 'delivered') AND tracking_code IS NOT NULL AND carrier IS NOT NULL)
  OR (shipping_status IN ('pending', 'processing'))
);

-- Create function to derive orders.status from payment + shipping
CREATE OR REPLACE FUNCTION derive_order_status(
  p_payment_status TEXT,
  p_shipping_status TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If payment rejected/cancelled/refunded → cancelled
  IF p_payment_status IN ('rejected', 'cancelled', 'refunded') THEN
    RETURN 'cancelled';
  END IF;
  
  -- If payment pending → pending
  IF p_payment_status = 'pending' THEN
    RETURN 'pending';
  END IF;
  
  -- If payment approved, derive from shipping
  IF p_payment_status = 'approved' THEN
    CASE p_shipping_status
      WHEN 'pending' THEN RETURN 'processing';
      WHEN 'processing' THEN RETURN 'processing';
      WHEN 'shipped' THEN RETURN 'shipped';
      WHEN 'delivered' THEN RETURN 'delivered';
      ELSE RETURN 'processing';
    END CASE;
  END IF;
  
  -- Default
  RETURN 'pending';
END;
$$ LANGUAGE plpgsql STABLE; -- STABLE: depends on database state (payments table)

-- Create trigger to auto-update orders.status when shipping_status changes
CREATE OR REPLACE FUNCTION update_order_status_on_shipping_change()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  -- Get payment status (1:1 relationship enforced by UNIQUE constraint)
  SELECT status INTO v_payment_status
  FROM payments
  WHERE order_id = NEW.id
  LIMIT 1; -- Safety: ensure single result even if constraint not yet applied
  
  -- If no payment found, keep current status
  IF v_payment_status IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Update orders.status based on payment + shipping
  NEW.status := derive_order_status(v_payment_status, NEW.shipping_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_status_on_shipping
  BEFORE UPDATE OF shipping_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_shipping_change();

-- Ensure 1:1 relationship between orders and payments (prevents multiple payments per order)
-- Note: This constraint already exists in payments table (order_id UNIQUE)
-- Verify with: SELECT constraint_name FROM information_schema.table_constraints 
--              WHERE table_name = 'payments' AND constraint_type = 'UNIQUE';

-- Defensive check: Add assertion function to validate 1:1 relationship (optional, for extra safety)
CREATE OR REPLACE FUNCTION assert_single_payment_per_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_payment_count
  FROM payments
  WHERE order_id = p_order_id;
  
  IF v_payment_count > 1 THEN
    RAISE EXCEPTION 'Data integrity violation: Order % has % payments (expected 1)', 
      p_order_id, v_payment_count;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION assert_single_payment_per_order IS 'Defensive check: validates 1:1 order-payment relationship. MUST be called in update_payment_from_webhook RPC before updating payment status.';

-- Update existing RPC function update_payment_from_webhook to also update orders.status
-- The RPC function MUST execute atomically (single transaction):
-- 1. Call assert_single_payment_per_order(v_order_id) FIRST (defensive check)
-- 2. Update payments.status
-- 3. Call derive_order_status(p_status, shipping_status) to update orders.status
-- 4. Clear cart (if payment approved)
-- 5. All operations MUST succeed or fail together (automatic rollback on error)
--
-- Example modification (to be applied to existing RPC):
-- 
-- BEGIN -- Start transaction
--   -- Defensive check
--   PERFORM assert_single_payment_per_order(v_order_id);
--   
--   -- Update payment status
--   UPDATE payments SET status = p_status WHERE order_id = v_order_id;
--   
--   -- Update order status (CRITICAL: must happen in same transaction)
--   UPDATE orders 
--   SET status = derive_order_status(p_status, shipping_status) 
--   WHERE id = v_order_id;
--   
--   -- Clear cart if approved
--   IF p_status = 'approved' THEN
--     DELETE FROM cart_items WHERE user_id = v_user_id;
--   END IF;
-- EXCEPTION
--   WHEN OTHERS THEN
--     RAISE; -- Rollback transaction
-- END;
--
-- This ensures orders.status is updated when payment status changes via webhook
-- Without this, orders.status would only update when shipping_status changes (incomplete)

-- Add comments
COMMENT ON COLUMN orders.shipping_status IS 'Fulfillment status managed by admin (independent of payment status)';
COMMENT ON COLUMN orders.tracking_code IS 'Tracking code from carrier (required when shipped)';
COMMENT ON COLUMN orders.carrier IS 'Carrier name (free text, e.g., Correios, Jadlog)';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped';
COMMENT ON COLUMN orders.status IS 'Derived summary status (auto-updated by trigger from payment + shipping)';
COMMENT ON FUNCTION derive_order_status IS 'Derives orders.status from payments.status + orders.shipping_status';
```

### TypeScript Types

```typescript
// types.ts

export type PaymentStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'refunded' 
  | 'in_process';

export type ShippingStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered';

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus; // PERSISTED: Derived and updated by trigger/RPC when payment or shipping changes
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone: string;
  shippingEmail: string;
  paymentMethod: string;
  shippingStatus: ShippingStatus; // NEW
  trackingCode: string | null; // NEW
  carrier: string | null; // NEW
  shippedAt: string | null; // NEW
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  payment: Payment;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  subtotal: number;
}

export interface Payment {
  id: string;
  orderId: string;
  mercadopagoPaymentId: string | null;
  mercadopagoPreferenceId: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sizes: string[];
  images: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  orderCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  averageOrderValue: number;
  recentOrders: OrderSummary[];
}

export interface OrderSummary {
  id: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

### Zod Schemas

```typescript
// schemas.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  sizes: z.array(z.string()).min(1, 'At least one size required'),
  images: z.array(z.string().url()).min(1, 'At least one image required'),
});

export const shippingUpdateSchema = z.object({
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered']),
  trackingCode: z.string().optional(),
  carrier: z.string().optional(),
}).refine(
  (data) => {
    if (data.shippingStatus === 'shipped' || data.shippingStatus === 'delivered') {
      return data.trackingCode && data.carrier;
    }
    return true;
  },
  {
    message: 'Tracking code and carrier are required when status is shipped or delivered',
    path: ['trackingCode'],
  }
);

export const stockUpdateSchema = z.object({
  stock: z.number().int().min(0, 'Stock must be non-negative'),
});

export const orderFiltersSchema = z.object({
  paymentStatus: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process']).optional(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ShippingUpdateInput = z.infer<typeof shippingUpdateSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
```

### Webhook Idempotency

**Idempotency Key**: `mercadopago_payment_id` (unique identifier from Mercado Pago)

**Idempotency Mechanism**:
1. Webhook receives `paymentId` from Mercado Pago
2. Fetch payment record from database by `order_id` (from external_reference)
3. Compare `payments.status` with incoming `paymentDetails.status`
4. If statuses match → return 200 with `{received: true, skipped: true}` (no database update)
5. If statuses differ → proceed with update via RPC function

**Why This Works**:
- `mercadopago_payment_id` is unique per payment
- Status comparison prevents duplicate updates
- RPC function `update_payment_from_webhook` is already idempotent (checks status before updating)
- Multiple webhooks with same status are safely ignored

**Race Condition Handling**:
- RPC function uses database transaction (automatic rollback on error)
- Status check happens inside transaction (consistent read)
- If two webhooks arrive simultaneously, second one will see updated status and skip

**Cart Clearing Behavior**:
- Cart is cleared ONLY when `payments.status` changes to 'approved'
- Clearing happens inside RPC function transaction (atomic with payment update)
- If user has multiple devices, cart will be cleared on all devices (database-level operation)
- If cart was already cleared (e.g., by duplicate webhook), operation is idempotent (DELETE with no matching rows succeeds)

**Orders.status Update (CRITICAL)**:
- Webhook RPC function `update_payment_from_webhook` MUST update `orders.status` after updating `payments.status`
- Use `derive_order_status(new_payment_status, current_shipping_status)` to calculate new status
- This ensures `orders.status` stays consistent when payment status changes
- Without this, `orders.status` would only update when shipping changes (incomplete)

**Example Flow**:
```
Webhook 1: payment_id=123, status=approved 
  → Update payments.status = 'approved'
  → Update orders.status = derive_order_status('approved', 'pending') = 'processing'
  → Clear cart 
  → Return 200

Webhook 2: payment_id=123, status=approved 
  → Check DB (already approved) 
  → Skip 
  → Return 200 {skipped: true}
```

## Error Handling

### Error Response Standard

All API endpoints return structured errors:

```typescript
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User not admin or not in whitelist |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `BUSINESS_RULE_VIOLATION` | 400 | Business rule violated (e.g., ship unpaid order) |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Handling Patterns

**Backend Validation:**
```typescript
// Middleware: validateAdmin
export async function validateAdmin(req: NextRequest): Promise<AdminUser | ApiErrorResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    };
  }
  
  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    console.log('[SECURITY] Non-admin access attempt:', {
      timestamp: new Date().toISOString(),
      user_email: user.email,
      endpoint: req.url,
    });
    
    return {
      code: 'FORBIDDEN',
      message: 'Admin access required',
    };
  }
  
  // Check whitelist
  const whitelist = [
    process.env.ADMIN_EMAIL_PRIMARY,
    process.env.ADMIN_EMAIL_BACKUP,
  ].filter(Boolean);
  
  if (!whitelist.includes(user.email)) {
    console.log('[SECURITY] Email not in whitelist:', {
      timestamp: new Date().toISOString(),
      user_email: user.email,
      endpoint: req.url,
    });
    
    return {
      code: 'FORBIDDEN',
      message: 'Access denied',
    };
  }
  
  return {
    id: user.id,
    email: user.email!,
    role: 'admin',
  };
}
```

**Service Layer:**
```typescript
export const fulfillmentService = {
  async updateShipping(
    orderId: string,
    update: ShippingUpdateInput
  ): Promise<ServiceResult<Order>> {
    try {
      const supabase = createClient();
      
      // Fetch order with payment
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, shipping_status, payment:payments(status)')
        .eq('id', orderId)
        .single();
      
      if (fetchError || !order) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Order not found',
          },
        };
      }
      
      // Type guard for payment
      if (!order.payment || !('status' in order.payment)) {
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Order payment data missing',
          },
        };
      }
      
      // Business rule: cannot ship unpaid order
      if (update.shippingStatus === 'shipped' && order.payment.status !== 'approved') {
        return {
          success: false,
          error: {
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Cannot ship order with unapproved payment',
          },
        };
      }
      
      // Business rule: no status regression
      const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
      const currentIndex = statusOrder.indexOf(order.shipping_status);
      const newIndex = statusOrder.indexOf(update.shippingStatus);
      
      if (newIndex < currentIndex) {
        return {
          success: false,
          error: {
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Cannot regress shipping status',
          },
        };
      }
      
      // Build update data with proper typing
      interface ShippingUpdateData {
        shipping_status: ShippingStatus;
        tracking_code?: string;
        carrier?: string;
        shipped_at?: string;
      }
      
      const updateData: ShippingUpdateData = {
        shipping_status: update.shippingStatus,
      };
      
      if (update.trackingCode) updateData.tracking_code = update.trackingCode;
      if (update.carrier) updateData.carrier = update.carrier;
      if (update.shippingStatus === 'shipped' && !order.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }
      
      // Update order (orders.status will be auto-updated by trigger)
      // Note: Potential race condition if two admins update simultaneously
      // Mitigation: UI should disable button after click, backend validates status progression
      // For MVP: Accept last-write-wins behavior (PostgreSQL default)
      // Future: Add optimistic locking with version column if needed
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
      
      if (updateError) {
        console.error('[ERROR] Failed to update shipping:', {
          timestamp: new Date().toISOString(),
          order_id: orderId,
          error: updateError.message,
        });
        
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update shipping status',
          },
        };
      }
      
      return {
        success: true,
        data: transformOrderRow(updated),
      };
      
    } catch (error) {
      const err = error as Error;
      console.error('[ERROR] Unexpected error in updateShipping:', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    }
  },
};
```

**Frontend Error Display:**
```typescript
// useAdminShipping.ts
export function useAdminShipping() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const updateShipping = async (orderId: string, update: ShippingUpdateInput) => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.message);
      }
      
      toast.success('Shipping status updated successfully');
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(error.message || 'Failed to update shipping status');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };
  
  return { updateShipping, isUpdating, error };
}
```

### Logging Standard

All logs follow structured format with optional correlation ID for request tracing:

```typescript
// Structured logging helper with correlation ID support
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  correlation_id?: string; // Optional: for tracing request → webhook → update flow
  user_email?: string;
  endpoint?: string;
  action: string;
  details?: Record<string, unknown>;
  error?: string;
}

function log(entry: LogEntry): void {
  const logMessage = `[${entry.level}] ${entry.action}`;
  const logData = {
    timestamp: entry.timestamp || new Date().toISOString(),
    ...entry,
  };
  
  if (entry.level === 'ERROR' || entry.level === 'SECURITY') {
    console.error(logMessage, logData);
  } else {
    console.log(logMessage, logData);
  }
}

// Correlation ID generation (optional, for request tracing)
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Usage examples
log({
  timestamp: new Date().toISOString(),
  level: 'SECURITY',
  user_email: user.email,
  endpoint: req.url,
  action: 'admin_access_denied',
  details: { reason: 'not_in_whitelist' },
});

// Webhook with correlation ID (for tracing payment flow)
const correlationId = request.headers.get('x-request-id') || generateCorrelationId();
log({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  correlation_id: correlationId,
  endpoint: '/api/webhooks/mercadopago',
  action: 'webhook_received',
  details: { payment_id: paymentId, status: paymentDetails.status },
});

// Later in the same flow (after RPC completes)
log({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  correlation_id: correlationId,
  action: 'payment_status_updated',
  details: { order_id: orderId, old_status: oldStatus, new_status: newStatus },
});

// Note: correlation_id is NOT propagated to database in MVP
// Future enhancement: Pass correlation_id to RPC function as parameter
// and include in RPC logs for complete end-to-end tracing
```

**Correlation ID Strategy (Optional Enhancement)**:
- Use Mercado Pago's `x-request-id` header as correlation ID
- Pass correlation ID through webhook → backend logs
- **MVP Limitation**: correlation_id is NOT propagated to database/RPC in MVP
- **Future Enhancement**: Pass correlation_id to RPC function as parameter and include in RPC logs
- Enables complete tracing: webhook received → RPC called → payment updated → order status derived → cart cleared
- Useful for debugging payment flow issues in production
- MVP: Can be added incrementally without breaking existing code

**MVP Logging Strategy**:
- Use structured console logging (easy to migrate to proper logging service later)
- Include all required fields: timestamp, user_email, endpoint, action, error
- Consistent format makes it easy to grep/search in production logs
- Future migration path: Replace `console.log/error` with logging service client (e.g., Winston, Pino)

### Carrier Standardization

**MVP Approach**: Free text with validation

```typescript
// Carrier validation (not enum, but with suggestions)
const COMMON_CARRIERS = [
  'Correios',
  'Jadlog',
  'Total Express',
  'Azul Cargo',
  'Loggi',
] as const;

// In UI: Show autocomplete with common carriers, but allow custom input
// In backend: Validate non-empty, trim whitespace, no validation against enum

// Future improvement: Normalize carrier names
// Example: "correios", "CORREIOS", "Correios PAC" → all become "Correios"
```

**Why Free Text for MVP**:
- Flexibility for new carriers without code changes
- Admin can handle edge cases (e.g., "Correios + Motoboy")
- Avoids blocking operations due to strict enum

**Data Quality Mitigation**:
- UI provides autocomplete with common carriers
- Backend trims whitespace and validates non-empty
- Future: Add carrier normalization/cleanup script if needed

## Testing Strategy

### Unit Tests

**Service Layer Tests:**
- Test each service function with valid inputs
- Test error handling for invalid inputs
- Test business rule enforcement
- Mock Supabase client

**Hook Tests:**
- Test state management
- Test loading/error states
- Test data fetching
- Mock service layer

**Component Tests:**
- Test rendering with different props
- Test user interactions
- Test form validation
- Mock hooks

**Example Tests:**
```typescript
// productService.test.ts
describe('productService.createProduct', () => {
  it('should create product with valid data', async () => {
    const input: ProductInput = {
      name: 'Test Product',
      description: 'Test description',
      price: 99.99,
      stock: 10,
      category: 'test',
      sizes: ['M', 'L'],
      images: ['https://example.com/image.jpg'],
    };
    
    const result = await productService.createProduct(input);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: 'Test Product',
      price: 99.99,
    });
  });
  
  it('should reject product with negative price', async () => {
    const input: ProductInput = {
      name: 'Test Product',
      description: 'Test description',
      price: -10,
      stock: 10,
      category: 'test',
      sizes: ['M'],
      images: ['https://example.com/image.jpg'],
    };
    
    const result = await productService.createProduct(input);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});

// fulfillmentService.test.ts
describe('fulfillmentService.updateShipping', () => {
  it('should prevent shipping unpaid order', async () => {
    const orderId = 'test-order-id';
    const update: ShippingUpdateInput = {
      shippingStatus: 'shipped',
      trackingCode: 'ABC123',
      carrier: 'Correios',
    };
    
    // Mock order with pending payment
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: orderId,
              shipping_status: 'pending',
              payment: { status: 'pending' },
            },
            error: null,
          }),
        }),
      }),
    });
    
    const result = await fulfillmentService.updateShipping(orderId, update);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('BUSINESS_RULE_VIOLATION');
  });
  
  it('should prevent status regression', async () => {
    const orderId = 'test-order-id';
    const update: ShippingUpdateInput = {
      shippingStatus: 'pending',
    };
    
    // Mock order already shipped
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: orderId,
              shipping_status: 'shipped',
              payment: { status: 'approved' },
            },
            error: null,
          }),
        }),
      }),
    });
    
    const result = await fulfillmentService.updateShipping(orderId, update);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('BUSINESS_RULE_VIOLATION');
  });
});
```

### Integration Tests

**API Endpoint Tests:**
- Test authentication/authorization
- Test request validation
- Test response format
- Test error handling

**Example:**
```typescript
// /api/admin/orders/[id]/shipping.test.ts
describe('PATCH /api/admin/orders/[id]/shipping', () => {
  it('should return 403 for non-admin user', async () => {
    const response = await fetch('/api/admin/orders/test-id/shipping', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nonAdminToken}`,
      },
      body: JSON.stringify({
        shippingStatus: 'shipped',
        trackingCode: 'ABC123',
        carrier: 'Correios',
      }),
    });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe('FORBIDDEN');
  });
  
  it('should update shipping for admin user', async () => {
    const response = await fetch('/api/admin/orders/test-id/shipping', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        shippingStatus: 'shipped',
        trackingCode: 'ABC123',
        carrier: 'Correios',
      }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.shippingStatus).toBe('shipped');
    expect(data.trackingCode).toBe('ABC123');
  });
});
```

### Manual Testing Checklist

**Security:**
- [ ] Non-authenticated user cannot access /admin
- [ ] Authenticated non-admin cannot access /admin
- [ ] Admin not in whitelist cannot access /admin
- [ ] Direct API calls without auth return 401
- [ ] Direct API calls with non-admin return 403

**Dashboard:**
- [ ] Metrics display correct values
- [ ] Recent orders list shows latest 10
- [ ] Currency formatted as BRL
- [ ] Dates formatted as DD/MM/YYYY HH:mm
- [ ] Loading skeleton displays during fetch
- [ ] Error message displays on fetch failure

**Products:**
- [ ] Product list displays all products
- [ ] Pagination works correctly
- [ ] Create product form validates inputs
- [ ] Product created successfully
- [ ] Product updated successfully
- [ ] Product toggle active/inactive works
- [ ] Stock update works
- [ ] Soft-deleted products hidden from customer catalog

**Orders:**
- [ ] Order list displays all orders
- [ ] Pagination works correctly
- [ ] Filter by payment status works
- [ ] Filter by shipping status works
- [ ] Order details expand correctly
- [ ] Order items display correctly
- [ ] Shipping address displays correctly

**Fulfillment:**
- [ ] Cannot ship unpaid order (button disabled)
- [ ] Shipping update modal requires tracking code and carrier
- [ ] Shipping status updates correctly
- [ ] Tracking code and carrier display correctly
- [ ] Cannot regress shipping status
- [ ] shipped_at timestamp set correctly

**Webhook:**
- [ ] Webhook validates signature
- [ ] Webhook rejects invalid signature
- [ ] Webhook updates payment status
- [ ] Webhook updates order status
- [ ] Webhook clears cart on approval
- [ ] Webhook is idempotent (duplicate webhooks handled)


---

## Why Property-Based Testing Is Not Applicable

Property-based testing (PBT) is NOT appropriate for the Admin Panel MVP feature because:

1. **CRUD Operations**: The feature primarily consists of Create, Read, Update, Delete operations on products, orders, and shipping data. These are specific database operations, not universal properties that hold across all inputs.

2. **UI Rendering**: Dashboard metrics, product tables, order lists, and forms are UI components. PBT does not apply to visual rendering and layout.

3. **Side-Effect Operations**: Updating shipping status, toggling product active/inactive, and clearing carts are side-effect operations with no return value to assert universal properties on.

4. **Configuration and Authorization**: Admin authentication, role checking, and whitelist validation are configuration checks, not algorithmic transformations.

5. **No Universal Properties**: There are no meaningful "for all inputs X, property P(X) holds" statements for admin panel operations. Each operation is specific to its context (e.g., "update shipping status for order ID X" is not a universal property).

**Testing Strategy Instead:**
- **Unit tests** for service layer functions (business logic, validation, error handling)
- **Integration tests** for API endpoints (authentication, authorization, request/response)
- **Component tests** for UI rendering and user interactions
- **Manual testing** for end-to-end workflows

This approach provides comprehensive coverage without forcing PBT where it doesn't apply.

