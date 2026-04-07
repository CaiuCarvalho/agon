# Production Errors Fix Bugfix Design

## Overview

The Agon e-commerce application has two critical production issues: (1) missing product images causing 404/400 errors when users view products, and (2) potential 502 Bad Gateway errors in the checkout API preventing purchase completion. The image issue stems from a mismatch between database seed data (referencing 9 team jersey images like /products/flamengo.jpg) and actual files in the public folder (only 9 generic images like product-jersey.jpg exist). The checkout issue may be caused by Mercado Pago API timeouts, missing environment variables, or network errors in production.

The fix strategy is minimal and surgical: (1) update the database seed script to map team names to existing generic images, ensuring all products have valid image URLs, and (2) add defensive error handling and logging to the checkout API to surface the root cause of 502 errors. This preserves all existing functionality while eliminating the production errors.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when product image URLs reference non-existent files OR when checkout API encounters unhandled errors
- **Property (P)**: The desired behavior - all product images should load successfully (HTTP 200) OR checkout API should return descriptive errors (not 502)
- **Preservation**: Existing product display, cart functionality, and successful checkout flows that must remain unchanged
- **seed-products.sql**: The database seed script in `supabase/seed-products.sql` that inserts 9 team jersey products with image URLs
- **ProductCard**: The React component in `apps/web/src/components/ProductCard.tsx` that renders product images using `<img>` tags
- **create-order route**: The API endpoint in `apps/web/src/app/api/checkout/create-order/route.ts` that creates orders and Mercado Pago preferences

## Bug Details

### Bug Condition

The bug manifests in two scenarios:

**Scenario 1: Missing Product Images**
When a user views the products page or product detail page, the system attempts to load images referenced in the database (e.g., /products/flamengo.jpg, /products/barcelona.jpg). These files don't exist in apps/web/public/products/, causing HTTP 404 errors. When Next.js Image optimization is used (via /_next/image endpoint), this results in HTTP 400 Bad Request errors.

**Scenario 2: Checkout API 502 Errors**
When a user completes the checkout form and submits payment, the /api/checkout/create-order endpoint may return HTTP 502 Bad Gateway. This could be caused by Mercado Pago API timeouts (default 5000ms may be too short), missing environment variables in production, network errors, or unhandled exceptions.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ProductImageRequest OR CheckoutRequest
  OUTPUT: boolean
  
  // Image bug condition
  IF input.type == "ProductImageRequest" THEN
    RETURN input.imageUrl IN [
      '/products/flamengo.jpg',
      '/products/barcelona.jpg', 
      '/products/corinthians.jpg',
      '/products/palmeiras.jpg',
      '/products/sao-paulo.jpg',
      '/products/brasil.jpg',
      '/products/argentina.jpg',
      '/products/real-madrid.jpg',
      '/products/psg.jpg'
    ] AND NOT fileExists(input.imageUrl)
  END IF
  
  // Checkout bug condition
  IF input.type == "CheckoutRequest" THEN
    RETURN (
      mercadoPagoTimeout(input) OR
      missingEnvVars(input) OR
      networkError(input) OR
      unhandledException(input)
    ) AND responseStatus == 502
  END IF
