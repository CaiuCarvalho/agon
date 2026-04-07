# Manual Testing Checklist - Core Flow Stabilization

## Overview
This checklist validates that Cart, Wishlist, and Address flows are fully operational after the bugfix implementation. All automated tests have passed. This manual validation ensures the user experience is correct.

---

## Cart Flow Validation

### ✅ Cart Add Item - Product Card
**Steps:**
1. Navigate to products page (`/products`)
2. Click "Adicionar ao Carrinho" on any product card
3. Observe success toast
4. Check cart icon badge increments
5. Navigate to cart page (`/cart`)
6. Verify item appears with correct details

**Expected Result:**
- Success toast: "Item adicionado ao carrinho"
- Cart badge shows correct count
- Item appears in cart with price snapshot

**Status:** [ ] Pass [ ] Fail

---

### ✅ Cart Add Item - Product Detail Page
**Steps:**
1. Navigate to product detail page (`/products/[id]`)
2. Select size (if applicable)
3. Click "Adicionar ao Carrinho"
4. Observe success toast
5. Navigate to cart page

**Expected Result:**
- Success toast shown
- Item appears in cart with selected size
- Price snapshot captured

**Status:** [ ] Pass [ ] Fail

---

### ✅ Cart Quantity Increment (Duplicate Add)
**Steps:**
1. Add item to cart (same product + size)
2. Add the same item again
3. Navigate to cart page
4. Verify quantity incremented (not duplicate entry)

**Expected Result:**
- Only one cart item entry
- Quantity = 2 (or incremented value)
- No duplicate rows

**Status:** [ ] Pass [ ] Fail

---

### ✅ Cart Update Quantity
**Steps:**
1. Navigate to cart page
2. Change quantity using +/- buttons
3. Observe optimistic UI update
4. Refresh page
5. Verify quantity persisted

**Expected Result:**
- Immediate UI update (optimistic)
- Quantity persisted in database
- No errors

**Status:** [ ] Pass [ ] Fail

---

### ✅ Cart Remove Item
**Steps:**
1. Navigate to cart page
2. Click remove button on cart item
3. Observe optimistic UI update
4. Refresh page
5. Verify item removed

**Expected Result:**
- Item immediately removed from UI
- Item removed from database
- Cart badge decrements

**Status:** [ ] Pass [ ] Fail

---

### ✅ Guest Cart (localStorage)
**Steps:**
1. Logout (or use incognito mode)
2. Add items to cart as guest
3. Verify items stored in localStorage (check DevTools)
4. Refresh page
5. Verify items persist

**Expected Result:**
- Items stored in localStorage
- Items persist across page refreshes
- No database calls for guest users

**Status:** [ ] Pass [ ] Fail

---

### ✅ Cart Migration on Login
**Steps:**
1. As guest, add 2-3 items to cart
2. Login with valid credentials
3. Observe migration progress indicator
4. Navigate to cart page
5. Verify all guest items migrated to database

**Expected Result:**
- Migration progress shown
- All guest items appear in authenticated cart
- localStorage cleared after migration
- Database contains migrated items

**Status:** [ ] Pass [ ] Fail

---

## Wishlist Flow Validation

### ✅ Wishlist Add Item
**Steps:**
1. Navigate to products page
2. Click heart icon on product card
3. Observe heart icon fills
4. Observe success toast
5. Navigate to wishlist page (`/favoritos`)
6. Verify item appears

**Expected Result:**
- Heart icon fills immediately (optimistic)
- Success toast: "Item adicionado aos favoritos"
- Item appears in wishlist page

**Status:** [ ] Pass [ ] Fail

---

### ✅ Wishlist Remove Item
**Steps:**
1. Navigate to wishlist page
2. Click heart icon on favorited product
3. Observe heart icon empties
4. Observe item removed from list

**Expected Result:**
- Heart icon empties immediately
- Item removed from list
- Success toast shown

**Status:** [ ] Pass [ ] Fail

---

### ✅ Wishlist 20-Item Limit
**Steps:**
1. Add 20 items to wishlist
2. Attempt to add 21st item
3. Observe error toast

**Expected Result:**
- Error toast: "Você atingiu o limite de 20 itens na lista de desejos"
- 21st item NOT added
- Wishlist count remains at 20

**Status:** [ ] Pass [ ] Fail

---

### ✅ Wishlist Duplicate Handling
**Steps:**
1. Add item to wishlist
2. Attempt to add same item again
3. Observe graceful handling (no error)

**Expected Result:**
- No error toast
- Item remains in wishlist (not duplicated)
- Heart icon remains filled

