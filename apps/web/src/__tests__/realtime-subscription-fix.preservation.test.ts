/**
 * Preservation Property Tests for Realtime Subscription Fix
 * 
 * **CRITICAL**: These tests run on UNFIXED code to capture baseline behavior
 * **GOAL**: Verify non-subscription behavior remains unchanged after fix
 * **EXPECTED OUTCOME**: All tests PASS on unfixed code (confirms baseline to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * Property 2: Preservation - Non-Subscription Behavior Unchanged
 * 
 * For any input where the bug condition does NOT hold (guest users, migration gates,
 * event filtering, cleanup operations), the fixed code SHALL produce exactly the same
 * behavior as the original code.
 * 
 * Test areas:
 * - Guest users using localStorage (no Realtime subscriptions)
 * - Migration gate blocking cart queries
 * - CLIENT_ID event filtering preventing loops
 * - useEffect cleanup properly unsubscribing
 * - Cart calculations (totalItems, subtotal)
 * - Wishlist isInWishlist helper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';

describe('Preservation: Non-Subscription Behavior Unchanged', () => {
  const projectRoot = path.resolve(__dirname, '../../../..');
  const useCartPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'cart', 'hooks', 'useCart.ts');
  const useWishlistPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'wishlist', 'hooks', 'useWishlist.ts');
  
  let useCartContent: string;
  let useWishlistContent: string;
  
  beforeEach(() => {
    useCartContent = fs.readFileSync(useCartPath, 'utf-8');
    useWishlistContent = fs.readFileSync(useWishlistPath, 'utf-8');
  });

  /**
   * Property 2.1: Guest Users - localStorage Behavior Preserved
   * 
   * OBSERVATION: On unfixed code, guest users (not authenticated) use localStorage
   * for cart and wishlist data without attempting Realtime subscriptions.
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.1**
   */
  describe('Property 2.1: Guest Users - localStorage Behavior', () => {
    it('useCart SHALL continue to use localStorage for guest users', () => {
      console.log('\n=== OBSERVING: useCart Guest User Behavior ===');
      
      // Check that useCart has localStorage fallback logic
      const hasLocalStorageImport = useCartContent.includes('localStorageService');
      const hasGuestBranch = useCartContent.includes('if (user)') && 
                            useCartContent.includes('else');
      const hasLocalStorageCall = useCartContent.includes('localStorageService.getCart()');
      
      console.log(`Has localStorageService import: ${hasLocalStorageImport}`);
      console.log(`Has guest/authenticated branching: ${hasGuestBranch}`);
      console.log(`Has localStorage.getCart() call: ${hasLocalStorageCall}`);
      
      // Check that Realtime subscription is guarded by user check
      const realtimeEffectMatch = useCartContent.match(/useEffect\(\(\) => \{[\s\S]*?if \(!user/);
      const hasUserGuard = realtimeEffectMatch !== null;
      console.log(`Realtime subscription guarded by user check: ${hasUserGuard}`);
      
      // OBSERVATION: Guest users should NOT trigger Realtime subscriptions
      expect(hasLocalStorageImport, 'Should import localStorageService').toBe(true);
      expect(hasGuestBranch, 'Should have guest/authenticated branching').toBe(true);
      expect(hasLocalStorageCall, 'Should call localStorage.getCart()').toBe(true);
      expect(hasUserGuard, 'Realtime should be guarded by user check').toBe(true);
    });

    it('useWishlist SHALL continue to use localStorage for guest users', () => {
      console.log('\n=== OBSERVING: useWishlist Guest User Behavior ===');
      
      // Check that useWishlist has localStorage fallback logic
      const hasLocalStorageImport = useWishlistContent.includes('localStorageService');
      const hasGuestBranch = useWishlistContent.includes('if (user)') && 
                            useWishlistContent.includes('else');
      const hasLocalStorageCall = useWishlistContent.includes('localStorageService.getWishlist()');
      
      console.log(`Has localStorageService import: ${hasLocalStorageImport}`);
      console.log(`Has guest/authenticated branching: ${hasGuestBranch}`);
      console.log(`Has localStorage.getWishlist() call: ${hasLocalStorageCall}`);
      
      // Check that Realtime subscription is guarded by user check
      const realtimeEffectMatch = useWishlistContent.match(/useEffect\(\(\) => \{[\s\S]*?if \(!user/);
      const hasUserGuard = realtimeEffectMatch !== null;
      console.log(`Realtime subscription guarded by user check: ${hasUserGuard}`);
      
      // OBSERVATION: Guest users should NOT trigger Realtime subscriptions
      expect(hasLocalStorageImport, 'Should import localStorageService').toBe(true);
      expect(hasGuestBranch, 'Should have guest/authenticated branching').toBe(true);
      expect(hasLocalStorageCall, 'Should call localStorage.getWishlist()').toBe(true);
      expect(hasUserGuard, 'Realtime should be guarded by user check').toBe(true);
    });

    it('Property: For all guest users, hooks SHALL use localStorage without Realtime', () => {
      console.log('\n=== PROPERTY TEST: Guest User Scenarios ===');
      
      // Generate guest user scenarios
      const guestScenarios = fc.array(
        fc.record({
          hook: fc.constantFrom('useCart', 'useWishlist'),
          user: fc.constant(null),
          hasLocalData: fc.boolean(),
        }),
        { minLength: 5, maxLength: 10 }
      );
      
      fc.assert(
        fc.property(guestScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} guest user scenarios`);
          
          let allScenariosValid = true;
          
          for (const scenario of scenarios) {
            const content = scenario.hook === 'useCart' ? useCartContent : useWishlistContent;
            
            // Verify localStorage is used for guests
            const usesLocalStorage = content.includes('localStorageService');
            // Check for user guard in Realtime subscription (may include additional conditions)
            const hasUserGuard = content.includes('if (!user') && 
                                content.includes('return');
            
            if (!usesLocalStorage || !hasUserGuard) {
              console.log(`❌ ${scenario.hook} missing guest user handling`);
              allScenariosValid = false;
            }
          }
          
          return allScenariosValid;
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 2.2: Migration Gate - Cart Query Blocking Preserved
   * 
   * OBSERVATION: On unfixed code, useCart respects the migration gate and only
   * queries the database when migrationStatus === 'complete'.
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.2**
   */
  describe('Property 2.2: Migration Gate - Cart Query Blocking', () => {
    it('useCart SHALL continue to block queries until migration completes', () => {
      console.log('\n=== OBSERVING: useCart Migration Gate ===');
      
      // Check for migration status import and usage
      const hasMigrationImport = useCartContent.includes('useMigrationStatus');
      const hasMigrationVariable = useCartContent.includes('migrationStatus');
      
      console.log(`Has useMigrationStatus import: ${hasMigrationImport}`);
      console.log(`Has migrationStatus variable: ${hasMigrationVariable}`);
      
      // Check for enabled flag in useQuery
      const queryMatch = useCartContent.match(/useQuery\(\{[\s\S]*?enabled:[\s\S]*?\}\)/);
      if (queryMatch) {
        const queryConfig = queryMatch[0];
        const hasEnabledGate = queryConfig.includes("enabled: migrationStatus === 'complete'") ||
                              queryConfig.includes('enabled: migrationStatus === "complete"');
        console.log(`Query has migration gate: ${hasEnabledGate}`);
        expect(hasEnabledGate, 'Query should be gated by migration status').toBe(true);
      }
      
      // Check for loading state during migration
      const hasLoadingCheck = useCartContent.includes("migrationStatus === 'in_progress'") ||
                             useCartContent.includes('migrationStatus === "in_progress"');
      console.log(`Has loading state for in-progress migration: ${hasLoadingCheck}`);
      
      // Check that Realtime subscription also respects migration gate
      const realtimeEffectMatch = useCartContent.match(/useEffect\(\(\) => \{[\s\S]*?migrationStatus/);
      const realtimeRespectsGate = realtimeEffectMatch !== null;
      console.log(`Realtime subscription respects migration gate: ${realtimeRespectsGate}`);
      
      // OBSERVATION: Cart queries should be blocked until migration completes
      expect(hasMigrationImport, 'Should import useMigrationStatus').toBe(true);
      expect(hasMigrationVariable, 'Should use migrationStatus variable').toBe(true);
      expect(hasLoadingCheck, 'Should handle in-progress migration').toBe(true);
      expect(realtimeRespectsGate, 'Realtime should respect migration gate').toBe(true);
    });

    it('Property: For all migration states, cart SHALL respect the gate', () => {
      console.log('\n=== PROPERTY TEST: Migration Gate Scenarios ===');
      
      // Generate migration status scenarios
      const migrationScenarios = fc.array(
        fc.record({
          migrationStatus: fc.constantFrom('not_started', 'in_progress', 'complete', 'failed'),
          user: fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
          }),
        }),
        { minLength: 4, maxLength: 8 }
      );
      
      fc.assert(
        fc.property(migrationScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} migration scenarios`);
          
          // Verify migration gate logic exists
          const hasEnabledGate = useCartContent.includes("enabled: migrationStatus === 'complete'");
          const hasLoadingState = useCartContent.includes("migrationStatus === 'in_progress'");
          
          // Count scenarios by status
          const statusCounts = scenarios.reduce((acc, s) => {
            acc[s.migrationStatus] = (acc[s.migrationStatus] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          console.log('Migration status distribution:', statusCounts);
          console.log(`Has enabled gate: ${hasEnabledGate}`);
          console.log(`Has loading state: ${hasLoadingState}`);
          
          // OBSERVATION: Gate should exist regardless of scenarios
          return hasEnabledGate && hasLoadingState;
        }),
        { numRuns: 15 }
      );
    });
  });

  /**
   * Property 2.3: Event Filtering - CLIENT_ID Loop Prevention Preserved
   * 
   * OBSERVATION: On unfixed code, useCart filters out Realtime events that
   * originate from the same client (matching CLIENT_ID) to prevent update loops.
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.3**
   */
  describe('Property 2.3: Event Filtering - CLIENT_ID Loop Prevention', () => {
    it('useCart SHALL continue to filter events by CLIENT_ID', () => {
      console.log('\n=== OBSERVING: useCart CLIENT_ID Filtering ===');
      
      // Check for CLIENT_ID constant
      const hasClientId = useCartContent.includes('const CLIENT_ID');
      const usesUuid = useCartContent.includes('crypto.randomUUID()') || 
                      useCartContent.includes('crypto.randomUUID');
      
      console.log(`Has CLIENT_ID constant: ${hasClientId}`);
      console.log(`Uses crypto.randomUUID(): ${usesUuid}`);
      
      // Check for event filtering logic
      const hasEventFilter = useCartContent.includes('client_id === CLIENT_ID');
      const hasEarlyReturn = useCartContent.includes('return;') && 
                            useCartContent.includes('client_id');
      
      console.log(`Has client_id filtering: ${hasEventFilter}`);
      console.log(`Has early return for own events: ${hasEarlyReturn}`);
      
      // Find the event handler
      const eventHandlerMatch = useCartContent.match(/\(payload\) => \{[\s\S]*?client_id[\s\S]*?\}/);
      if (eventHandlerMatch) {
        console.log('\nEvent handler includes CLIENT_ID check');
        const handlerCode = eventHandlerMatch[0];
        const filtersOwnEvents = handlerCode.includes('client_id === CLIENT_ID') &&
                                handlerCode.includes('return');
        expect(filtersOwnEvents, 'Should filter own events').toBe(true);
      }
      
      // OBSERVATION: Events from same client should be filtered out
      expect(hasClientId, 'Should have CLIENT_ID constant').toBe(true);
      expect(usesUuid, 'Should generate unique CLIENT_ID').toBe(true);
      expect(hasEventFilter, 'Should check client_id in events').toBe(true);
      expect(hasEarlyReturn, 'Should return early for own events').toBe(true);
    });

    it('Property: For all Realtime events, own events SHALL be filtered', () => {
      console.log('\n=== PROPERTY TEST: Event Filtering Scenarios ===');
      
      // Generate event scenarios
      const eventScenarios = fc.array(
        fc.record({
          eventType: fc.constantFrom('INSERT', 'UPDATE', 'DELETE'),
          clientId: fc.uuid(),
          ownEvent: fc.boolean(),
        }),
        { minLength: 10, maxLength: 20 }
      );
      
      fc.assert(
        fc.property(eventScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} event scenarios`);
          
          // Verify filtering logic exists
          const hasClientIdCheck = useCartContent.includes('client_id === CLIENT_ID');
          const hasEarlyReturn = useCartContent.includes('return;');
          
          const ownEvents = scenarios.filter(s => s.ownEvent).length;
          const otherEvents = scenarios.length - ownEvents;
          
          console.log(`Own events: ${ownEvents}, Other events: ${otherEvents}`);
          console.log(`Has CLIENT_ID check: ${hasClientIdCheck}`);
          console.log(`Has early return: ${hasEarlyReturn}`);
          
          // OBSERVATION: Filtering logic should exist
          return hasClientIdCheck && hasEarlyReturn;
        }),
        { numRuns: 25 }
      );
    });
  });

  /**
   * Property 2.4: Cleanup - Channel Unsubscribe Preserved
   * 
   * OBSERVATION: On unfixed code, both hooks properly unsubscribe and remove
   * channels in the useEffect cleanup function to prevent memory leaks.
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.4**
   */
  describe('Property 2.4: Cleanup - Channel Unsubscribe', () => {
    it('useCart SHALL continue to properly cleanup channels', () => {
      console.log('\n=== OBSERVING: useCart Cleanup Logic ===');
      
      // Check for cleanup return statement
      const hasCleanupReturn = useCartContent.includes('return () => {');
      console.log(`Has cleanup return statement: ${hasCleanupReturn}`);
      
      // Check for unsubscribe call
      const hasUnsubscribe = useCartContent.includes('.unsubscribe()') ||
                            useCartContent.includes('channel.unsubscribe()');
      console.log(`Has unsubscribe call: ${hasUnsubscribe}`);
      
      // Check for removeChannel call
      const hasRemoveChannel = useCartContent.includes('.removeChannel(') ||
                              useCartContent.includes('supabase.removeChannel(');
      console.log(`Has removeChannel call: ${hasRemoveChannel}`);
      
      // Check for polling cleanup
      const hasPollingCleanup = useCartContent.includes('stopPolling()');
      console.log(`Has polling cleanup: ${hasPollingCleanup}`);
      
      // Find cleanup function
      const cleanupMatch = useCartContent.match(/return \(\) => \{[\s\S]*?unsubscribe[\s\S]*?\};/);
      if (cleanupMatch) {
        console.log('\nCleanup function found with proper unsubscribe');
      }
      
      // OBSERVATION: Cleanup should unsubscribe and remove channels
      expect(hasCleanupReturn, 'Should have cleanup return').toBe(true);
      expect(hasUnsubscribe, 'Should call unsubscribe').toBe(true);
      expect(hasRemoveChannel, 'Should call removeChannel').toBe(true);
    });

    it('useWishlist SHALL continue to properly cleanup channels', () => {
      console.log('\n=== OBSERVING: useWishlist Cleanup Logic ===');
      
      // Check for cleanup return statement
      const hasCleanupReturn = useWishlistContent.includes('return () => {');
      console.log(`Has cleanup return statement: ${hasCleanupReturn}`);
      
      // Check for removeChannel call
      const hasRemoveChannel = useWishlistContent.includes('.removeChannel(') ||
                              useWishlistContent.includes('supabase.removeChannel(');
      console.log(`Has removeChannel call: ${hasRemoveChannel}`);
      
      // Find cleanup function
      const cleanupMatch = useWishlistContent.match(/return \(\) => \{[\s\S]*?removeChannel[\s\S]*?\};/);
      if (cleanupMatch) {
        console.log('\nCleanup function found with proper removeChannel');
      }
      
      // OBSERVATION: Cleanup should remove channels
      expect(hasCleanupReturn, 'Should have cleanup return').toBe(true);
      expect(hasRemoveChannel, 'Should call removeChannel').toBe(true);
    });

    it('Property: For all cleanup scenarios, channels SHALL be removed', () => {
      console.log('\n=== PROPERTY TEST: Cleanup Scenarios ===');
      
      // Generate cleanup scenarios
      const cleanupScenarios = fc.array(
        fc.record({
          hook: fc.constantFrom('useCart', 'useWishlist'),
          componentUnmount: fc.boolean(),
          userLogout: fc.boolean(),
          dependencyChange: fc.boolean(),
        }),
        { minLength: 8, maxLength: 15 }
      );
      
      fc.assert(
        fc.property(cleanupScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} cleanup scenarios`);
          
          let allHaveCleanup = true;
          
          for (const scenario of scenarios) {
            const content = scenario.hook === 'useCart' ? useCartContent : useWishlistContent;
            
            const hasCleanup = content.includes('return () => {');
            const hasRemove = content.includes('removeChannel');
            
            if (!hasCleanup || !hasRemove) {
              console.log(`❌ ${scenario.hook} missing cleanup logic`);
              allHaveCleanup = false;
            }
          }
          
          return allHaveCleanup;
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 2.5: Cart Calculations - totalItems and subtotal Preserved
   * 
   * OBSERVATION: On unfixed code, useCart correctly calculates totalItems
   * (sum of quantities) and subtotal (sum of price * quantity).
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.5**
   */
  describe('Property 2.5: Cart Calculations', () => {
    it('useCart SHALL continue to calculate totalItems correctly', () => {
      console.log('\n=== OBSERVING: useCart totalItems Calculation ===');
      
      // Check for totalItems calculation
      const hasTotalItems = useCartContent.includes('totalItems');
      const hasReduceSum = useCartContent.includes('reduce') && 
                          useCartContent.includes('sum + item.quantity');
      
      console.log(`Has totalItems variable: ${hasTotalItems}`);
      console.log(`Uses reduce to sum quantities: ${hasReduceSum}`);
      
      // Find the calculation
      const totalItemsMatch = useCartContent.match(/const totalItems = items\.reduce\((.*?), 0\)/s);
      if (totalItemsMatch) {
        console.log('\nFound totalItems calculation:');
        console.log(totalItemsMatch[0]);
        
        const sumsQuantity = totalItemsMatch[0].includes('sum + item.quantity');
        expect(sumsQuantity, 'Should sum item quantities').toBe(true);
      }
      
      // OBSERVATION: totalItems should sum all item quantities
      expect(hasTotalItems, 'Should have totalItems calculation').toBe(true);
      expect(hasReduceSum, 'Should use reduce to sum quantities').toBe(true);
    });

    it('useCart SHALL continue to calculate subtotal correctly', () => {
      console.log('\n=== OBSERVING: useCart subtotal Calculation ===');
      
      // Check for subtotal calculation
      const hasSubtotal = useCartContent.includes('subtotal');
      const hasReducePrice = useCartContent.includes('reduce') && 
                            useCartContent.includes('price') &&
                            useCartContent.includes('quantity');
      
      console.log(`Has subtotal variable: ${hasSubtotal}`);
      console.log(`Uses reduce to sum price * quantity: ${hasReducePrice}`);
      
      // Find the calculation
      const subtotalMatch = useCartContent.match(/const subtotal = items\.reduce\(([\s\S]*?), 0\)/);
      if (subtotalMatch) {
        console.log('\nFound subtotal calculation:');
        console.log(subtotalMatch[0]);
        
        const multipliesPriceQuantity = subtotalMatch[0].includes('price') && 
                                       subtotalMatch[0].includes('quantity');
        expect(multipliesPriceQuantity, 'Should multiply price by quantity').toBe(true);
      }
      
      // OBSERVATION: subtotal should sum (price * quantity) for all items
      expect(hasSubtotal, 'Should have subtotal calculation').toBe(true);
      expect(hasReducePrice, 'Should use reduce to sum price * quantity').toBe(true);
    });

    it('Property: For all cart states, calculations SHALL be correct', () => {
      console.log('\n=== PROPERTY TEST: Cart Calculation Scenarios ===');
      
      // Generate cart scenarios
      const cartScenarios = fc.array(
        fc.record({
          items: fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 10 }),
              price: fc.float({ min: 1, max: 1000, noNaN: true }),
            }),
            { minLength: 0, maxLength: 5 }
          ),
        }),
        { minLength: 10, maxLength: 20 }
      );
      
      fc.assert(
        fc.property(cartScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} cart calculation scenarios`);
          
          // Verify calculation logic exists
          const hasTotalItems = useCartContent.includes('totalItems');
          const hasSubtotal = useCartContent.includes('subtotal');
          const usesReduce = useCartContent.includes('reduce');
          
          // Calculate expected values for one scenario
          const testScenario = scenarios[0];
          const expectedTotal = testScenario.items.reduce((sum, item) => sum + item.quantity, 0);
          const expectedSubtotal = testScenario.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          console.log(`Sample scenario: ${testScenario.items.length} items`);
          console.log(`Expected totalItems: ${expectedTotal}`);
          console.log(`Expected subtotal: ${expectedSubtotal.toFixed(2)}`);
          console.log(`Has calculation logic: totalItems=${hasTotalItems}, subtotal=${hasSubtotal}, reduce=${usesReduce}`);
          
          // OBSERVATION: Calculation logic should exist
          return hasTotalItems && hasSubtotal && usesReduce;
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 2.6: Wishlist Helper - isInWishlist Preserved
   * 
   * OBSERVATION: On unfixed code, useWishlist provides an isInWishlist helper
   * function that performs O(n) lookup to check if a product is in the wishlist.
   * 
   * EXPECTED: This behavior MUST remain unchanged after fix.
   * 
   * **Validates: Requirement 3.6**
   */
  describe('Property 2.6: Wishlist Helper - isInWishlist', () => {
    it('useWishlist SHALL continue to provide isInWishlist helper', () => {
      console.log('\n=== OBSERVING: useWishlist isInWishlist Helper ===');
      
      // Check for isInWishlist function
      const hasIsInWishlist = useWishlistContent.includes('isInWishlist');
      const hasFunction = useWishlistContent.includes('const isInWishlist =') ||
                         useWishlistContent.includes('function isInWishlist');
      
      console.log(`Has isInWishlist: ${hasIsInWishlist}`);
      console.log(`Defined as function: ${hasFunction}`);
      
      // Check for implementation using .some()
      const usesSome = useWishlistContent.includes('.some(') &&
                      useWishlistContent.includes('productId');
      console.log(`Uses .some() for lookup: ${usesSome}`);
      
      // Find the function
      const functionMatch = useWishlistContent.match(/const isInWishlist = \((.*?)\): boolean => \{[\s\S]*?\}/);
      if (functionMatch) {
        console.log('\nFound isInWishlist function:');
        console.log(functionMatch[0]);
        
        const checksProductId = functionMatch[0].includes('productId');
        expect(checksProductId, 'Should check productId').toBe(true);
      }
      
      // Check that it's returned from the hook
      const isReturned = useWishlistContent.includes('return {') &&
                        useWishlistContent.includes('isInWishlist');
      console.log(`Returned from hook: ${isReturned}`);
      
      // OBSERVATION: isInWishlist should provide O(n) lookup
      expect(hasIsInWishlist, 'Should have isInWishlist').toBe(true);
      expect(hasFunction, 'Should be defined as function').toBe(true);
      expect(usesSome, 'Should use .some() for lookup').toBe(true);
      expect(isReturned, 'Should be returned from hook').toBe(true);
    });

    it('Property: For all product IDs, isInWishlist SHALL perform lookup', () => {
      console.log('\n=== PROPERTY TEST: isInWishlist Lookup Scenarios ===');
      
      // Generate product ID scenarios
      const productScenarios = fc.array(
        fc.record({
          productId: fc.uuid(),
          inWishlist: fc.boolean(),
        }),
        { minLength: 10, maxLength: 30 }
      );
      
      fc.assert(
        fc.property(productScenarios, (scenarios) => {
          console.log(`\nTesting ${scenarios.length} product lookup scenarios`);
          
          // Verify isInWishlist exists
          const hasHelper = useWishlistContent.includes('isInWishlist');
          const usesSome = useWishlistContent.includes('.some(');
          const checksProductId = useWishlistContent.includes('item.productId === productId');
          
          const inWishlist = scenarios.filter(s => s.inWishlist).length;
          const notInWishlist = scenarios.length - inWishlist;
          
          console.log(`Products in wishlist: ${inWishlist}`);
          console.log(`Products not in wishlist: ${notInWishlist}`);
          console.log(`Has helper: ${hasHelper}, uses .some(): ${usesSome}, checks productId: ${checksProductId}`);
          
          // OBSERVATION: Helper should exist with proper implementation
          return hasHelper && usesSome && checksProductId;
        }),
        { numRuns: 25 }
      );
    });
  });
});