END FUNCTION
```

### Examples

**Image Bug Examples:**
- User visits /products page → ProductCard renders Flamengo jersey → `<img src="/products/flamengo.jpg">` → HTTP 404 Not Found → Broken image icon displayed
- User visits /products/[id] detail page → Product image loads → Next.js Image component requests /_next/image?url=/products/barcelona.jpg → HTTP 400 Bad Request → Image fails to load
- Database seed inserts 9 products with team-specific image URLs → Only 9 generic images exist (product-jersey.jpg, product-ball.jpg, etc.) → 9 products have broken images

**Checkout Bug Examples:**
- User completes checkout form → Clicks "Finalizar Pedido" → API calls Mercado Pago SDK → Timeout after 5000ms → HTTP 502 Bad Gateway → User sees generic error
- Production environment missing MERCADOPAGO_ACCESS_TOKEN → API attempts to create preference → SDK throws error → Unhandled exception → HTTP 502 Bad Gateway
- Mercado Pago API returns 500 error → SDK throws exception → Error not caught properly → HTTP 502 Bad Gateway

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing generic product images (product-bag.jpg, product-ball.jpg, product-cap.jpg, product-jersey.jpg, product-mask.jpg, product-scarf.jpg, product-serum.jpg, product-shampoo.jpg, product-shorts.jpg) must continue to load successfully with HTTP 200
- ProductCard component must continue to render images using `<img>` tags with the same styling and hover effects
- Cart functionality (add to cart, remove from cart, update quantity) must remain unchanged
- Wishlist functionality (add to favorites, remove from favorites) must remain unchanged
- Successful checkout flows (when Mercado Pago API responds correctly) must continue to work exactly as before
- Order creation, payment record creation, and preference generation must remain unchanged
- Webhook handling and payment status updates must remain unchanged

**Scope:**
All inputs that do NOT involve the 9 missing team jersey images OR checkout API error scenarios should be completely unaffected by this fix. This includes:
- Products that already use existing generic images
- Image requests for non-product images (banners, UI elements, history images)
- Successful checkout requests where Mercado Pago API responds within timeout
- Other API endpoints (webhooks, auth callback, etc.)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

**Image Bug Root Causes:**

1. **Database Seed Mismatch**: The seed-products.sql script inserts 9 products with team-specific image URLs (/products/flamengo.jpg, /products/barcelona.jpg, etc.), but these files were never created in apps/web/public/products/. Only 9 generic placeholder images exist (product-jersey.jpg, product-ball.jpg, etc.).

2. **No Fallback Image Logic**: The ProductCard component uses `<img src={image}>` without fallback handling. When the image URL points to a non-existent file, the browser displays a broken image icon.

3. **Next.js Image Optimization Failure**: If Next.js Image component is used elsewhere, it attempts to optimize missing images via /_next/image endpoint, resulting in HTTP 400 errors.

**Checkout Bug Root Causes:**

1. **Mercado Pago API Timeout**: The SDK is configured with a 15000ms timeout (increased from default 5000ms), but production network latency may still cause timeouts. When the SDK times out, it throws an error that may not be properly caught, resulting in 502.

2. **Missing Environment Variables**: If MERCADOPAGO_ACCESS_TOKEN or NEXT_PUBLIC_APP_URL are missing in production, the API returns 500 errors. However, if these checks fail silently or are bypassed, the SDK may throw errors later, causing 502.

3. **Unhandled SDK Exceptions**: The Mercado Pago SDK may throw exceptions for various reasons (invalid token format, API rate limits, network errors). If these exceptions are not caught in the try-catch block, they propagate to Next.js, which returns 502 Bad Gateway.

4. **Database RPC Errors**: The create_order_with_payment_atomic RPC function may fail (insufficient stock, constraint violations), but the error handling may not properly rollback or return descriptive errors, causing 502.

## Correctness Properties

Property 1: Bug Condition - Product Images Load Successfully

_For any_ product image request where the bug condition holds (image URL references a non-existent team jersey file), the fixed system SHALL return HTTP 200 with a valid generic product image, ensuring all products display correctly without broken images.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition - Checkout API Returns Descriptive Errors

_For any_ checkout request where the bug condition holds (Mercado Pago timeout, missing env vars, network error, or unhandled exception), the fixed API SHALL return appropriate HTTP status codes (400, 401, 500) with descriptive error messages instead of 502 Bad Gateway, enabling proper error diagnosis and user feedback.

**Validates: Requirements 2.4**

Property 3: Preservation - Existing Images Continue Working

_For any_ image request that does NOT involve the 9 missing team jersey images (existing generic images, banners, UI elements), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing image loading functionality.

**Validates: Requirements 3.1, 3.2**

Property 4: Preservation - Successful Checkout Flows Unchanged

_For any_ checkout request that does NOT trigger error conditions (valid auth, valid shipping data, Mercado Pago API responds successfully), the fixed API SHALL produce exactly the same behavior as the original API, preserving order creation, payment processing, and preference generation.

**Validates: Requirements 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `supabase/seed-products.sql`

**Function**: Product insertion SQL

**Specific Changes**:
1. **Map Team Names to Generic Images**: Update the image_url column for each product to use existing generic images instead of non-existent team-specific images
   - Flamengo, Corinthians, Palmeiras, São Paulo, Brasil, Argentina, Real Madrid, Barcelona, PSG → all use '/products/product-jersey.jpg'
   - This ensures all products have valid image URLs that resolve to existing files

2. **Add Comment Documentation**: Add comments explaining the image mapping strategy and why generic images are used

3. **Preserve All Other Data**: Keep product names, descriptions, prices, stock levels, features, ratings, and reviews unchanged

**File 2**: `apps/web/src/app/api/checkout/create-order/route.ts`

**Function**: POST handler for order creation

**Specific Changes**:
1. **Add Request Timeout Logging**: Log when Mercado Pago API calls start and end to measure actual timeout durations
   - Add timestamp before `mercadoPagoService.createPreference()`
   - Add timestamp after successful response
   - Calculate and log duration

2. **Improve Error Logging**: Enhance error logging to capture more diagnostic information
   - Log full error stack traces
   - Log request payload (sanitized)
   - Log environment variable presence (not values)

3. **Add Timeout Error Handling**: Catch timeout-specific errors and return 504 Gateway Timeout instead of 502
   - Check if error message contains "timeout" or "ETIMEDOUT"
   - Return 504 with descriptive message

4. **Add Network Error Handling**: Catch network-specific errors and return 503 Service Unavailable
   - Check if error message contains "ECONNREFUSED", "ENOTFOUND", "network"
   - Return 503 with descriptive message

5. **Preserve Existing Error Handling**: Keep all existing try-catch blocks, rollback logic, and error responses unchanged

**File 3**: `apps/web/src/modules/payment/services/mercadoPagoService.ts`

**Function**: createPreference method

**Specific Changes**:
1. **Increase Timeout Further**: Increase SDK timeout from 15000ms to 30000ms for production stability
   - Update `options: { timeout: 30000 }`

2. **Add Retry Logic**: Add simple retry mechanism (1 retry with exponential backoff) for transient failures
   - Wrap preference.create() in retry logic
   - Retry once after 2000ms delay if first attempt fails with timeout/network error

3. **Improve Error Messages**: Enhance error messages to include more diagnostic information
   - Include error status code if available
   - Include error response body if available

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate product image requests and checkout API calls on the UNFIXED code to observe failures and understand the root causes.

**Test Cases**:
1. **Missing Image Test**: Request /products/flamengo.jpg directly (will return 404 on unfixed code)
2. **Product Card Render Test**: Render ProductCard with image="/products/barcelona.jpg" (will show broken image on unfixed code)
3. **Database Seed Test**: Run seed-products.sql and verify image URLs (will show non-existent URLs on unfixed code)
4. **Checkout Timeout Test**: Mock Mercado Pago API to delay 20 seconds (may return 502 on unfixed code)
5. **Checkout Missing Env Test**: Temporarily unset MERCADOPAGO_ACCESS_TOKEN (will return 500 on unfixed code, but may cause 502 if check fails)
6. **Checkout Network Error Test**: Mock Mercado Pago API to return ECONNREFUSED (may return 502 on unfixed code)

**Expected Counterexamples**:
- Image requests return 404 Not Found
- ProductCard displays broken image icons
- Database contains image URLs pointing to non-existent files
- Checkout API returns 502 Bad Gateway on timeout/network errors
- Possible causes: missing files, no fallback logic, insufficient timeout, poor error handling

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system produces the expected behavior.

**Pseudocode:**
```
// Image fix checking
FOR ALL imageRequest WHERE isBugCondition(imageRequest) DO
  result := loadProductImage_fixed(imageRequest)
  ASSERT result.status == 200
  ASSERT result.imageExists == true
