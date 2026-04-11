/**
 * useWishlist Hook Tests
 * 
 * Basic smoke tests to verify the hook is properly implemented and exported.
 * Full integration tests with React Query and Supabase Realtime will be added
 * in the testing phase (Task 9).
 */

import { describe, it, expect } from 'vitest';

describe('useWishlist hook', () => {
  it('should be importable from the wishlist hooks module', async () => {
    const { useWishlist } = await import('../useWishlist');
    expect(useWishlist).toBeDefined();
    expect(typeof useWishlist).toBe('function');
  }, 15000);
  
  it('should be importable from the wishlist module root', async () => {
    const { useWishlist } = await import('../../index');
    expect(useWishlist).toBeDefined();
    expect(typeof useWishlist).toBe('function');
  }, 15000);
});

describe('useWishlistMutations hook', () => {
  it('should be importable from the wishlist hooks module', async () => {
    const { useWishlistMutations } = await import('../useWishlistMutations');
    expect(useWishlistMutations).toBeDefined();
    expect(typeof useWishlistMutations).toBe('function');
  }, 15000);
  
  it('should be importable from the wishlist module root', async () => {
    const { useWishlistMutations } = await import('../../index');
    expect(useWishlistMutations).toBeDefined();
    expect(typeof useWishlistMutations).toBe('function');
  }, 15000);
});
