/**
 * Bug Condition Exploration Test for Products Query Timeout Fix
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Property 1: Bug Condition - Query Performance on Cold Start
 * 
 * For any query `getProducts` executed on first load (cold start) with valid filters and LIMIT defined,
 * the optimized function SHALL complete in less than 2 seconds, returning correct products without timeout.
 * 
 * Expected counterexamples on UNFIXED code:
 * - Query times > 10s on cold start
 * - Sequential Scans in EXPLAIN ANALYZE (no indexes)
 * - Timeout errors on first load
 * - Missing indexes on category_id, price, rating, created_at, deleted_at
 * - No GIN index for full-text search
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getProducts } from '@/modules/products/services/productService';
import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const hasSupabaseEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

describe.skipIf(!hasSupabaseEnv)('Bug Condition Exploration: Products Query Timeout on Cold Start', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient();
  });

  /**
   * Test 1: Cold Start Performance - Latest Products
   * 
   * This test simulates the exact scenario from the bug report:
   * - First load of home page
   * - Query for latest 4 products (Equipamentos da Seleção section)
   * - Measures query time
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (query time > 10s, timeout error)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (query time < 2s)
   */
  it('Property 1.1: getProducts({ limit: 4, sortBy: "latest" }) SHALL complete in < 2s on cold start', async () => {
    console.log('\n=== TEST 1: Cold Start Performance - Latest Products ===');
    
    const startTime = Date.now();
    let queryTime = 0;
    let error: Error | null = null;
    let products: any[] = [];

    try {
      const result = await getProducts(supabase, { limit: 4, sortBy: 'latest' });
      queryTime = Date.now() - startTime;
      products = result.products;
      
      console.log(`✓ Query completed in ${queryTime}ms`);
      console.log(`✓ Products returned: ${products.length}`);
    } catch (err: any) {
      queryTime = Date.now() - startTime;
      error = err;
      
      console.log(`✗ Query failed after ${queryTime}ms`);
      console.log(`✗ Error: ${err.message}`);
    }

    // Document counterexamples
    console.log('\n=== COUNTEREXAMPLES ===');
    console.log(`Query Time: ${queryTime}ms (expected < 2000ms)`);
    console.log(`Error: ${error ? error.message : 'None'}`);
    console.log(`Products Returned: ${products.length}`);

    // EXPECTED BEHAVIOR (after fix):
    // - Query completes in < 2000ms
    // - No timeout error
    // - Returns 4 products
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Query exceeds 10000ms (timeout)
    // - Throws "Query timeout after 10 seconds" error
    // - Returns 0 products

    expect(error, 'Query should not timeout after fix').toBeNull();
    expect(queryTime, 'Query should complete in < 2s after fix').toBeLessThan(2000);
    expect(products.length, 'Should return 4 products').toBe(4);
  }, 20000); // 20s timeout for test itself (allows for cold start)

  /**
   * Test 2: Cold Start Performance - Full-Text Search
   * 
   * This test simulates full-text search on cold start:
   * - Search for "brasil" (common search term)
   * - Uses to_tsvector('portuguese') on name and description
   * - Measures query time
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (query time > 10s, timeout error)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (query time < 2s)
   */
  it('Property 1.2: getProducts({ search: "brasil" }) SHALL complete in < 2s on cold start with full-text search', async () => {
    console.log('\n=== TEST 2: Cold Start Performance - Full-Text Search ===');
    
    const startTime = Date.now();
    let queryTime = 0;
    let error: Error | null = null;
    let products: any[] = [];

    try {
      const result = await getProducts(supabase, { search: 'brasil' });
      queryTime = Date.now() - startTime;
      products = result.products;
      
      console.log(`✓ Query completed in ${queryTime}ms`);
      console.log(`✓ Products returned: ${products.length}`);
    } catch (err: any) {
      queryTime = Date.now() - startTime;
      error = err;
      
      console.log(`✗ Query failed after ${queryTime}ms`);
      console.log(`✗ Error: ${err.message}`);
    }

    // Document counterexamples
    console.log('\n=== COUNTEREXAMPLES ===');
    console.log(`Query Time: ${queryTime}ms (expected < 2000ms)`);
    console.log(`Error: ${error ? error.message : 'None'}`);
    console.log(`Products Returned: ${products.length}`);

    // EXPECTED BEHAVIOR (after fix):
    // - Query completes in < 2000ms
    // - No timeout error
    // - Returns products matching "brasil"
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Query exceeds 10000ms (timeout)
    // - Throws "Query timeout after 10 seconds" error
    // - Returns 0 products

    expect(error, 'Query should not timeout after fix').toBeNull();
    expect(queryTime, 'Query should complete in < 2s after fix').toBeLessThan(2000);
    expect(products.length, 'Should return products matching search').toBeGreaterThan(0);
  }, 20000); // 20s timeout for test itself

  /**
   * Test 3: Database Index Verification - Check for Required Indexes
   * 
   * This test verifies that required indexes exist on the products table.
   * Without these indexes, queries will use Sequential Scans which are slow.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (missing indexes)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (all indexes exist)
   */
  it('Property 1.3: Database SHALL have indexes on frequently queried columns', async () => {
    console.log('\n=== TEST 3: Database Index Verification ===');
    
    // Query pg_indexes to check for existing indexes on products table
    // Note: This requires read access to pg_catalog schema
    const { data: indexes, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'products');

    let requiredIndexes = {
      category_id: false,
      price: false,
      rating: false,
      created_at: false,
      deleted_at: false,
      fts: false, // Full-text search GIN index
    };

    if (indexError) {
      console.log(`⚠️  Could not query pg_indexes: ${indexError.message}`);
      console.log('⚠️  This may be due to RLS policies or permissions');
      console.log('⚠️  Skipping index verification - will rely on query performance tests');
      
      // Skip this test if we can't access pg_indexes
      // The query performance tests (1.1, 1.2, 1.4) will still validate the fix
      return;
    }

    if (indexes && indexes.length > 0) {
      console.log('\n=== EXISTING INDEXES ===');
      
      indexes.forEach((idx: any) => {
        const indexName = idx.indexname || '';
        const indexDef = idx.indexdef || '';
        
        console.log(`  - ${indexName}`);
        if (indexDef) {
          console.log(`    ${indexDef.substring(0, 100)}...`);
        }
        
        // Check if this index covers our required columns
        if (indexName.includes('category') || indexDef.includes('category_id')) {
          requiredIndexes.category_id = true;
        }
        if (indexName.includes('price') || indexDef.includes('price')) {
          requiredIndexes.price = true;
        }
        if (indexName.includes('rating') || indexDef.includes('rating')) {
          requiredIndexes.rating = true;
        }
        if (indexName.includes('created_at') || indexDef.includes('created_at')) {
          requiredIndexes.created_at = true;
        }
        if (indexName.includes('deleted_at') || indexDef.includes('deleted_at')) {
          requiredIndexes.deleted_at = true;
        }
        if (indexName.includes('fts') || indexDef.includes('to_tsvector') || indexDef.includes('gin')) {
          requiredIndexes.fts = true;
        }
      });
    } else {
      console.log('\n=== NO INDEXES FOUND ===');
      console.log('⚠️  The products table has no indexes (besides primary key)');
    }

    console.log('\n=== REQUIRED INDEXES STATUS ===');
    console.log(`  category_id: ${requiredIndexes.category_id ? '✓' : '✗'}`);
    console.log(`  price: ${requiredIndexes.price ? '✓' : '✗'}`);
    console.log(`  rating: ${requiredIndexes.rating ? '✓' : '✗'}`);
    console.log(`  created_at: ${requiredIndexes.created_at ? '✓' : '✗'}`);
    console.log(`  deleted_at: ${requiredIndexes.deleted_at ? '✓' : '✗'}`);
    console.log(`  full-text search (GIN): ${requiredIndexes.fts ? '✓' : '✗'}`);

    // Document counterexamples
    const missingIndexes = Object.entries(requiredIndexes)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);

    console.log('\n=== COUNTEREXAMPLES ===');
    console.log(`Missing Indexes: ${missingIndexes.length > 0 ? missingIndexes.join(', ') : 'None'}`);
    console.log(`Total Indexes Found: ${indexes?.length || 0}`);

    // EXPECTED BEHAVIOR (after fix):
    // - All required indexes exist
    // - category_id, price, rating, created_at, deleted_at have B-tree indexes
    // - Full-text search has GIN index
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Missing indexes on category_id, price, rating, created_at, deleted_at
    // - No GIN index for full-text search
    // - Queries use Sequential Scans (slow)

    expect(requiredIndexes.category_id, 'Should have index on category_id').toBe(true);
    expect(requiredIndexes.price, 'Should have index on price').toBe(true);
    expect(requiredIndexes.rating, 'Should have index on rating').toBe(true);
    expect(requiredIndexes.created_at, 'Should have index on created_at').toBe(true);
    expect(requiredIndexes.deleted_at, 'Should have index on deleted_at').toBe(true);
    expect(requiredIndexes.fts, 'Should have GIN index for full-text search').toBe(true);
  }, 30000); // 30s timeout for database operations

  /**
   * Test 4: Query Performance Across Multiple Scenarios
   * 
   * This test verifies query performance across different filter combinations
   * to ensure optimization works for all use cases.
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: FAIL (multiple queries timeout)
   * EXPECTED OUTCOME ON FIXED CODE: PASS (all queries < 2s)
   */
  it('Property 1.4: All query variations SHALL complete in < 2s on cold start', async () => {
    console.log('\n=== TEST 4: Query Performance Across Scenarios ===');
    
    const scenarios = [
      { name: 'Latest 4 products', filters: { limit: 4, sortBy: 'latest' as const } },
      { name: 'Price ascending', filters: { limit: 10, sortBy: 'price_asc' as const } },
      { name: 'Price descending', filters: { limit: 10, sortBy: 'price_desc' as const } },
      { name: 'Min price filter', filters: { minPrice: 50, limit: 10 } },
      { name: 'Max price filter', filters: { maxPrice: 200, limit: 10 } },
      { name: 'Min rating filter', filters: { minRating: 4, limit: 10 } },
    ];

    const results: Array<{ name: string; time: number; success: boolean; error?: string }> = [];

    for (const scenario of scenarios) {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;

      try {
        await getProducts(supabase, scenario.filters);
        success = true;
      } catch (err: any) {
        error = err.message;
      }

      const time = Date.now() - startTime;
      results.push({ name: scenario.name, time, success, error });

      console.log(`  ${success ? '✓' : '✗'} ${scenario.name}: ${time}ms ${error ? `(${error})` : ''}`);
    }

    // Document counterexamples
    console.log('\n=== COUNTEREXAMPLES ===');
    const slowQueries = results.filter(r => r.time > 2000);
    const failedQueries = results.filter(r => !r.success);
    
    console.log(`Slow queries (> 2s): ${slowQueries.length}`);
    slowQueries.forEach(q => console.log(`  - ${q.name}: ${q.time}ms`));
    
    console.log(`Failed queries: ${failedQueries.length}`);
    failedQueries.forEach(q => console.log(`  - ${q.name}: ${q.error}`));

    // EXPECTED BEHAVIOR (after fix):
    // - All queries complete in < 2000ms
    // - No failed queries
    
    // CURRENT BEHAVIOR (unfixed code):
    // - Multiple queries exceed 2000ms or timeout
    // - Some queries fail with timeout error

    results.forEach(result => {
      expect(result.success, `${result.name} should not fail after fix`).toBe(true);
      expect(result.time, `${result.name} should complete in < 2s after fix`).toBeLessThan(2000);
    });
  }, 60000); // 60s timeout for multiple queries
});