END FOR

// Checkout fix checking
FOR ALL checkoutRequest WHERE isBugCondition(checkoutRequest) DO
  result := createOrder_fixed(checkoutRequest)
  ASSERT result.status IN [400, 401, 500, 503, 504]
  ASSERT result.status != 502
  ASSERT result.errorMessage != null
  ASSERT result.errorMessage.length > 0
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system produces the same result as the original system.

**Pseudocode:**
```
// Image preservation checking
FOR ALL imageRequest WHERE NOT isBugCondition(imageRequest) DO
  ASSERT loadProductImage_original(imageRequest) = loadProductImage_fixed(imageRequest)
END FOR

// Checkout preservation checking
FOR ALL checkoutRequest WHERE NOT isBugCondition(checkoutRequest) DO
  ASSERT createOrder_original(checkoutRequest) = createOrder_fixed(checkoutRequest)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing images and successful checkouts, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Existing Image Preservation**: Observe that product-jersey.jpg, product-ball.jpg, etc. load correctly on unfixed code, then write test to verify this continues after fix
2. **ProductCard Rendering Preservation**: Observe that ProductCard renders correctly with existing images on unfixed code, then write test to verify styling, hover effects, and quick-add button continue working
3. **Successful Checkout Preservation**: Observe that checkout completes successfully with valid data on unfixed code, then write test to verify order creation, payment record, and preference generation continue working
4. **Cart/Wishlist Preservation**: Observe that cart and wishlist operations work correctly on unfixed code, then write test to verify these continue working after fix

### Unit Tests

- Test seed-products.sql inserts products with valid image URLs (all pointing to product-jersey.jpg)
- Test ProductCard renders with valid image URL (should display image correctly)
- Test ProductCard renders with invalid image URL (should display broken image - this is expected behavior for non-product images)
- Test checkout API with valid data (should return 200 with order details)
- Test checkout API with missing auth (should return 401)
- Test checkout API with invalid shipping data (should return 400)
- Test checkout API with Mercado Pago timeout (should return 504, not 502)
- Test checkout API with network error (should return 503, not 502)

### Property-Based Tests

- Generate random product data and verify all image URLs point to existing files after seed
- Generate random valid checkout requests and verify all return 200 with correct order structure
- Generate random invalid checkout requests and verify all return appropriate error codes (not 502)
- Test that all existing images continue to load across many random requests

### Integration Tests

- Test full product browsing flow: load products page → verify all images display → click product → verify detail page loads
- Test full checkout flow: add products to cart → proceed to checkout → fill shipping form → submit → verify Mercado Pago redirect
- Test error recovery flow: trigger timeout error → verify user sees descriptive error message → retry → verify success
- Test image fallback flow: if future products have invalid images → verify graceful degradation (broken image icon, not crash)
