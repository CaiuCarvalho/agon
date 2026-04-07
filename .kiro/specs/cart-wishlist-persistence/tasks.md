# Implementation Plan: Cart and Wishlist Persistence

## Overview

This implementation plan converts the Cart and Wishlist Persistence design into actionable coding tasks. The feature replaces mock implementations with real Supabase persistence, enabling authenticated users to maintain shopping carts and wishlists synchronized across devices while providing localStorage-based functionality for guests with automatic migration upon login.

Implementation follows a five-phase approach: Database Setup → Services Layer → Hooks Layer → UI Integration → Testing. Each task builds incrementally, with checkpoints to ensure stability before proceeding.

## Tasks

- [x] 1. Phase 1: Database Setup
  - [x] 1.1 Create cart_items table with price snapshots and RLS policies
    - Create cart_items table with fields: id, user_id, product_id, quantity, size, price_snapshot, product_name_snapshot, created_at, updated_at
    - Add CHECK constraints for quantity (1-99) and size (1-10 chars)
    - Add UNIQUE constraint on (user_id, product_id, size)
    - Add foreign keys with CASCADE delete for user_id and product_id
    - Create indexes on user_id, product_id, and updated_at
    - Create trigger to auto-update updated_at timestamp
    - Apply RLS policies for SELECT, INSERT, UPDATE, DELETE (user_id = auth.uid())
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.3, 12.5, 14.1, 14.3, 16.1, 16.2_

  - [x] 1.2 Create wishlist_items table with RLS policies
    - Create wishlist_items table with fields: id, user_id, product_id, created_at
    - Add UNIQUE constraint on (user_id, product_id)
    - Add foreign keys with CASCADE delete for user_id and product_id
    - Create indexes on user_id, product_id, and created_at
    - Apply RLS policies for SELECT, INSERT, DELETE (user_id = auth.uid())
    - _Requirements: 7.1, 7.2, 7.3, 11.1, 11.2, 11.3, 11.4, 12.2, 12.4, 12.6, 14.2, 14.4_

  - [x] 1.3 Create wishlist limit enforcement trigger
    - Create check_wishlist_limit() function that raises exception if user has 20+ items
    - Create BEFORE INSERT trigger on wishlist_items to enforce 20-item limit atomically
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.4 Create atomic RPC function for cart migration
    - Create migrate_cart_items(p_user_id UUID, p_items JSONB) function
    - Implement transactional loop that fetches product details for price snapshots
    - Use INSERT ... ON CONFLICT DO UPDATE to sum quantities (capped at 99)
    - Return JSONB with success status and migrated_count
    - Handle errors with automatic rollback
    - _Requirements: 3.1, 3.2, 3.3, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 1.5 Create atomic RPC function for wishlist migration
    - Create migrate_wishlist_items(p_user_id UUID, p_items JSONB) function
    - Check current wishlist count and enforce 20-item limit
    - Use INSERT ... ON CONFLICT DO NOTHING for idempotency
    - Return JSONB with success status, migrated_count, and skipped_count
    - Handle errors with automatic rollback
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 1.6 Create atomic RPC function for add-to-cart operation
    - Create add_to_cart_atomic(p_user_id UUID, p_product_id UUID, p_quantity INTEGER, p_size TEXT) function
    - Fetch product details (price, name) for snapshot
    - Use INSERT ... ON CONFLICT DO UPDATE to sum quantities (capped at 99)
    - Return JSONB with success status and cart item data
    - Handle product not found and other errors
    - _Requirements: 1.1, 14.3, 14.5_

  - [ ]* 1.7 Test CASCADE delete behavior
    - Write integration test to verify cart_items are deleted when product is deleted
    - Write integration test to verify wishlist_items are deleted when product is deleted
    - Write integration test to verify cart_items are deleted when user is deleted
    - Write integration test to verify wishlist_items are deleted when user is deleted
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

- [ ] 2. Checkpoint - Verify database setup
  - Ensure all tables, triggers, and RPC functions are created successfully
  - Test RLS policies manually with different users
  - Ask the user if questions arise

