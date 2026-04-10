# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Realtime Status Inadequado para Cenários Não-Aplicáveis
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that useCart hook sets realtimeStatus to 'disconnected' for guest users (from Bug Condition in design)
  - Test that useCart hook sets realtimeStatus to 'disconnected' during migration in progress (from Bug Condition in design)
  - Test that useCart hook keeps realtimeStatus as 'disconnected' indefinitely after subscription failure (from Bug Condition in design)
  - The test assertions should match the Expected Behavior Properties from design: realtimeStatus should be 'idle' (or neutral state) for these scenarios
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Comportamento de Realtime para Usuários Autenticados
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (authenticated users with complete migration)
  - Observe: Realtime subscription is established for authenticated users with migrationStatus 'complete' or 'error'
  - Observe: Reconnection with exponential backoff works when connection is temporarily lost
  - Observe: Event filtering prevents loops by ignoring events with own client_id
  - Observe: Polling fallback is activated when Realtime fails
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for persistent "Reconectando..." message

  - [x] 3.1 Implement the fix in useCart hook
    - Update realtimeStatus type to include 'idle' state: `'connected' | 'disconnected' | 'idle'`
    - Initialize realtimeStatus as 'idle' instead of 'disconnected'
    - Set realtimeStatus to 'idle' for guest users (when !user)
    - Set realtimeStatus to 'idle' during migration (when migrationStatus not in ['complete', 'error'])
    - Set realtimeStatus to 'idle' when polling fallback is activated after subscription failure
    - Maintain 'disconnected' only for temporary connection loss during reconnection attempts
    - _Bug_Condition: isBugCondition(input) where input.user == null OR input.migrationStatus NOT IN ['complete', 'error'] OR input.realtimeSubscriptionFailed == true_
    - _Expected_Behavior: realtimeStatus should be 'idle' for non-applicable scenarios, 'connected' when established, 'disconnected' only temporarily during reconnection_
    - _Preservation: Realtime subscription for authenticated users, reconnection with backoff, event filtering, polling fallback_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Update RealtimeStatus component
    - Update component to ignore 'idle' state (no message displayed)
    - Ensure message is only shown for 'disconnected' state
    - Update ConnectionIndicator to handle 'idle' state appropriately
    - _Requirements: 2.2, 2.5_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Realtime Status Adequado
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Comportamento Preservado
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
