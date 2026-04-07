/**
 * useCartMutations Hook Tests
 * 
 * Basic smoke tests to verify the hook is properly implemented and exported.
 * Full integration tests with React Query and optimistic updates will be added
 * in the testing phase (Task 9).
 */

import { describe, it, expect } from 'vitest';

describe('useCartMutations hook', () => {
  it('should be importable from the cart module', async () => {
    const { useCartMutations } = await import('../useCartMutations');
    expect(useCartMutations).toBeDefined();
    expect(typeof useCartMutations).toBe('function');
  });
  
  it('should be importable from the hooks index', async () => {
    const { useCartMutations } = await import('../index');
    expect(useCartMutations).toBeDefined();
    expect(typeof useCartMutations).toBe('function');
  });
  
  it('should be importable from the cart module root', async () => {
    const { useCartMutations } = await import('../../index');
    expect(useCartMutations).toBeDefined();
    expect(typeof useCartMutations).toBe('function');
  });
});