- [x] 3. Phase 2: Services Layer
  - [x] 3.1 Create TypeScript data models and Zod schemas
    - Define CartItem, WishlistItem, CartItemInput, WishlistItemInput interfaces
    - Define CartItemRow, WishlistItemRow (snake_case database types)
    - Define LocalStorageCart, LocalStorageWishlist interfaces with version field
    - Define OptimisticState, MigrationResult, MigrationStatus types
    - Define CartRealtimeEvent interface with operation type and delta
    - Create Zod schemas: cartItemSchema, wishlistItemSchema, cartItemUpdateSchema
    - Create Zod schemas: localStorageCartSchema, localStorageWishlistSchema
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 3.2 Implement cartService with atomic operations
    - Create apps/web/src/modules/cart/services/cartService.ts
    - Implement getCartItems(userId) with JOIN to products table
    - Implement addToCart(userId, input) using add_to_cart_atomic RPC
    - Implement updateCartItem(userId, itemId, updates) with validation
    - Implement removeFromCart(userId, itemId) with user ownership check
    - Implement clearCart(userId)
    - Implement getCartSummary(userId) with price change detection
    - Implement withRetry() helper using PostgreSQL error codes (PGRST301, PGRST504, 08000, 08003, 08006, 57P03)
    - Implement transformCartItemRow() helper for snake_case to camelCase conversion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 22.4_

  - [x] 3.3 Implement wishlistService with limit enforcement
    - Create apps/web/src/modules/wishlist/services/wishlistService.ts
    - Implement getWishlistItems(userId) with JOIN to products table
    - Implement addToWishlist(userId, input) with 20-item limit error handling
    - Handle unique constraint violation (23505) gracefully by returning existing item
    - Implement removeFromWishlist(userId, itemId) with user ownership check
    - Implement removeFromWishlistByProductId(userId, productId)
    - Implement isInWishlist(userId, productId)
    - Implement clearWishlist(userId)
    - Implement transformWishlistItemRow() helper for snake_case to camelCase conversion
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 14.4_

  - [x] 3.4 Implement localStorageService with Broadcast Channel API
    - Create apps/web/src/modules/cart/services/localStorageService.ts
    - Create Broadcast Channels for cart and wishlist (agon_cart_sync, agon_wishlist_sync)
    - Implement init() to setup multi-tab sync listeners
    - Implement broadcastCartChange() and broadcastWishlistChange()
    - Implement getCart() with schema validation and error handling
    - Implement saveCart() with schema validation and broadcasting
    - Implement addToCart(productId, quantity, size) with quantity summing (max 99)
    - Implement updateCartItem(productId, size, updates)
    - Implement removeFromCart(productId, size)
    - Implement clearCart()
    - Implement getWishlist() with schema validation
    - Implement saveWishlist() with schema validation and broadcasting
    - Implement addToWishlist(productId) with 20-item limit check
    - Implement removeFromWishlist(productId)
    - Implement isInWishlist(productId)
    - Implement clearWishlist()
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4_

  - [x] 3.5 Implement migrationService with transactional RPCs
    - Create apps/web/src/modules/cart/services/migrationService.ts
    - Implement migrateUserData(userId) that calls both cart and wishlist migrations
    - Implement migrateCart(userId) using migrate_cart_items RPC
    - Clear localStorage only on successful migration
    - Preserve localStorage on failure for retry
    - Implement migrateWishlist(userId) using migrate_wishlist_items RPC
    - Handle skipped items due to 20-item limit with warning message
    - Clear localStorage only on successful migration
    - Return MigrationResult with counts and errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 3.6 Write unit tests for services layer
    - Test cartService validation logic (quantity 1-99, size 1-10 chars)
    - Test wishlistService limit enforcement error messages
    - Test localStorageService schema validation and error handling
    - Test migrationService idempotency (run twice, same result)
    - Test retry logic with network error codes
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 4. Checkpoint - Verify services layer
  - Ensure all services compile without errors
  - Test services manually with test data
  - Ask the user if questions arise

