# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Realtime Subscription Setup Failures
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that useCart creates Supabase client before attempting subscription (from Bug Condition in design)
  - Test that useWishlist properly chains `.channel()` → `.on()` → `.subscribe()` methods (from Bug Condition in design)
  - Test that authenticated users with complete migration status can establish Realtime subscriptions without errors
  - The test assertions should match the Expected Behavior Properties from design (subscriptions establish successfully, no runtime errors, cross-device sync works)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "useCart throws 'Cannot read property channel of undefined'", "useWishlist throws 'cannot add postgres_changes callbacks after subscribe()'")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Subscription Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test that guest users (not authenticated) continue to use localStorage without attempting Realtime subscriptions
  - Test that cart hook continues to respect migration gate (only query when migrationStatus === 'complete')
  - Test that event filtering by CLIENT_ID continues to prevent self-generated event loops
  - Test that useEffect cleanup continues to properly unsubscribe and remove channels
  - Test that cart calculations (totalItems, subtotal) continue to work correctly
  - Test that wishlist isInWishlist helper continues to provide O(n) lookups
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix Realtime subscription setup in useCart and useWishlist

  - [x] 3.1 Fix useCart hook - Add Supabase client initialization
    - Add `const supabase = createClient();` at the start of the Realtime subscription useEffect (before attempting to create channel)
    - Verify `createClient` is imported from `@/lib/supabase/client` at the top of the file
    - Ensure the client is created before calling `supabase.channel()`
    - _Bug_Condition: isBugCondition(input) where input.hook == 'useCart' AND input.user != null AND input.migrationStatus == 'complete' AND supabaseClientUndefined_
    - _Expected_Behavior: Subscriptions establish successfully without runtime errors (from design section "Expected Behavior")_
    - _Preservation: Guest users, migration gates, event filtering, cleanup, and calculations remain unchanged (from design section "Preservation Requirements")_
    - _Requirements: 1.2, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Fix useWishlist hook - Verify method chaining is correct
    - Verify the Realtime subscription follows the correct sequence: `.channel()` → `.on()` → `.subscribe()`
    - Ensure all callbacks are registered via `.on()` before calling `.subscribe()`
    - Confirm `createClient()` is called before channel creation
    - _Bug_Condition: isBugCondition(input) where input.hook == 'useWishlist' AND input.user != null AND callbacksAddedAfterSubscribe_
    - _Expected_Behavior: Subscriptions establish successfully with proper method chaining (from design section "Expected Behavior")_
    - _Preservation: Guest users, event filtering, cleanup, and isInWishlist helper remain unchanged (from design section "Preservation Requirements")_
    - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1, 3.3, 3.4, 3.6_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Realtime Subscriptions Establish Successfully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify useCart creates Supabase client successfully
    - Verify useWishlist chains methods correctly
    - Verify authenticated users can establish Realtime subscriptions without errors
    - Verify cross-device synchronization works
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Subscription Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm guest users still use localStorage
    - Confirm migration gate still blocks cart queries
    - Confirm CLIENT_ID filtering still prevents loops
    - Confirm cleanup still works properly
    - Confirm cart calculations still work correctly
    - Confirm wishlist isInWishlist helper still works

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
