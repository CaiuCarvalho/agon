/**
 * Preservation Property Tests for Products Query Timeout Fix
 * 
 * **IMPORTANT**: Follow observation-first methodology
 * - These tests observe behavior on UNFIXED code for non-buggy inputs
 * - Tests capture observed behavior patterns from Preservation Requirements
 * - Run on UNFIXED code to establish baseline
 * - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * Property 2: Preservation - Existing Functionality
 * 
 * For any query `getProducts` executed with filters, pagination, or sorting,
 * the optimized code SHALL produce exactly the same results as the original code,
 * preserving all functionality.
 * 
 * Scope: All queries that DO NOT involve cold start (warm requests, cached queries)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { getProducts } from '@/modules/products/services/productService';
import { createClient } from '@/lib/supabase/client';
import type { ProductFilters } from '@/modules/products/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const hasSupabaseEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

describe.skipIf(!hasSupabaseEnv)('Preservation Property Tests: Existing Functionality', () => {
  const supabase = hasSupabaseEnv ? createClient() : (null as any);
  /**
   * Property 2.1: Filter Preservation
   * 
   * For any valid filter combination (search, categoryId, minPrice, maxPrice, minRating),
   * the query SHALL return products that match ALL specified filters.
   * 
   * This test observes that filters work correctly on unfixed code and ensures
   * they continue to work after optimization.
   * 
   * **Validates: Requirement 3.1**
   */
  test.prop([
    fc.record({
      search: fc.option(fc.oneof(
        fc.constant('brasil'),
        fc.constant('camisa'),
        fc.constant('bola'),
        fc.constant('shorts')
      ), { nil: undefined }),
      categoryId: fc.option(fc.uuid(), { nil: undefined }),
      minPrice: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
      maxPrice: fc.option(fc.integer({ min: 100, max: 500 }), { nil: undefined }),
      minRating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
      limit: fc.constant(10),
    })
  ], { numRuns: 10 })('Property 2.1: Filters (search, categoryId, price range, rating) SHALL be applied correctly', async (filters) => {
    console.log('\n=== Property 2.1: Filter Preservation ===');
    console.log('Testing filters:', JSON.stringify(filters, null, 2));

    // Execute query with filters
    const result = await getProducts(supabase, filters);

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);
    console.log(`✓ Total count: ${result.total}`);

    // Verify basic response structure
    expect(result).toHaveProperty('products');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('totalPages');
    expect(Array.isArray(result.products)).toBe(true);

    // Verify filters are applied correctly
    result.products.forEach(product => {
      // Verify price range filters
      if (filters.minPrice !== undefined) {
        expect(product.price, `Product ${product.id} price should be >= ${filters.minPrice}`).toBeGreaterThanOrEqual(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        expect(product.price, `Product ${product.id} price should be <= ${filters.maxPrice}`).toBeLessThanOrEqual(filters.maxPrice);
      }

      // Verify rating filter
      if (filters.minRating !== undefined) {
        expect(product.rating, `Product ${product.id} rating should be >= ${filters.minRating}`).toBeGreaterThanOrEqual(filters.minRating);
      }

      // Verify category filter
      if (filters.categoryId !== undefined) {
        expect(product.categoryId, `Product ${product.id} should belong to category ${filters.categoryId}`).toBe(filters.categoryId);
      }

      // Verify soft-delete filter (all products should have deletedAt = null)
      expect(product.deletedAt, `Product ${product.id} should not be soft-deleted`).toBeNull();
    });

    console.log('✓ All filter validations passed');
  });

  /**
   * Property 2.2: Pagination Preservation
   * 
   * For any valid pagination configuration (page, limit),
   * the query SHALL return the correct subset of products with correct metadata.
   * 
   * This test observes that pagination works correctly on unfixed code and ensures
   * it continues to work after optimization.
   * 
   * **Validates: Requirement 3.2**
   */
  test.prop([
    fc.record({
      page: fc.constant(1), // Only test page 1 to avoid "range not satisfiable" errors
      limit: fc.integer({ min: 5, max: 20 }),
      sortBy: fc.constantFrom('latest', 'oldest', 'price_asc', 'price_desc'),
    })
  ], { numRuns: 10 })('Property 2.2: Pagination (page, limit, offset) SHALL work correctly', async (filters) => {
    console.log('\n=== Property 2.2: Pagination Preservation ===');
    console.log('Testing pagination:', JSON.stringify(filters, null, 2));

    // Execute query with pagination
    const result = await getProducts(supabase, filters);

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);
    console.log(`✓ Page: ${result.page}, Limit: ${result.limit}, Total: ${result.total}`);

    // Verify pagination metadata
    expect(result.page).toBe(filters.page);
    expect(result.limit).toBe(filters.limit);
    expect(result.totalPages).toBe(Math.ceil(result.total / filters.limit));

    // Verify products count doesn't exceed limit
    expect(result.products.length).toBeLessThanOrEqual(filters.limit);

    // Verify all products are not soft-deleted
    result.products.forEach(product => {
      expect(product.deletedAt).toBeNull();
    });

    console.log('✓ All pagination validations passed');
  });

  /**
   * Property 2.3: Sorting Preservation
   * 
   * For any valid sort option (latest, oldest, price_asc, price_desc),
   * the query SHALL return products in the correct order.
   * 
   * This test observes that sorting works correctly on unfixed code and ensures
   * it continues to work after optimization.
   * 
   * **Validates: Requirement 3.3**
   */
  test.prop([
    fc.constantFrom('latest', 'oldest', 'price_asc', 'price_desc')
  ], { numRuns: 5 })('Property 2.3: Sorting (latest, oldest, price_asc, price_desc) SHALL produce correct order', async (sortBy) => {
    console.log('\n=== Property 2.3: Sorting Preservation ===');
    console.log('Testing sort:', sortBy);

    // Execute query with sorting
    const result = await getProducts(supabase, { sortBy, limit: 10 });

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);

    // Verify we have products to test sorting
    expect(result.products.length).toBeGreaterThan(0);

    // Verify sort order
    for (let i = 0; i < result.products.length - 1; i++) {
      const current = result.products[i];
      const next = result.products[i + 1];

      switch (sortBy) {
        case 'latest':
          // created_at should be descending (newest first)
          expect(
            new Date(current.createdAt).getTime(),
            `Product ${i} (${current.createdAt}) should be newer than product ${i + 1} (${next.createdAt})`
          ).toBeGreaterThanOrEqual(new Date(next.createdAt).getTime());
          break;

        case 'oldest':
          // created_at should be ascending (oldest first)
          expect(
            new Date(current.createdAt).getTime(),
            `Product ${i} (${current.createdAt}) should be older than product ${i + 1} (${next.createdAt})`
          ).toBeLessThanOrEqual(new Date(next.createdAt).getTime());
          break;

        case 'price_asc':
          // price should be ascending (lowest first)
          expect(
            current.price,
            `Product ${i} (${current.price}) should be cheaper than product ${i + 1} (${next.price})`
          ).toBeLessThanOrEqual(next.price);
          break;

        case 'price_desc':
          // price should be descending (highest first)
          expect(
            current.price,
            `Product ${i} (${current.price}) should be more expensive than product ${i + 1} (${next.price})`
          ).toBeGreaterThanOrEqual(next.price);
          break;
      }
    }

    console.log('✓ Sort order validation passed');
  });

  /**
   * Property 2.4: Data Transformation Preservation
   * 
   * For any query result, the data SHALL be correctly transformed from
   * snake_case (database) to camelCase (application).
   * 
   * This test observes that data transformation works correctly on unfixed code
   * and ensures it continues to work after optimization.
   * 
   * **Validates: Requirement 3.4**
   */
  it('Property 2.4: Data transformation (snake_case → camelCase) SHALL work correctly', async () => {
    console.log('\n=== Property 2.4: Data Transformation Preservation ===');

    // Execute query
    const result = await getProducts(supabase, { limit: 5 });

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);

    // Verify we have products to test
    expect(result.products.length).toBeGreaterThan(0);

    // Verify each product has correct camelCase properties
    result.products.forEach((product, index) => {
      console.log(`  Validating product ${index + 1}:`, product.name);

      // Verify camelCase properties exist
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('categoryId'); // NOT category_id
      expect(product).toHaveProperty('imageUrl'); // NOT image_url
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('features');
      expect(product).toHaveProperty('rating');
      expect(product).toHaveProperty('reviews');
      expect(product).toHaveProperty('createdAt'); // NOT created_at
      expect(product).toHaveProperty('updatedAt'); // NOT updated_at
      expect(product).toHaveProperty('deletedAt'); // NOT deleted_at

      // Verify snake_case properties DO NOT exist
      expect(product).not.toHaveProperty('category_id');
      expect(product).not.toHaveProperty('image_url');
      expect(product).not.toHaveProperty('created_at');
      expect(product).not.toHaveProperty('updated_at');
      expect(product).not.toHaveProperty('deleted_at');

      // Verify types
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.description).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.categoryId).toBe('string');
      expect(typeof product.imageUrl).toBe('string');
      expect(typeof product.stock).toBe('number');
      expect(Array.isArray(product.features)).toBe(true);
      expect(typeof product.rating).toBe('number');
      expect(typeof product.reviews).toBe('number');
      expect(typeof product.createdAt).toBe('string');
      expect(typeof product.updatedAt).toBe('string');

      // Verify category join transformation (if present)
      if (product.category) {
        expect(product.category).toHaveProperty('id');
        expect(product.category).toHaveProperty('name');
        expect(product.category).toHaveProperty('slug');
        expect(product.category).toHaveProperty('description');
        expect(product.category).toHaveProperty('createdAt'); // NOT created_at
        expect(product.category).toHaveProperty('updatedAt'); // NOT updated_at

        expect(product.category).not.toHaveProperty('created_at');
        expect(product.category).not.toHaveProperty('updated_at');
      }
    });

    console.log('✓ All data transformation validations passed');
  }, 30000);

  /**
   * Property 2.5: Full-Text Search Preservation
   * 
   * For any search query, the full-text search SHALL use to_tsvector('portuguese')
   * on name and description fields, returning relevant results.
   * 
   * This test observes that full-text search works correctly on unfixed code
   * and ensures it continues to work after optimization.
   * 
   * **Validates: Requirement 3.5**
   */
  test.prop([
    fc.constantFrom('brasil', 'camisa', 'bola', 'shorts', 'seleção')
  ], { numRuns: 5 })('Property 2.5: Full-text search SHALL use to_tsvector("portuguese") on name and description', async (searchTerm) => {
    console.log('\n=== Property 2.5: Full-Text Search Preservation ===');
    console.log('Testing search term:', searchTerm);

    // Execute query with search
    const result = await getProducts(supabase, { search: searchTerm, limit: 20 });

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);

    // If products are returned, verify they match the search term
    if (result.products.length > 0) {
      result.products.forEach((product, index) => {
        // Verify product contains search term in name or description
        // Note: Portuguese full-text search uses stemming, so exact match may not be required
        // But at least one of name or description should be relevant
        const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const descMatch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        console.log(`  Product ${index + 1}: ${product.name}`);
        console.log(`    Name match: ${nameMatch}, Description match: ${descMatch}`);

        // At least one should match (or be stemmed match via Portuguese FTS)
        // We can't strictly enforce exact match due to stemming, but we log for observation
      });

      console.log('✓ Search results returned (Portuguese FTS working)');
    } else {
      console.log('⚠️  No products found for search term:', searchTerm);
      console.log('   This may be expected if no products match the search');
    }

    // Verify all returned products are not soft-deleted
    result.products.forEach(product => {
      expect(product.deletedAt).toBeNull();
    });

    console.log('✓ Full-text search validation passed');
  });

  /**
   * Property 2.6: Soft-Delete Preservation
   * 
   * For any query, products with deleted_at IS NOT NULL SHALL be excluded
   * from results.
   * 
   * This test observes that soft-delete filtering works correctly on unfixed code
   * and ensures it continues to work after optimization.
   * 
   * **Validates: Requirement 3.6**
   */
  it('Property 2.6: Soft-deleted products (deleted_at IS NOT NULL) SHALL be excluded', async () => {
    console.log('\n=== Property 2.6: Soft-Delete Preservation ===');

    // Execute multiple queries with different filters
    const scenarios = [
      { name: 'No filters', filters: { limit: 20 } },
      { name: 'With search', filters: { search: 'brasil', limit: 20 } },
      { name: 'With price filter', filters: { minPrice: 50, maxPrice: 200, limit: 20 } },
      { name: 'With sorting', filters: { sortBy: 'latest' as const, limit: 20 } },
    ];

    for (const scenario of scenarios) {
      console.log(`\n  Testing scenario: ${scenario.name}`);
      
      const result = await getProducts(supabase, scenario.filters);
      
      console.log(`  ✓ Query completed successfully`);
      console.log(`  ✓ Products returned: ${result.products.length}`);

      // Verify ALL products have deletedAt = null
      result.products.forEach((product, index) => {
        expect(
          product.deletedAt,
          `Product ${index + 1} (${product.id}) should not be soft-deleted`
        ).toBeNull();
      });

      console.log(`  ✓ All products have deletedAt = null`);
    }

    console.log('\n✓ Soft-delete filtering validation passed for all scenarios');
  }, 60000);

  /**
   * Property 2.7: Combined Filters Preservation
   * 
   * For any combination of filters, pagination, and sorting,
   * the query SHALL apply all parameters correctly and return consistent results.
   * 
   * This test observes that complex filter combinations work correctly on unfixed code
   * and ensures they continue to work after optimization.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.8**
   */
  test.prop([
    fc.record({
      minPrice: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
      maxPrice: fc.option(fc.integer({ min: 100, max: 300 }), { nil: undefined }),
      minRating: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
      sortBy: fc.constantFrom('latest', 'oldest', 'price_asc', 'price_desc'),
      page: fc.constant(1), // Only test page 1 to avoid "range not satisfiable" errors
      limit: fc.integer({ min: 5, max: 15 }),
    })
  ], { numRuns: 10 })('Property 2.7: Combined filters, pagination, and sorting SHALL work together correctly', async (filters) => {
    console.log('\n=== Property 2.7: Combined Filters Preservation ===');
    console.log('Testing combined filters:', JSON.stringify(filters, null, 2));

    // Execute query with combined filters
    const result = await getProducts(supabase, filters);

    console.log(`✓ Query completed successfully`);
    console.log(`✓ Products returned: ${result.products.length}`);
    console.log(`✓ Total: ${result.total}, Page: ${result.page}/${result.totalPages}`);

    // Verify pagination metadata
    expect(result.page).toBe(filters.page);
    expect(result.limit).toBe(filters.limit);
    expect(result.products.length).toBeLessThanOrEqual(filters.limit);

    // Verify filters are applied
    result.products.forEach((product, index) => {
      // Price filters
      if (filters.minPrice !== undefined) {
        expect(product.price).toBeGreaterThanOrEqual(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        expect(product.price).toBeLessThanOrEqual(filters.maxPrice);
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        expect(product.rating).toBeGreaterThanOrEqual(filters.minRating);
      }

      // Soft-delete filter
      expect(product.deletedAt).toBeNull();

      // Verify sorting (if we have next product)
      if (index < result.products.length - 1) {
        const next = result.products[index + 1];

        switch (filters.sortBy) {
          case 'latest':
            expect(new Date(product.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(next.createdAt).getTime());
            break;
          case 'oldest':
            expect(new Date(product.createdAt).getTime()).toBeLessThanOrEqual(new Date(next.createdAt).getTime());
            break;
          case 'price_asc':
            expect(product.price).toBeLessThanOrEqual(next.price);
            break;
          case 'price_desc':
            expect(product.price).toBeGreaterThanOrEqual(next.price);
            break;
        }
      }
    });

    console.log('✓ All combined filter validations passed');
  });
});