- [x] 5. Phase 3: Hooks Layer
  - [x] 5.1 Implement useMigrationStatus hook with migration gate
    - Create apps/web/src/modules/cart/hooks/useMigrationStatus.ts
    - Check localStorage for 'agon_migrated' flag
    - If user exists and not migrated, set status to 'in_progress'
    - Call migrationService.migrateUserData(userId)
    - Set 'agon_migrated' flag in localStorage on success
    - Set status to 'complete' on success, 'error' on failure
    - Return MigrationStatus ('pending' | 'in_progress' | 'complete' | 'error')
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 18.1, 18.2, 18.3, 18.4, 18.5_

  - [x] 5.2 Implement useCart hook with Realtime subscription
    - Create apps/web/src/modules/cart/hooks/useCart.ts
    - Generate unique CLIENT_ID using crypto.randomUUID()
    - Use useMigrationStatus to gate queries (enabled only when status === 'complete')
    - Implement useQuery to fetch cart items (database for authenticated, localStorage for guests)
    - Subscribe to Supabase Realtime channel `cart:${userId}` for postgres_changes
    - Filter Realtime events by client_id to prevent loops
    - Use queryClient.setQueryData() instead of invalidateQueries to apply deltas
    - Handle INSERT, UPDATE, DELETE events with delta application
    - Implement exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s)
    - Implement polling fallback (30s interval) when Realtime fails
    - Calculate totalItems and subtotal from cart items
    - Return loading state during migration
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 13.1, 13.2, 13.3, 13.4, 13.5, 18.1, 18.2, 18.3, 18.4, 18.5, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 5.3 Implement useCartMutations hook with optimistic updates
    - Create apps/web/src/modules/cart/hooks/useCartMutations.ts
    - Implement addToCart mutation with optimistic update and rollback
    - Create snapshot in onMutate before optimistic update
    - Update UI immediately with new item or incremented quantity
    - Call cartService.addToCart with retry wrapper
    - Rollback to snapshot on error and show error toast
    - Implement updateCartItem mutation with optimistic update
    - Implement updateQuantityDebounced with 500ms delay
    - Store debounce timers in useRef Map keyed by (productId, size)
    - Cancel pending debounce on Realtime event for same item
    - Implement removeFromCart mutation with optimistic update
    - Implement clearCart mutation with optimistic update
    - Return mutation functions and loading states
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 5.4 Implement useWishlist hook with Realtime subscription
    - Create apps/web/src/modules/wishlist/hooks/useWishlist.ts
    - Implement useQuery to fetch wishlist items (database for authenticated, localStorage for guests)
    - Subscribe to Supabase Realtime channel `wishlist:${userId}` for postgres_changes
    - Invalidate queries on Realtime events (simpler than cart, no debounce needed)
    - Implement isInWishlist(productId) helper
    - Return items, isInWishlist function, loading state, and error
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4_

  - [x] 5.5 Implement useWishlistMutations hook with optimistic updates
    - Create apps/web/src/modules/wishlist/hooks/useWishlistMutations.ts
    - Implement addToWishlist mutation with optimistic update and rollback
    - Handle 20-item limit error with specific error message
    - Implement removeFromWishlist mutation with optimistic update
    - Implement toggleWishlist helper (add if not present, remove if present)
    - Return mutation functions and loading states
    - _Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 5.6 Write unit tests for hooks layer
    - Test useMigrationStatus state transitions (pending → in_progress → complete)
    - Test useCart migration gate (queries blocked until complete)
    - Test useCartMutations optimistic updates and rollback
    - Test updateQuantityDebounced with rapid changes (only final value sent)
    - Test debounce cancellation on Realtime event
    - Test useWishlist Realtime subscription
    - Test useWishlistMutations 20-item limit error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.1, 8.2, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 21.1, 21.2, 21.3_

- [ ] 6. Checkpoint - Verify hooks layer
  - Ensure all hooks compile without errors
  - Test hooks manually with React DevTools
  - Ask the user if questions arise

- [x] 7. Phase 4: UI Integration
  - [x] 7.1 Update ProductCard component with cart and wishlist buttons
    - Add "Adicionar ao Carrinho" button with size selector
    - Add wishlist toggle button (heart icon)
    - Use useCartMutations and useWishlistMutations hooks
    - Show loading states during mutations (spinner on button)
    - Show visual feedback for optimistic updates (button color change)
    - Disable buttons during loading
    - _Requirements: 1.1, 7.1_

  - [x] 7.2 Implement Cart page with item management
    - Create apps/web/src/app/cart/page.tsx
    - Use useCart hook to fetch cart items
    - Display cart items with product image, name, price, quantity, size
    - Implement quantity controls (+ / - buttons) with debounced updates
    - Implement remove item button
    - Display cart summary (subtotal, total items)
    - Show price change warnings when price_snapshot differs from current price
    - Show loading state during migration
    - Show empty cart state with link to products page
    - Add "Finalizar Compra" button (links to checkout)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 22.4_

  - [x] 7.3 Implement Wishlist page with grid display
    - Create apps/web/src/app/favoritos/page.tsx
    - Use useWishlist hook to fetch wishlist items
    - Display wishlist items in grid using AnimatedGrid component
    - Use ProductCard components with remove button
    - Show item count indicator (e.g., "15/20 itens")
    - Show empty wishlist state with link to products page
    - _Requirements: 7.1, 7.2, 7.3, 8.4_

  - [x] 7.4 Integrate migration on login
    - Update login flow to trigger migration after successful authentication
    - Show loading indicator during migration
    - Show success toast with migration counts (e.g., "3 itens migrados")
    - Show error toast if migration fails with retry option
    - Redirect to dashboard after migration completes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.5 Add error handling and rollback UI
    - Implement error toast notifications using sonner
    - Show specific error messages for different error types (network, validation, limit)
    - Implement rollback visual feedback (item reappears with animation)
    - Add retry button for failed operations
    - Show Realtime connection status indicator (optional)
    - _Requirements: 4.5, 4.6, 8.2, 8.3, 17.3_

  - [ ]* 7.6 Write E2E tests for critical user flows
    - Test add to cart flow (guest and authenticated)
    - Test remove from cart flow
    - Test update quantity flow with debounce
    - Test add to wishlist flow
    - Test migration flow (guest → login → verify items migrated)
    - Test 20-item wishlist limit
    - Test price change warning display
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 7.1, 7.2, 8.1, 8.2, 22.4_

