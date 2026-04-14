# Admin Orders Redesign — Implementation Plan

**Goal:** Replace the current admin orders page with a split-view layout (list left, detail right) featuring search, infinite scroll, and an override flow for unpaid orders.

**Architecture:** Single page route (`/admin/orders`) rendering `OrdersSplitView`. New components in `modules/admin/components/Orders/`. Backend changes: add `search` param to orders list API; add `forceOverride` flag to shipping PATCH endpoint.

**Tech Stack:** Next.js 15 App Router, Supabase (admin client), React Query-free hooks (existing pattern), Tailwind + shadcn primitives, Vitest.

---

## Task 1 — Backend: search param + forceOverride flag

**Files:**
- Modify: `apps/web/src/modules/admin/schemas.ts` (add `search` to `orderFiltersSchema`, add `forceOverride` to `shippingUpdateSchema`)
- Modify: `apps/web/src/modules/admin/services/orderService.ts` (apply search filter on name OR id)
- Modify: `apps/web/src/modules/admin/services/fulfillmentService.ts` (skip payment rule when `forceOverride=true`, keep progression rule)
- Modify: `apps/web/src/app/api/admin/orders/route.ts` (pass through `search`)
- Modify: `apps/web/src/app/api/admin/orders/[id]/shipping/route.ts` (accept `forceOverride`)

**Steps:**
- [ ] Extend `orderFiltersSchema` with `search: z.string().optional()`
- [ ] Extend `shippingUpdateSchema` with `forceOverride: z.boolean().optional().default(false)`
- [ ] In `listOrders`, when `search` present: apply `.or(\`shipping_name.ilike.%${search}%,id::text.ilike.${search}%\`)` — match name case-insensitive OR id prefix
- [ ] In `updateShipping`, if `forceOverride === true` skip the `PAYMENT_NOT_APPROVED` check; keep progression + tracking checks
- [ ] In `GET /api/admin/orders`, read `search` from `searchParams` and pass to validation
- [ ] Commit: `feat(admin): add search and force-override to orders API`

---

## Task 2 — Hook: `useOrdersList` with infinite scroll + search

**Files:**
- Create: `apps/web/src/modules/admin/hooks/useOrdersList.ts`

**Contract:**
```ts
export function useOrdersList() {
  // Returns: orders, loading, error, hasMore, loadMore, setSearch, setFilters, filters, refresh, selectedId, select(id)
}
```

**Steps:**
- [ ] Implement with `useState` for orders array (appended on loadMore), `page`, `hasMore`, `loading`, `error`, `search`, `filters`, `selectedId`
- [ ] Debounce search input (300ms) via `useEffect` + `setTimeout`
- [ ] On search/filter change: reset page=1, replace list
- [ ] On loadMore: fetch next page, append
- [ ] Subscribe to Supabase Realtime `orders` INSERT/UPDATE (reuse channel name `admin-orders-list`), on INSERT prepend, on UPDATE patch item in place
- [ ] Commit: `feat(admin): add useOrdersList hook with search and infinite scroll`

---

## Task 3 — Components: list side

**Files:**
- Create: `apps/web/src/modules/admin/components/Orders/OrdersSplitView.tsx` (layout shell)
- Create: `apps/web/src/modules/admin/components/Orders/OrdersListPanel.tsx` (left panel)
- Create: `apps/web/src/modules/admin/components/Orders/OrderListItem.tsx`
- Create: `apps/web/src/modules/admin/components/Orders/OrdersSearchBar.tsx` (search input + filter dropdowns)

**Steps:**
- [ ] `OrdersSplitView`: grid `grid-cols-[380px_1fr] h-[calc(100vh-64px)]`; left=`OrdersListPanel`, right=`OrderDetailPanel` (Task 4)
- [ ] `OrdersListPanel`: renders `OrdersSearchBar` at top, then scrollable list of `OrderListItem`; Intersection Observer on sentinel at bottom triggers `loadMore`
- [ ] `OrderListItem`: shows `●` colored dot by shipping status, customer name, city, short id (8 chars), value (BRL), `há Xh/d` since createdAt; two badges (shipping + payment) right-aligned; orange left-border when payment=pending & `createdAt < now-24h`; `bg-muted` when selected; clicking badge selects order and scrolls detail to shipping section
- [ ] `OrdersSearchBar`: text input (search), select (paymentStatus), select (shippingStatus), "Limpar filtros" button
- [ ] Commit: `feat(admin): add split-view list components`

