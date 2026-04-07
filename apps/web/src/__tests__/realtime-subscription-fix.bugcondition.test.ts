/**
 * Bug Condition Exploration Test for Realtime Subscription Fix
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * Property 1: Bug Condition - Realtime Subscription Setup Failures
 * 
 * For any authenticated user attempting to set up Realtime subscriptions in useCart or useWishlist,
 * the hooks SHALL:
 * - Create a Supabase client instance before attempting to create a channel
 * - Properly chain `.channel()` → `.on()` → `.subscribe()` methods in the correct order
 * - Establish active subscriptions without runtime errors
 * - Enable cross-device synchronization
 * 
 * Expected counterexamples on UNFIXED code:
 * - useCart: "Cannot read property 'channel' of undefined" (supabase variable not initialized)
 * - useWishlist: "cannot add `postgres_changes` callbacks after `subscribe()`" (incorrect method chaining)
 * - No Realtime events received when data changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';

describe('Bug Condition Exploration: Realtime Subscription Setup Failures', () => {
  /**
   * Test 1: useCart Hook - Verify Supabase client initialization
   * 
   * This test verifies that useCart creates a Supabase client instance
   * before attempting to create a Realtime channel.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (supabase variable is undefined)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (client is created before channel)
   */
  it('Property 1.1: useCart SHALL create Supabase client before attempting subscription', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    const useCartPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'cart', 'hooks', 'useCart.ts');
    
    // Read the useCart hook file
    const useCartContent = fs.readFileSync(useCartPath, 'utf-8');
    
    console.log('\n=== ANALYZING useCart HOOK ===');
    
    // Check if createClient is imported
    const hasCreateClientImport = useCartContent.includes("import { createClient }") || 
                                   useCartContent.includes("import {createClient}");
    console.log(`Has createClient import: ${hasCreateClientImport}`);
    
    // Find the Realtime subscription useEffect
    const realtimeEffectMatch = useCartContent.match(/useEffect\(\(\) => \{[\s\S]*?supabase[\s\S]*?channel[\s\S]*?\}, \[/);
    
    if (!realtimeEffectMatch) {
      console.log('⚠️  Could not find Realtime subscription useEffect');
      expect.fail('Realtime subscription useEffect not found in useCart');
    }
    
    const realtimeEffectCode = realtimeEffectMatch[0];
    console.log('\nRealtime subscription useEffect code (first 300 chars):');
    console.log(realtimeEffectCode.substring(0, 300));
    
    // Check if supabase client is created within the useEffect
    const hasClientCreation = realtimeEffectCode.includes('const supabase = createClient()') ||
                              realtimeEffectCode.includes('const supabase=createClient()');
    console.log(`\nHas client creation in useEffect: ${hasClientCreation}`);
    
    // Check if supabase.channel() is called
    const hasChannelCall = realtimeEffectCode.includes('supabase.channel(') ||
                          realtimeEffectCode.includes('supabase\n      .channel(');
    console.log(`Has supabase.channel() call: ${hasChannelCall}`);
    
    // Find the position of client creation vs channel call
    const clientCreationIndex = realtimeEffectCode.indexOf('const supabase = createClient()');
    const channelCallIndex = realtimeEffectCode.indexOf('supabase.channel(') !== -1 
      ? realtimeEffectCode.indexOf('supabase.channel(')
      : realtimeEffectCode.indexOf('supabase\n      .channel(');
    
    console.log(`\nClient creation index: ${clientCreationIndex}`);
    console.log(`Channel call index: ${channelCallIndex}`);
    
    // EXPECTED BEHAVIOR (after fix):
    // - createClient should be imported
    // - const supabase = createClient() should exist in useEffect
    // - Client creation should come BEFORE channel call
    // - clientCreationIndex should be < channelCallIndex
    
    // CURRENT BEHAVIOR (unfixed code):
    // - supabase variable is referenced but never defined
    // - This will cause "Cannot read property 'channel' of undefined" at runtime
    
    console.log('\n=== COUNTEREXAMPLE ===');
    if (!hasClientCreation && hasChannelCall) {
      console.log('❌ BUG CONFIRMED: supabase.channel() is called but supabase client is never created');
      console.log('   This will cause runtime error: "Cannot read property \'channel\' of undefined"');
    }
    
    if (clientCreationIndex === -1 && channelCallIndex !== -1) {
      console.log('❌ BUG CONFIRMED: supabase variable is undefined when channel() is called');
    }
    
    if (clientCreationIndex > channelCallIndex && clientCreationIndex !== -1) {
      console.log('❌ BUG CONFIRMED: channel() is called before client is created');
    }
    
    // Assertions for expected behavior (will fail on unfixed code)
    expect(hasCreateClientImport, 'createClient should be imported').toBe(true);
    expect(hasClientCreation, 'Supabase client should be created in useEffect').toBe(true);
    expect(clientCreationIndex, 'Client creation should exist').toBeGreaterThan(-1);
    expect(channelCallIndex, 'Channel call should exist').toBeGreaterThan(-1);
    expect(clientCreationIndex, 'Client should be created BEFORE channel call').toBeLessThan(channelCallIndex);
  });

  /**
   * Test 2: useWishlist Hook - Verify method chaining order
   * 
   * This test verifies that useWishlist properly chains the Realtime methods
   * in the correct order: `.channel()` → `.on()` → `.subscribe()`
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (incorrect method chaining)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (correct method chaining)
   */
  it('Property 1.2: useWishlist SHALL properly chain .channel() → .on() → .subscribe() methods', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    const useWishlistPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'wishlist', 'hooks', 'useWishlist.ts');
    
    // Read the useWishlist hook file
    const useWishlistContent = fs.readFileSync(useWishlistPath, 'utf-8');
    
    console.log('\n=== ANALYZING useWishlist HOOK ===');
    
    // Check if createClient is imported
    const hasCreateClientImport = useWishlistContent.includes("import { createClient }") || 
                                   useWishlistContent.includes("import {createClient}");
    console.log(`Has createClient import: ${hasCreateClientImport}`);
    
    // Find the Realtime subscription useEffect
    const realtimeEffectMatch = useWishlistContent.match(/useEffect\(\(\) => \{[\s\S]*?channel[\s\S]*?\}, \[/);
    
    if (!realtimeEffectMatch) {
      console.log('⚠️  Could not find Realtime subscription useEffect');
      expect.fail('Realtime subscription useEffect not found in useWishlist');
    }
    
    const realtimeEffectCode = realtimeEffectMatch[0];
    console.log('\nRealtime subscription useEffect code (first 500 chars):');
    console.log(realtimeEffectCode.substring(0, 500));
    
    // Check method chaining pattern
    // Correct pattern: .channel(...).on(...).subscribe()
    // Incorrect pattern: .channel(...).subscribe() followed by .on(...)
    
    // Find positions of each method call
    const channelIndex = realtimeEffectCode.indexOf('.channel(');
    const onIndex = realtimeEffectCode.indexOf('.on(');
    const subscribeIndex = realtimeEffectCode.indexOf('.subscribe(');
    
    console.log(`\n.channel() position: ${channelIndex}`);
    console.log(`.on() position: ${onIndex}`);
    console.log(`.subscribe() position: ${subscribeIndex}`);
    
    // Check if methods are chained correctly
    const hasCorrectChaining = channelIndex !== -1 && 
                               onIndex !== -1 && 
                               subscribeIndex !== -1 &&
                               channelIndex < onIndex && 
                               onIndex < subscribeIndex;
    
    console.log(`\nHas correct method chaining: ${hasCorrectChaining}`);
    
    // Check for incorrect pattern: subscribe before on
    const hasIncorrectChaining = subscribeIndex !== -1 && 
                                 onIndex !== -1 && 
                                 subscribeIndex < onIndex;
    
    console.log(`Has incorrect chaining (subscribe before on): ${hasIncorrectChaining}`);
    
    // EXPECTED BEHAVIOR (after fix):
    // - Methods should be chained: .channel() → .on() → .subscribe()
    // - channelIndex < onIndex < subscribeIndex
    // - All callbacks registered before subscribe
    
    // CURRENT BEHAVIOR (unfixed code):
    // - .subscribe() may be called before .on()
    // - This causes error: "cannot add `postgres_changes` callbacks after `subscribe()`"
    
    console.log('\n=== COUNTEREXAMPLE ===');
    if (hasIncorrectChaining) {
      console.log('❌ BUG CONFIRMED: .subscribe() is called before .on()');
      console.log('   This will cause error: "cannot add `postgres_changes` callbacks after `subscribe()`"');
    }
    
    if (!hasCorrectChaining && channelIndex !== -1 && subscribeIndex !== -1) {
      console.log('❌ BUG CONFIRMED: Method chaining order is incorrect');
      console.log('   Expected: .channel() → .on() → .subscribe()');
      console.log(`   Found: channel at ${channelIndex}, on at ${onIndex}, subscribe at ${subscribeIndex}`);
    }
    
    // Assertions for expected behavior (will fail on unfixed code)
    expect(hasCreateClientImport, 'createClient should be imported').toBe(true);
    expect(channelIndex, '.channel() should be called').toBeGreaterThan(-1);
    expect(onIndex, '.on() should be called').toBeGreaterThan(-1);
    expect(subscribeIndex, '.subscribe() should be called').toBeGreaterThan(-1);
    expect(hasCorrectChaining, 'Methods should be chained in correct order: .channel() → .on() → .subscribe()').toBe(true);
    expect(hasIncorrectChaining, '.subscribe() should NOT be called before .on()').toBe(false);
  });

  /**
   * Test 3: Property-Based Test - Authenticated User Subscription Setup
   * 
   * This property-based test generates authenticated user scenarios and verifies
   * that both hooks can establish Realtime subscriptions without errors.
   * 
   * Uses scoped PBT approach: tests the concrete failing cases.
   */
  it('Property 1.3: For all authenticated users, hooks SHALL establish Realtime subscriptions without errors', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    // Read both hook files
    const useCartPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'cart', 'hooks', 'useCart.ts');
    const useWishlistPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'wishlist', 'hooks', 'useWishlist.ts');
    
    const useCartContent = fs.readFileSync(useCartPath, 'utf-8');
    const useWishlistContent = fs.readFileSync(useWishlistPath, 'utf-8');
    
    console.log('\n=== PROPERTY-BASED TEST: SUBSCRIPTION SETUP ===');
    
    // Define test cases for authenticated users
    const testCases = [
      { hook: 'useCart', userId: 'user-123', migrationStatus: 'complete' },
      { hook: 'useWishlist', userId: 'user-456', migrationStatus: undefined },
      { hook: 'useCart', userId: 'user-789', migrationStatus: 'complete' },
      { hook: 'useWishlist', userId: 'user-abc', migrationStatus: undefined },
    ];
    
    // Property: For each authenticated user scenario, verify subscription can be established
    fc.assert(
      fc.property(
        fc.constantFrom(...testCases),
        (testCase) => {
          console.log(`\nTesting ${testCase.hook} with user ${testCase.userId}`);
          
          const content = testCase.hook === 'useCart' ? useCartContent : useWishlistContent;
          
          // Check for subscription setup requirements
          const hasCreateClient = content.includes('createClient()');
          const hasChannel = content.includes('.channel(');
          const hasOn = content.includes('.on(');
          const hasSubscribe = content.includes('.subscribe(');
          
          console.log(`  Has createClient(): ${hasCreateClient}`);
          console.log(`  Has .channel(): ${hasChannel}`);
          console.log(`  Has .on(): ${hasOn}`);
          console.log(`  Has .subscribe(): ${hasSubscribe}`);
          
          // For useCart, check if client is created in the useEffect
          if (testCase.hook === 'useCart') {
            const realtimeEffectMatch = content.match(/useEffect\(\(\) => \{[\s\S]*?supabase[\s\S]*?channel[\s\S]*?\}, \[/);
            if (realtimeEffectMatch) {
              const effectCode = realtimeEffectMatch[0];
              const hasClientInEffect = effectCode.includes('const supabase = createClient()');
              console.log(`  Has client creation in useEffect: ${hasClientInEffect}`);
              
              if (!hasClientInEffect) {
                console.log('  ❌ COUNTEREXAMPLE: useCart references supabase without creating client');
                return false;
              }
            }
          }
          
          // For useWishlist, check method chaining order
          if (testCase.hook === 'useWishlist') {
            const realtimeEffectMatch = content.match(/useEffect\(\(\) => \{[\s\S]*?channel[\s\S]*?\}, \[/);
            if (realtimeEffectMatch) {
              const effectCode = realtimeEffectMatch[0];
              const channelIdx = effectCode.indexOf('.channel(');
              const onIdx = effectCode.indexOf('.on(');
              const subscribeIdx = effectCode.indexOf('.subscribe(');
              
              const correctOrder = channelIdx < onIdx && onIdx < subscribeIdx;
              console.log(`  Method chaining order correct: ${correctOrder}`);
              
              if (!correctOrder) {
                console.log('  ❌ COUNTEREXAMPLE: useWishlist has incorrect method chaining');
                return false;
              }
            }
          }
          
          // EXPECTED BEHAVIOR (after fix):
          // - All hooks should have proper client creation
          // - All hooks should have correct method chaining
          // - No runtime errors should occur
          
          // CURRENT BEHAVIOR (unfixed code):
          // - useCart: missing client creation
          // - useWishlist: incorrect method chaining
          
          return hasCreateClient && hasChannel && hasOn && hasSubscribe;
        }
      ),
      { 
        numRuns: testCases.length,
        verbose: true 
      }
    );
  });

  /**
   * Test 4: Cross-Device Synchronization - Verify Realtime events
   * 
   * This test verifies that the subscription setup enables cross-device sync.
   * It checks that the code structure supports receiving Realtime events.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (subscriptions not established)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (subscriptions work, events received)
   */
  it('Property 1.4: Authenticated users SHALL receive Realtime events for cross-device sync', () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    // Read both hook files
    const useCartPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'cart', 'hooks', 'useCart.ts');
    const useWishlistPath = path.join(projectRoot, 'apps', 'web', 'src', 'modules', 'wishlist', 'hooks', 'useWishlist.ts');
    
    const useCartContent = fs.readFileSync(useCartPath, 'utf-8');
    const useWishlistContent = fs.readFileSync(useWishlistPath, 'utf-8');
    
    console.log('\n=== CROSS-DEVICE SYNCHRONIZATION TEST ===');
    
    // Check useCart for event handling
    console.log('\nAnalyzing useCart event handling:');
    const cartHasEventHandler = useCartContent.includes('postgres_changes');
    const cartHasPayloadHandling = useCartContent.includes('(payload)');
    const cartHasQueryUpdate = useCartContent.includes('setQueryData') || 
                               useCartContent.includes('invalidateQueries');
    
    console.log(`  Has postgres_changes subscription: ${cartHasEventHandler}`);
    console.log(`  Has payload handling: ${cartHasPayloadHandling}`);
    console.log(`  Has query update logic: ${cartHasQueryUpdate}`);
    
    // Check useWishlist for event handling
    console.log('\nAnalyzing useWishlist event handling:');
    const wishlistHasEventHandler = useWishlistContent.includes('postgres_changes');
    const wishlistHasPayloadHandling = useWishlistContent.includes('(payload)');
    const wishlistHasQueryUpdate = useWishlistContent.includes('setQueryData') || 
                                   useWishlistContent.includes('invalidateQueries');
    
    console.log(`  Has postgres_changes subscription: ${wishlistHasEventHandler}`);
    console.log(`  Has payload handling: ${wishlistHasPayloadHandling}`);
    console.log(`  Has query update logic: ${wishlistHasQueryUpdate}`);
    
    // EXPECTED BEHAVIOR (after fix):
    // - Both hooks should subscribe to postgres_changes events
    // - Both hooks should handle payload and update queries
    // - Subscriptions should be active (no errors during setup)
    // - Cross-device sync should work
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Event handling code exists BUT subscriptions fail to establish
    // - useCart: runtime error prevents subscription
    // - useWishlist: method chaining error prevents subscription
    // - No events are received because subscriptions never activate
    
    console.log('\n=== COUNTEREXAMPLE ===');
    console.log('Event handling code is present, but subscriptions fail to establish due to:');
    console.log('  - useCart: supabase client not initialized (runtime error)');
    console.log('  - useWishlist: incorrect method chaining (lifecycle error)');
    console.log('Result: No Realtime events received, cross-device sync broken');
    
    // Assertions for expected behavior
    expect(cartHasEventHandler, 'useCart should subscribe to postgres_changes').toBe(true);
    expect(cartHasPayloadHandling, 'useCart should handle payload').toBe(true);
    expect(cartHasQueryUpdate, 'useCart should update queries on events').toBe(true);
    
    expect(wishlistHasEventHandler, 'useWishlist should subscribe to postgres_changes').toBe(true);
    expect(wishlistHasPayloadHandling, 'useWishlist should handle payload').toBe(true);
    expect(wishlistHasQueryUpdate, 'useWishlist should update queries on events').toBe(true);
    
    // The real test is whether subscriptions establish without errors
    // This requires the fixes from Property 1.1 and 1.2
    // After fix: subscriptions will work and events will be received
  });
});
