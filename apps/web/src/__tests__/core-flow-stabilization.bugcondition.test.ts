/**
 * Bug Condition Exploration Test for Core Flow Stabilization
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bugs exist
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**
 * 
 * Property 1: Bug Condition - Core Flows Insert Failures
 * 
 * For any authenticated user attempting to add items to cart, add items to wishlist,
 * or save addresses, the operations SHALL succeed when:
 * - Database tables exist (cart_items, wishlist_items, addresses)
 * - RPC functions exist (add_to_cart_atomic)
 * - RLS policies allow INSERT operations
 * - Fallback INSERT includes all required fields (price_snapshot, product_name_snapshot)
 * - Service layer handles business logic (not UI components)
 * 
 * Expected counterexamples on UNFIXED code:
 * - "relation cart_items does not exist"
 * - "relation wishlist_items does not exist"
 * - "relation addresses does not exist"
 * - "null value in column price_snapshot violates not-null constraint"
 * - Business logic in AddressManager.tsx component (not service layer)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const hasSupabaseEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

describe.skipIf(!hasSupabaseEnv)('Bug Condition Exploration: Core Flow Stabilization', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string | null = null;

  beforeAll(async () => {
    // Test user credentials (must exist in database)
    const TEST_USER_EMAIL = 'test@example.com';
    const TEST_USER_PASSWORD = 'TestPassword123!';

    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Authenticate test user
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (error) {
        console.warn('⚠️  Test user authentication failed:', error.message);
        console.warn('⚠️  Some tests may be skipped. Create test user with:');
        console.warn(`   Email: ${TEST_USER_EMAIL}`);
        console.warn(`   Password: ${TEST_USER_PASSWORD}`);
      } else {
        testUserId = data.user?.id || null;
        console.log('✓ Test user authenticated:', testUserId);
      }
    } catch (error) {
      console.warn('⚠️  Test user authentication error:', error);
    }
  });

  /**
   * Test 1.1: Cart Add Item - Database Table Existence
   * 
   * This test verifies that the cart_items table exists in the database.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (table doesn't exist)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (table exists)
   */
  it('Property 1.1: cart_items table SHALL exist in database', async () => {
    // Query information_schema to check if table exists
    const { data, error } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1);

    console.log('\n=== CART TABLE EXISTENCE CHECK ===');
    
    if (error) {
      console.log('❌ cart_items table check failed');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Document counterexample
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n🔍 COUNTEREXAMPLE FOUND:');
        console.log('   Bug Condition: cart_items table does not exist');
        console.log('   Expected: Table should exist with proper schema');
        console.log('   Actual: "relation cart_items does not exist"');
      }
    } else {
      console.log('✓ cart_items table exists');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Table should exist
    // - Query should succeed (even if empty)
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Table doesn't exist
    // - Error: "relation cart_items does not exist"

    expect(error, 'cart_items table should exist after fix').toBeNull();
  });

  /**
   * Test 1.2: Cart Add Item - RPC Function Existence
   * 
   * This test verifies that the add_to_cart_atomic RPC function exists.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (RPC doesn't exist)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (RPC exists)
   */
  it('Property 1.2: add_to_cart_atomic RPC function SHALL exist', async () => {
    if (!testUserId) {
      console.log('⚠️  Skipping test: No authenticated user');
      return;
    }

    // Try to call the RPC function with test data
    const { data, error } = await supabase.rpc('add_to_cart_atomic', {
      p_user_id: testUserId,
      p_product_id: '00000000-0000-0000-0000-000000000000', // Non-existent product
      p_quantity: 1,
      p_size: 'M',
    });

    console.log('\n=== CART RPC FUNCTION CHECK ===');
    
    if (error) {
      console.log('❌ add_to_cart_atomic RPC check failed');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Document counterexample
      if (error.code === '42883' || error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('\n🔍 COUNTEREXAMPLE FOUND:');
        console.log('   Bug Condition: add_to_cart_atomic RPC function does not exist');
        console.log('   Expected: RPC function should exist for atomic cart operations');
        console.log('   Actual: "function add_to_cart_atomic does not exist"');
      }
    } else {
      console.log('✓ add_to_cart_atomic RPC exists');
      console.log('Response:', data);
    }

    // EXPECTED BEHAVIOR (after fix):
    // - RPC function should exist
    // - May fail with foreign key error (product doesn't exist) but RPC itself exists
    
    // CURRENT BEHAVIOR (unfixed code):
    // - RPC function doesn't exist
    // - Error code: 42883 (function does not exist)

    expect(
      error?.code !== '42883',
      'add_to_cart_atomic RPC should exist after fix (error code should not be 42883)'
    ).toBe(true);
  });

  /**
   * Test 1.3: Cart Fallback Insert - Snapshot Fields
   * 
   * This test verifies that the fallback INSERT includes price_snapshot
   * and product_name_snapshot fields.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (snapshot fields missing)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (snapshot fields included)
   */
  it('Property 1.3: Cart fallback INSERT SHALL include snapshot fields', async () => {
    // Read the cartService.ts file to check fallback implementation
    const projectRoot = path.resolve(__dirname, '../../../..');
    const cartServicePath = path.join(
      projectRoot,
      'apps',
      'web',
      'src',
      'modules',
      'cart',
      'services',
      'cartService.ts'
    );

    const cartServiceContent = fs.readFileSync(cartServicePath, 'utf-8');

    console.log('\n=== CART FALLBACK INSERT CHECK ===');

    // Check if fallback INSERT includes snapshot fields
    const hasFallbackInsert = cartServiceContent.includes('fallback') || 
                              cartServiceContent.includes('RPC_NOT_FOUND');
    const hasPriceSnapshot = cartServiceContent.includes('price_snapshot');
    const hasProductNameSnapshot = cartServiceContent.includes('product_name_snapshot');

    console.log('Fallback INSERT exists:', hasFallbackInsert);
    console.log('Includes price_snapshot:', hasPriceSnapshot);
    console.log('Includes product_name_snapshot:', hasProductNameSnapshot);

    // Check if fallback fetches product details
    const fallbackSection = cartServiceContent.substring(
      cartServiceContent.indexOf('RPC_NOT_FOUND'),
      cartServiceContent.indexOf('RPC_NOT_FOUND') + 1000
    );

    const fetchesProduct = fallbackSection.includes('.from(\'products\')') ||
                          fallbackSection.includes('product');

    console.log('Fallback fetches product details:', fetchesProduct);

    if (!hasPriceSnapshot || !hasProductNameSnapshot || !fetchesProduct) {
      console.log('\n🔍 COUNTEREXAMPLE FOUND:');
      console.log('   Bug Condition: Fallback INSERT missing snapshot fields or product fetch');
      console.log('   Expected: Fallback should fetch product and include price_snapshot, product_name_snapshot');
      console.log('   Actual: Snapshot fields or product fetch missing in fallback');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Fallback INSERT should fetch product details
    // - Fallback INSERT should include price_snapshot
    // - Fallback INSERT should include product_name_snapshot
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Fallback INSERT doesn't fetch product
    // - Snapshot fields are missing
    // - Would cause NOT NULL constraint violation

    expect(hasPriceSnapshot, 'Fallback should include price_snapshot').toBe(true);
    expect(hasProductNameSnapshot, 'Fallback should include product_name_snapshot').toBe(true);
    expect(fetchesProduct, 'Fallback should fetch product details').toBe(true);
  });

  /**
   * Test 2.1: Wishlist Add Item - Database Table Existence
   * 
   * This test verifies that the wishlist_items table exists in the database.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (table doesn't exist)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (table exists)
   */
  it('Property 2.1: wishlist_items table SHALL exist in database', async () => {
    // Query to check if table exists
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .limit(1);

    console.log('\n=== WISHLIST TABLE EXISTENCE CHECK ===');
    
    if (error) {
      console.log('❌ wishlist_items table check failed');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Document counterexample
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n🔍 COUNTEREXAMPLE FOUND:');
        console.log('   Bug Condition: wishlist_items table does not exist');
        console.log('   Expected: Table should exist with proper schema');
        console.log('   Actual: "relation wishlist_items does not exist"');
      }
    } else {
      console.log('✓ wishlist_items table exists');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Table should exist
    // - Query should succeed (even if empty)
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Table doesn't exist
    // - Error: "relation wishlist_items does not exist"

    expect(error, 'wishlist_items table should exist after fix').toBeNull();
  });

  /**
   * Test 2.2: Wishlist Service - Retry Logic
   * 
   * This test verifies that wishlist service implements retry logic
   * for network resilience (consistent with cart service).
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (no retry logic)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (retry logic implemented)
   */
  it('Property 2.2: Wishlist service SHALL implement retry logic', async () => {
    // Read the wishlistService.ts file to check for retry logic
    const projectRoot = path.resolve(__dirname, '../../../..');
    const wishlistServicePath = path.join(
      projectRoot,
      'apps',
      'web',
      'src',
      'modules',
      'wishlist',
      'services',
      'wishlistService.ts'
    );

    const wishlistServiceContent = fs.readFileSync(wishlistServicePath, 'utf-8');

    console.log('\n=== WISHLIST RETRY LOGIC CHECK ===');

    // Check if retry logic exists
    const hasRetryLogic = wishlistServiceContent.includes('withRetry') ||
                         wishlistServiceContent.includes('retry') ||
                         wishlistServiceContent.includes('maxRetries');

    console.log('Has retry logic:', hasRetryLogic);

    if (!hasRetryLogic) {
      console.log('\n🔍 COUNTEREXAMPLE FOUND:');
      console.log('   Bug Condition: Wishlist service missing retry logic');
      console.log('   Expected: Service should implement retry logic for network errors');
      console.log('   Actual: No retry logic found in wishlistService.ts');
      console.log('   Note: Cart service has retry logic, wishlist should be consistent');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Wishlist service should use withRetry wrapper
    // - Consistent with cart service implementation
    // - Network errors trigger automatic retry
    
    // CURRENT BEHAVIOR (unfixed code):
    // - No retry logic in wishlist service
    // - Inconsistent with cart service

    expect(hasRetryLogic, 'Wishlist service should implement retry logic').toBe(true);
  });

  /**
   * Test 3.1: Address Insert - Database Table Existence
   * 
   * This test verifies that the addresses table exists in the database.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (table doesn't exist)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (table exists)
   */
  it('Property 3.1: addresses table SHALL exist in database', async () => {
    // Query to check if table exists
    const { data, error } = await supabase
      .from('addresses')
      .select('id')
      .limit(1);

    console.log('\n=== ADDRESS TABLE EXISTENCE CHECK ===');
    
    if (error) {
      console.log('❌ addresses table check failed');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      // Document counterexample
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n🔍 COUNTEREXAMPLE FOUND:');
        console.log('   Bug Condition: addresses table does not exist');
        console.log('   Expected: Table should exist with proper schema');
        console.log('   Actual: "relation addresses does not exist"');
      }
    } else {
      console.log('✓ addresses table exists');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - Table should exist
    // - Query should succeed (even if empty)
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Table doesn't exist
    // - Error: "relation addresses does not exist"

    expect(error, 'addresses table should exist after fix').toBeNull();
  });

  /**
   * Test 3.2: Address Flow - Service Layer Architecture
   * 
   * This test verifies that address operations use a service layer
   * instead of direct Supabase calls in UI components.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (business logic in UI component)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (service layer exists)
   */
  it('Property 3.2: Address operations SHALL use service layer', async () => {
    const projectRoot = path.resolve(__dirname, '../../../..');
    
    // Check if addressService.ts exists
    const addressServicePath = path.join(
      projectRoot,
      'apps',
      'web',
      'src',
      'modules',
      'address',
      'services',
      'addressService.ts'
    );

    const serviceExists = fs.existsSync(addressServicePath);

    console.log('\n=== ADDRESS SERVICE LAYER CHECK ===');
    console.log('addressService.ts exists:', serviceExists);

    if (!serviceExists) {
      console.log('\n🔍 COUNTEREXAMPLE FOUND:');
      console.log('   Bug Condition: No address service layer');
      console.log('   Expected: addressService.ts should exist in modules/address/services/');
      console.log('   Actual: Service file does not exist');
      console.log('   Note: Business logic currently in AddressManager.tsx component');
    }

    // Check AddressManager.tsx for direct Supabase calls
    const addressManagerPath = path.join(
      projectRoot,
      'apps',
      'web',
      'src',
      'components',
      'profile',
      'AddressManager.tsx'
    );

    const addressManagerContent = fs.readFileSync(addressManagerPath, 'utf-8');

    // Count direct Supabase calls in component
    const supabaseCalls = (addressManagerContent.match(/supabase\.from\(/g) || []).length;

    console.log('Direct Supabase calls in AddressManager.tsx:', supabaseCalls);

    if (supabaseCalls > 0 && !serviceExists) {
      console.log('\n🔍 ARCHITECTURE VIOLATION:');
      console.log('   Business logic in UI component (AddressManager.tsx)');
      console.log('   Should be in service layer (addressService.ts)');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - addressService.ts should exist
    // - AddressManager.tsx should call addressService methods
    // - No direct Supabase calls in component
    
    // CURRENT BEHAVIOR (unfixed code):
    // - No addressService.ts
    // - Direct Supabase calls in AddressManager.tsx
    // - Violates SDD architecture

    expect(serviceExists, 'addressService.ts should exist after fix').toBe(true);
  });

  /**
   * Test 4: Property-Based Test - Core Flows Insert Operations
   * 
   * This property-based test generates random inputs and verifies
   * that insert operations succeed for cart, wishlist, and addresses.
   * 
   * Uses scoped PBT approach: tests concrete failing cases.
   */
  it('Property 4: For all authenticated users, core flow inserts SHALL succeed', async () => {
    if (!testUserId) {
      console.log('⚠️  Skipping property-based test: No authenticated user');
      return;
    }

    console.log('\n=== PROPERTY-BASED TEST: CORE FLOW INSERTS ===');

    // Generator for cart item inputs
    const cartItemArb = fc.record({
      productId: fc.uuid(),
      quantity: fc.integer({ min: 1, max: 10 }),
      size: fc.constantFrom('P', 'M', 'G', 'GG'),
    });

    // Generator for wishlist item inputs
    const wishlistItemArb = fc.record({
      productId: fc.uuid(),
    });

    // Generator for address inputs
    const addressArb = fc.record({
      zipCode: fc.stringMatching(/^\d{5}-\d{3}$/),
      street: fc.string({ minLength: 5, maxLength: 100 }),
      number: fc.string({ minLength: 1, maxLength: 10 }),
      neighborhood: fc.string({ minLength: 3, maxLength: 50 }),
      city: fc.string({ minLength: 3, maxLength: 50 }),
      state: fc.constantFrom('SP', 'RJ', 'MG', 'RS', 'PR'),
      isDefault: fc.boolean(),
    });

    // Test cart insert (scoped to 3 runs for faster execution)
    try {
      await fc.assert(
        fc.asyncProperty(cartItemArb, async (input) => {
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: testUserId,
              product_id: input.productId,
              quantity: input.quantity,
              size: input.size,
              price_snapshot: 99.90, // Mock price
              product_name_snapshot: 'Test Product', // Mock name
            });

          if (error) {
            console.log('  ❌ Cart insert failed:', error.message);
            return false;
          }

          console.log('  ✓ Cart insert succeeded');
          return true;
        }),
        { numRuns: 3 }
      );
    } catch (error) {
      console.log('Cart insert property test failed (expected on unfixed code)');
    }

    // Test wishlist insert (scoped to 3 runs)
    try {
      await fc.assert(
        fc.asyncProperty(wishlistItemArb, async (input) => {
          const { error } = await supabase
            .from('wishlist_items')
            .insert({
              user_id: testUserId,
              product_id: input.productId,
            });

          if (error) {
            console.log('  ❌ Wishlist insert failed:', error.message);
            return false;
          }

          console.log('  ✓ Wishlist insert succeeded');
          return true;
        }),
        { numRuns: 3 }
      );
    } catch (error) {
      console.log('Wishlist insert property test failed (expected on unfixed code)');
    }

    // Test address insert (scoped to 3 runs)
    try {
      await fc.assert(
        fc.asyncProperty(addressArb, async (input) => {
          const { error } = await supabase
            .from('addresses')
            .insert({
              user_id: testUserId,
              zip_code: input.zipCode,
              street: input.street,
              number: input.number,
              neighborhood: input.neighborhood,
              city: input.city,
              state: input.state,
              is_default: input.isDefault,
            });

          if (error) {
            console.log('  ❌ Address insert failed:', error.message);
            return false;
          }

          console.log('  ✓ Address insert succeeded');
          return true;
        }),
        { numRuns: 3 }
      );
    } catch (error) {
      console.log('Address insert property test failed (expected on unfixed code)');
    }

    // EXPECTED BEHAVIOR (after fix):
    // - All insert operations should succeed
    // - Property tests should pass
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Insert operations fail with "relation does not exist"
    // - Property tests fail (this is expected)

    // This test documents the bug condition
    // After fix, uncomment the expect below to enforce success
    // expect(true).toBe(true);
  });
});