**Status:** [ ] Pass [ ] Fail

---

### ✅ Guest Wishlist (localStorage)
**Steps:**
1. Logout (or use incognito mode)
2. Add items to wishlist as guest
3. Verify items stored in localStorage
4. Refresh page
5. Verify items persist

**Expected Result:**
- Items stored in localStorage
- Items persist across refreshes
- No database calls

**Status:** [ ] Pass [ ] Fail

---

### ✅ Wishlist Migration on Login
**Steps:**
1. As guest, add 2-3 items to wishlist
2. Login with valid credentials
3. Navigate to wishlist page
4. Verify all guest items migrated

**Expected Result:**
- All guest items appear in authenticated wishlist
- localStorage cleared
- Database contains migrated items

**Status:** [ ] Pass [ ] Fail

---

## Address Flow Validation

### ✅ Address Add
**Steps:**
1. Navigate to profile page (`/perfil`)
2. Click "Adicionar Endereço"
3. Fill address form:
   - CEP: 01310-100
   - Rua: Avenida Paulista
   - Número: 1578
   - Bairro: Bela Vista
   - Cidade: São Paulo
   - Estado: SP
4. Check "Endereço padrão"
5. Submit form
6. Observe success toast
7. Verify address appears in list

**Expected Result:**
- Success toast: "Endereço adicionado com sucesso"
- Address appears in list
- "Padrão" badge shown
- Database contains address

**Status:** [ ] Pass [ ] Fail

---

### ✅ Address Set Default
**Steps:**
1. Add 2 addresses (first as default)
2. Click "Definir como padrão" on second address
3. Observe UI update
4. Refresh page
5. Verify second address is now default

**Expected Result:**
- First address loses "Padrão" badge
- Second address gains "Padrão" badge
- Only one default address exists
- Change persisted in database

**Status:** [ ] Pass [ ] Fail

---

### ✅ Address Edit
**Steps:**
1. Click "Editar" on existing address
2. Modify street name
3. Submit form
4. Observe success toast
5. Verify changes saved

**Expected Result:**
- Success toast shown
- Changes reflected in UI
- Changes persisted in database

**Status:** [ ] Pass [ ] Fail

---

### ✅ Address Delete
**Steps:**
1. Click "Excluir" on address
2. Confirm deletion in dialog
3. Observe address removed from list
4. Refresh page
5. Verify address deleted

**Expected Result:**
- Address removed from UI
- Address deleted from database
- Success toast shown

**Status:** [ ] Pass [ ] Fail

---

### ✅ Address 5-Address Limit
**Steps:**
1. Add 5 addresses
2. Attempt to add 6th address
3. Observe error toast

**Expected Result:**
- Error toast: "Você atingiu o limite de 5 endereços"
- 6th address NOT added
- Address count remains at 5

**Status:** [ ] Pass [ ] Fail

---

### ✅ Address Service Layer Architecture
**Steps:**
1. Open DevTools Console
2. Perform any address operation
3. Verify no direct Supabase calls in component
4. Check network tab for proper API calls

**Expected Result:**
- All operations go through `addressService`
- No direct Supabase client calls in `AddressManager.tsx`
- Proper error handling with retry logic

**Status:** [ ] Pass [ ] Fail

---

## Error Handling Validation

### ✅ Network Error Retry
**Steps:**
1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Add item to cart
4. Observe retry attempts
5. Verify eventual success

**Expected Result:**
- Automatic retry on network errors
- Up to 2 retry attempts
- Exponential backoff
- Success after retry

**Status:** [ ] Pass [ ] Fail

---

### ✅ Permission Error Handling
**Steps:**
1. Attempt to access another user's data (if possible)
2. Observe error handling

**Expected Result:**
- RLS policies block unauthorized access
- User-friendly error message
- No data leakage

**Status:** [ ] Pass [ ] Fail

---

### ✅ Validation Error Handling
**Steps:**
1. Submit address form with invalid CEP
2. Observe validation error

**Expected Result:**
- Form validation prevents submission
- Clear error message shown
- No database call made

**Status:** [ ] Pass [ ] Fail

---

## Summary

**Total Tests:** 26
**Passed:** ___
**Failed:** ___

**Overall Status:** [ ] All Pass [ ] Some Failures

**Notes:**
_Document any issues found during manual testing_

---

## Next Steps

If all tests pass:
- ✅ Mark Task 4 complete
- ✅ Bugfix ready for production
- ✅ Proceed to Checkout implementation

If any tests fail:
- Document failures
- Investigate root cause
- Apply fixes
- Re-run tests