---

## Task 4 — Components: detail side

**Files:**
- Create: `apps/web/src/modules/admin/components/Orders/OrderDetailPanel.tsx`
- Create: `apps/web/src/modules/admin/components/Orders/OrderDetailHeader.tsx`
- Create: `apps/web/src/modules/admin/components/Orders/OrderItemsTable.tsx`
- Create: `apps/web/src/modules/admin/components/Orders/OrderAddressBlock.tsx` (with copy button)
- Create: `apps/web/src/modules/admin/components/Orders/ShippingUpdateForm.tsx` (new — override flow)
- Create: `apps/web/src/modules/admin/components/Orders/StatusHistory.tsx` (compact list)

**Steps:**
- [ ] `OrderDetailPanel`: accepts `order: OrderWithDetails | null`; when null shows empty state ("Selecione um pedido"); else renders header/items/address/shipping stacked
- [ ] `OrderDetailHeader`: id+name+date row, value+method+payment badge row
- [ ] `OrderItemsTable`: compact table with columns Produto / Tamanho / Qtd / Subtotal; totals row
- [ ] `OrderAddressBlock`: formatted address with `Copiar` button (`navigator.clipboard`), icon swaps to ✓ for 2s on success
- [ ] `ShippingUpdateForm`: 
  - Status select (options after current locked/disabled; no regression)
  - Carrier select + tracking input shown only when status ∈ {shipped, delivered}
  - If `payment.status !== 'approved'` AND new status > current: show amber warning block + change primary button label to "Salvar mesmo assim" (destructive variant); send `forceOverride: true`
  - On success: inline success badge "✓ Salvo" for 3s; parent refetches detail
- [ ] `StatusHistory`: fetches/derives from order.updatedAt + shippedAt + createdAt. Simple compact list (`dd/MM HH:mm · Status`). Since no audit table exists, show only: created → shipped_at (when set). Mark inferred entries with a subtle subtitle.
- [ ] Commit: `feat(admin): add split-view detail panel components`

---

## Task 5 — Wire up page + remove legacy

**Files:**
- Modify: `apps/web/src/app/admin/orders/page.tsx` → render `OrdersSplitView`
- Delete: `apps/web/src/modules/admin/components/Orders/OrdersPage.tsx`
- Delete: `apps/web/src/modules/admin/components/Orders/OrderTable.tsx`
- Delete: `apps/web/src/modules/admin/components/Orders/OrderDetailsRow.tsx`
- Delete: `apps/web/src/modules/admin/components/Orders/OrderFilters.tsx`
- Delete: `apps/web/src/modules/admin/components/Fulfillment/ShippingUpdateModal.tsx`
- Delete: `apps/web/src/modules/admin/components/Fulfillment/ShippingForm.tsx`
- Keep: `ShippingStatusBadge.tsx`, `TrackingDisplay.tsx`, `OrderItemsList.tsx` if reused; otherwise delete

**Steps:**
- [ ] Swap page entry to new component
- [ ] Delete legacy files; run `npx tsc --noEmit` to confirm no dangling imports
- [ ] Commit: `refactor(admin): remove legacy orders UI`

---

## Task 6 — Tests

**Files:**
- Create: `apps/web/src/modules/admin/services/__tests__/fulfillmentService.forceOverride.test.ts`
- Create: `apps/web/src/modules/admin/services/__tests__/orderService.search.test.ts`

**Steps:**
- [ ] Test: `updateShipping` with `forceOverride=true` bypasses payment check when payment is `pending`, still enforces progression
- [ ] Test: `updateShipping` with `forceOverride=false` (default) still returns `PAYMENT_NOT_APPROVED`
- [ ] Test: `listOrders` with `search` filters by name (ilike) — mock supabase builder
- [ ] Run `npm test` in `apps/web`, confirm all pass
- [ ] Commit: `test(admin): cover search and force-override paths`

---

## Task 7 — Verify + push

- [ ] `cd apps/web && npx tsc --noEmit`
- [ ] `cd apps/web && npm test`
- [ ] `git push origin main`