- [x] 8. Checkpoint - Verify UI integration
  - Ensure all pages render without errors
  - Test user flows manually in browser
  - Ask the user if questions arise

- [ ] 9. Phase 5: Testing
  - [ ]* 9.1 Write property test for cart persistence round-trip
    - **Property 1: Cart Persistence Round-Trip**
    - **Validates: Requirements 1.1, 1.5**
    - Use fast-check to generate random userId, productId, quantity (1-99), size (1-10 chars)
    - Add item to cart via cartService.addToCart
    - Load cart via cartService.getCartItems
    - Verify item exists with correct productId, quantity, and size
    - Run 100 iterations

  - [ ]* 9.2 Write property test for cart mutations persist to database
    - **Property 2: Cart Mutations Persist to Database**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - Use fast-check to generate cart item and mutation type (update quantity, update size, remove)
    - Add item to cart
    - Perform mutation
    - Load cart and verify mutation reflected in database
    - Run 100 iterations

  - [ ]* 9.3 Write property test for optimistic UI with rollback
    - **Property 3: Optimistic UI with Rollback**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 19.1-19.6**
    - Use fast-check to generate cart mutation
    - Capture UI state before mutation
    - Perform mutation with mocked service that fails
    - Verify UI updates immediately (< 100ms)
    - Verify UI rolls back to exact previous state on failure
    - Run 100 iterations

  - [ ]* 9.4 Write property test for migration merges correctly
    - **Property 4: Migration Merges Correctly**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Use fast-check to generate localStorage cart items and database cart items
    - Setup localStorage and database with overlapping items (same productId and size)
    - Run migration
    - Verify all localStorage items appear in database
    - Verify overlapping items have summed quantities (capped at 99)
    - Run 100 iterations

  - [ ]* 9.5 Write property test for migration idempotency
    - **Property 5: Migration Idempotency**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**
    - Use fast-check to generate localStorage cart items
    - Run migration twice
    - Verify database state is identical after first and second migration
    - Verify no duplicate items created
    - Run 100 iterations

  - [ ]* 9.6 Write property test for wishlist persistence round-trip
    - **Property 6: Wishlist Persistence Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Use fast-check to generate userId and productId
    - Add product to wishlist via wishlistService.addToWishlist
    - Load wishlist via wishlistService.getWishlistItems
    - Verify product exists in wishlist
    - Run 100 iterations

  - [ ]* 9.7 Write property test for wishlist 20-item limit enforcement
    - **Property 7: Wishlist 20-Item Limit Enforcement**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - Create wishlist with exactly 20 items
    - Attempt to add 21st item
    - Verify operation is rejected with error message containing "20 itens"
    - Verify wishlist remains at 20 items
    - Run 100 iterations

  - [ ]* 9.8 Write property test for localStorage round-trip for guests
    - **Property 8: localStorage Round-Trip for Guests**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4**
    - Use fast-check to generate cart state
    - Save cart to localStorage via localStorageService.saveCart
    - Load cart via localStorageService.getCart
    - Verify cart has identical items (same productId, quantity, size)
    - Run 100 iterations

  - [ ]* 9.9 Write property test for unique constraint handling
    - **Property 9: Unique Constraint Handling**
    - **Validates: Requirements 14.3, 14.4, 14.5**
    - Use fast-check to generate cart item
    - Add item to cart twice with same productId and size
    - Verify quantity is incremented (not duplicated)
    - Add same product to wishlist twice
    - Verify operation is idempotent (no error, no change)
    - Run 100 iterations

  - [ ]* 9.10 Write property test for quantity validation
    - **Property 10: Quantity Validation**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**
    - Use fast-check to generate invalid quantities (< 1, > 99, non-numeric)
    - Attempt to add cart item with invalid quantity
    - Verify operation is rejected with appropriate error message
    - Run 100 iterations

  - [ ]* 9.11 Write property test for Last-Write-Wins conflict resolution
    - **Property 11: Last-Write-Wins Conflict Resolution**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
    - Use fast-check to generate two conflicting updates with timestamps
    - Apply both updates to same cart item
    - Verify update with later timestamp is final state
    - Verify update with earlier timestamp is ignored
    - Run 100 iterations

  - [ ]* 9.12 Write property test for retry strategy for network errors
    - **Property 12: Retry Strategy for Network Errors**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**
    - Mock cart operation to fail with network error (PGRST301, PGRST504, 08000)
    - Verify operation is retried up to 2 times with 500ms delay
    - Mock cart operation to fail with validation error
    - Verify operation is NOT retried
    - Run 100 iterations

  - [ ]* 9.13 Write property test for database as source of truth
    - **Property 13: Database as Source of Truth**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**
    - Create authenticated user with cart items in database
    - Add different items to localStorage
    - Load cart via useCart hook
    - Verify cart is loaded from database (not localStorage)
    - Run 100 iterations

  - [ ]* 9.14 Write property test for debounce quantity changes
    - **Property 14: Debounce Quantity Changes**
    - **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5**
    - Use fast-check to generate sequence of quantity changes within 500ms
    - Call updateQuantityDebounced multiple times rapidly
    - Verify only final quantity value is sent to server after 500ms
    - Run 100 iterations

  - [ ]* 9.15 Write property test for migration clears localStorage on success
    - **Property 15: Migration Clears localStorage on Success**
    - **Validates: Requirements 3.4, 10.5**
    - Setup localStorage with cart and wishlist items
    - Run successful migration
    - Verify localStorage is completely cleared
    - Verify 'agon_migrated' flag is set
    - Run 100 iterations

  - [ ]* 9.16 Write property test for migration preserves localStorage on failure
    - **Property 16: Migration Preserves localStorage on Failure**
    - **Validates: Requirements 3.5, 10.5**
    - Setup localStorage with cart and wishlist items
    - Mock migration to fail
    - Verify localStorage data remains unchanged
    - Verify error message is displayed
    - Run 100 iterations

  - [ ]* 9.17 Write integration test for Realtime synchronization
    - Create two Supabase clients for same user (simulating two devices)
    - Device 1 adds item to cart
    - Verify Device 2 receives Realtime event and updates UI
    - Device 2 updates quantity
    - Verify Device 1 receives Realtime event and updates UI
    - Test INSERT, UPDATE, DELETE events
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 9.18 Write integration test for RLS policy enforcement
    - Create two test users
    - User 1 adds item to cart
    - User 2 attempts to read User 1's cart
    - Verify User 2 receives empty result (RLS filters it out)
    - User 2 attempts to update User 1's cart item
    - Verify operation is rejected
    - Test SELECT, INSERT, UPDATE, DELETE policies
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 9.19 Write integration test for CASCADE delete behavior
    - Create cart item and wishlist item for test product
    - Delete product
    - Verify cart_items and wishlist_items are automatically deleted
    - Create cart item and wishlist item for test user
    - Delete user
    - Verify cart_items and wishlist_items are automatically deleted
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

  - [ ]* 9.20 Write concurrency test for race conditions
    - Simulate two devices adding same item simultaneously
    - Verify atomic upsert prevents duplicates
    - Verify quantities are summed correctly
    - Test with multiple concurrent operations (add, update, remove)
    - _Requirements: 14.3, 14.5_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run all property tests (100 iterations each)
  - Run all integration tests
  - Run all unit tests
  - Run all E2E tests
  - Verify test coverage meets goals
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate external dependencies (Realtime, RLS, CASCADE)
- Unit tests validate specific examples and edge cases
- Implementation follows five-phase structure: Database → Services → Hooks → UI → Testing
- All code uses TypeScript with Next.js 14, React Query, Zod, and Supabase
- Optimistic updates target < 100ms UI response time
- Debounce uses 500ms delay for quantity changes
- Retry strategy uses 2 retries with 500ms delay for network errors
- Migration uses transactional RPCs for atomicity
- Realtime uses client_id filtering to prevent event loops
- localStorage uses Broadcast Channel API for multi-tab sync
