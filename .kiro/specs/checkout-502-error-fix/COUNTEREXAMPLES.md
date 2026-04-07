# Counterexamples Found - Checkout 502 Error Fix

## Test Execution Summary

**Date:** 2025-01-XX
**Status:** Bug conditions confirmed (3 of 5 tests failed as expected)
**Code State:** UNFIXED

## Counterexamples Documented

### ✓ Property 1.1: Missing NEXT_PUBLIC_APP_URL

**Status:** PASSED (error thrown correctly)

**Observed Behavior:**
- Service throws error: "NEXT_PUBLIC_APP_URL is not configured"
- Error is caught and thrown by `buildPreferenceRequest` function
- Error message is clear and descriptive

**Issue:**
- While error is thrown correctly, it manifests as 502 to users in production
- Need to verify API route handling returns appropriate status code

**Expected After Fix:**
- API route should catch this error and return 500 with clear message
- Should NOT manifest as 502 to users

---

### ✓ Property 1.2: Missing MERCADOPAGO_ACCESS_TOKEN

**Status:** PASSED (error thrown correctly)

**Observed Behavior:**
- Service throws error: "MERCADOPAGO_ACCESS_TOKEN is not configured"
- Error is caught during SDK initialization in `getMercadoPagoClient`
- Error message is clear and descriptive

**Issue:**
- While error is thrown correctly, it manifests as 502 to users in production
- Need to verify API route handling returns appropriate status code

**Expected After Fix:**
- API route should catch this error and return 500 with clear message
- Should NOT manifest as 502 to users

---

### ✗ Property 1.3: Mercado Pago Timeout

**Status:** FAILED (bug confirmed)

**Observed Behavior:**
- Timeout error occurs with ETIMEDOUT code
- Service enhances error message: "Failed to create payment preference: Request timeout (code: ETIMEDOUT)"
- Retry logic attempts request twice before failing

**Bug Confirmed:**
- `error.code` property is `undefined` (code is only in message string)
- API route cannot detect timeout by checking `error.code`
- Without code detection, API route may return 502 instead of 504

**Root Cause:**
- Error enhancement in `mercadoPagoService.ts` creates new Error object
- New Error loses original error properties (code, errno, etc.)
- Only message is preserved

**Expected After Fix:**
- Error should preserve `code` property for API route detection
- API route should check for ETIMEDOUT and return 504 Gateway Timeout
- SDK timeout should be reduced to 25s (margin before Next.js 60s limit)

---

### ✗ Property 1.4: Client Fetch Timeout

**Status:** FAILED (bug confirmed)

**Observed Behavior:**
```typescript
// Current fetch call in useCheckout.ts
const response = await fetch('/api/checkout/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

**Bug Confirmed:**
- ✗ Does NOT use AbortController
- ✗ Does NOT pass signal to fetch
- ✗ Does NOT configure timeout
- Fetch can hang indefinitely if server never responds

**Expected After Fix:**
```typescript
// Should use AbortController with 60s timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

try {
  const response = await fetch('/api/checkout/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    // Handle timeout with clear message
  }
}
```

---

### ✗ Property 1.5: .env.production Template

**Status:** FAILED (bug confirmed)

**Observed Behavior:**
- File exists at `apps/web/.env.production`
- Contains Supabase and Resend variables
- Has basic comments

**Bug Confirmed:**
- ✗ Missing NEXT_PUBLIC_APP_URL
- ✗ Missing MERCADOPAGO_ACCESS_TOKEN
- ✗ Missing MERCADOPAGO_WEBHOOK_SECRET
- ✗ No configuration instructions
- ✗ No Mercado Pago section with documentation

**Current Content (excerpt):**
```env
# Production Environment Variables
# Este arquivo serve como template. Na VPS, copie para .env.local e ajuste os valores.

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (para emails futuros)
RESEND_API_KEY=re_...

# API URL (opcional)
NEXT_PUBLIC_API_URL=https://agonimports.com/api

# Node Environment
NODE_ENV=production
```

**Expected After Fix:**
Should include Mercado Pago section:
```env
# Mercado Pago Configuration
# Obtenha suas credenciais em: https://www.mercadopago.com.br/developers/panel/credentials
# Use credenciais de PRODUÇÃO (não sandbox) para ambiente de produção

# URL base da aplicação (necessário para back_urls do Mercado Pago)
NEXT_PUBLIC_APP_URL=https://agonimports.com

# Token de acesso do Mercado Pago (formato: APP_USR-...)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui

# Secret para validação de webhooks (opcional, mas recomendado)
MERCADOPAGO_WEBHOOK_SECRET=seu-webhook-secret-aqui
```

---

## Summary

### Bugs Confirmed
1. **Timeout Error Code Lost** - Error enhancement loses original error properties
2. **No Client Timeout** - Fetch can hang indefinitely
3. **Incomplete .env.production** - Missing Mercado Pago variables and documentation

### Bugs Partially Confirmed
1. **Missing NEXT_PUBLIC_APP_URL** - Error thrown correctly, but may manifest as 502
2. **Missing MERCADOPAGO_ACCESS_TOKEN** - Error thrown correctly, but may manifest as 502

### Next Steps
1. Implement fixes for all 5 bug conditions
2. Re-run tests to verify they pass after fix
3. Verify API route returns appropriate status codes (500, 504, not 502)
4. Test in production-like environment

## Test Results

```
Test Files  1 failed (1)
     Tests  3 failed | 2 passed (5)
  Duration  3.26s

FAILED:
- Property 1.3: Mercado Pago timeout SHALL return 504 (not 502)
- Property 1.4: Client fetch SHALL have 60s timeout (not indefinite)
- Property 1.5: .env.production SHALL contain required variables template

PASSED:
- Property 1.1: Missing NEXT_PUBLIC_APP_URL SHALL return clear error (not 502)
- Property 1.2: Missing MERCADOPAGO_ACCESS_TOKEN SHALL return clear error (not 502)
```

**Note:** Tests that PASSED still need verification that errors don't manifest as 502 in production. The tests confirm errors are thrown with correct messages, but API route handling needs to be verified.
