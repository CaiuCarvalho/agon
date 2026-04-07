# Quick Guide: Execute Phase 6 Verification

## Purpose

Verify that checkout database schema is ready for future implementation.

## Steps

### 1. Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)

### 2. Execute Verification Script

1. Open the file `PHASE6_CHECKOUT_VERIFICATION.sql` in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** button

### 3. Review Results

Look for these indicators in the query results:

#### ✅ Success Indicators
- `✅ PASS: Both orders and order_items tables exist`
- `✅ PASS: create_order_atomic function exists`
- `✅ PASS: Cart RLS policies configured`
- `✅ PASS: Address RLS policies configured`
- `✅ ENABLED` for RLS status
- `✅ EXISTS` for policies and functions

#### ❌ Failure Indicators
- `❌ FAIL: Missing checkout tables`
- `❌ FAIL: create_order_atomic function missing`
- `❌ DISABLED` for RLS status
- `❌ MISSING` for tables

#### ⚠️ Warning Indicators
- `⚠️ WARNING: May be missing policies`
- `⚠️ INFO: add_to_cart_atomic function missing (fallback will be used)`

### 4. Interpret Results

#### If All Checks Pass (✅)

**Meaning**: Checkout prerequisites are met. The database schema is ready.

**Action**: 
- Document results in `PHASE6_VERIFICATION_REPORT.md`
- Mark task 3.6 as complete
- Proceed to task 3.7 (verify bug condition test passes)

#### If Some Checks Fail (❌)

**Meaning**: Checkout schema is not ready. Migrations may not have been applied.

**Action**:
1. Check if PHASE 1 (task 3.1) was completed
2. Verify `APPLY_CHECKOUT_MIGRATIONS.sql` was executed in Supabase
3. If not, execute the migration file:
   - Open `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Run the migration
4. Re-run verification script to confirm

#### If Warnings Appear (⚠️)

**Meaning**: Non-critical issues detected. System may still function.

**Action**:
- Review the specific warning
- `add_to_cart_atomic missing` is OK (fallback INSERT works)
- Policy count warnings should be investigated
- Document warnings in verification report

## Expected Output Summary

At the end of the verification script, you'll see a comprehensive summary:

```
=== CHECKOUT READINESS SUMMARY ===

Component                  | Status
---------------------------|----------
Checkout Schema            | ✅ READY
create_order_atomic RPC    | ✅ READY
Cart Operations            | ✅ READY
Address Operations         | ✅ READY
Products Table             | ✅ READY
```

All components should show `✅ READY` for checkout implementation to proceed.

## What This Verification Does NOT Do

- ❌ Does not create any tables (read-only queries)
- ❌ Does not modify any data
- ❌ Does not implement checkout functionality
- ❌ Does not create UI components
- ❌ Does not test actual checkout flow

This is **verification only** - confirming the database foundation is ready.

## Troubleshooting

### "relation orders does not exist"

**Problem**: Checkout migrations not applied

**Solution**: Execute `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql` in Supabase SQL Editor

### "relation cart_items does not exist"

**Problem**: Cart migrations not applied (PHASE 1 incomplete)

**Solution**: Complete task 3.1 (PHASE 1: Database Validation and Migration Application)

### "relation addresses does not exist"

**Problem**: Address migrations not applied (PHASE 1 incomplete)

**Solution**: Complete task 3.1 (PHASE 1: Database Validation and Migration Application)

### "function create_order_atomic does not exist"

**Problem**: RPC function not created

**Solution**: Execute `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql` in Supabase SQL Editor

### RLS policies missing

**Problem**: Policies not created or dropped

**Solution**: Re-run the checkout migrations to recreate policies

## Files Created

1. **PHASE6_CHECKOUT_VERIFICATION.sql**: Comprehensive verification queries
2. **PHASE6_VERIFICATION_REPORT.md**: Detailed documentation of verification scope and results
3. **EXECUTE_PHASE6_VERIFICATION.md**: This quick guide

## Next Steps After Verification

1. Document verification results
2. Mark task 3.6 complete
3. Proceed to task 3.7: Verify bug condition exploration test now passes
4. Proceed to task 3.8: Verify preservation tests still pass
5. Complete task 4: Checkpoint - Ensure all tests pass

## Questions?

If verification fails or you encounter unexpected results:
1. Check that all previous phases (3.1-3.5) are complete
2. Verify you're connected to the correct Supabase project
3. Check Supabase logs for any error messages
4. Review `PHASE6_VERIFICATION_REPORT.md` for detailed schema information

---

**Remember**: This is a verification-only task. No code changes are made.
