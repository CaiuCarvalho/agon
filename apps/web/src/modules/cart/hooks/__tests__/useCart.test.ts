/**
 * useCart Hook Tests
 * 
 * Basic smoke tests to verify the hook is properly implemented and exported.
 * Full integration tests with React Query and Supabase Realtime will be added
 * in the testing phase (Task 9).
 */

import { describe, it, expect } from 'vitest';

describe('useCart hook', () => {
  it('should be importable from the cart module', async () => {
    const { useCart } = await import('../useCart');
    expect(useCart).toBeDefined();
    expect(typeof useCart).toBe('function');
  });
  
  it('should be importable from the hooks index', async () => {
    const { useCart } = await import('../index');
    expect(useCart).toBeDefined();
    expect(typeof useCart).toBe('function');
  });
  
  it('should be importable from the cart module root', async () => {
    const { useCart } = await import('../../index');
    expect(useCart).toBeDefined();
    expect(typeof useCart).toBe('function');
  });
});

describe('useMigrationStatus hook', () => {
  it('should be importable from the cart module', async () => {
    const { useMigrationStatus } = await import('../useMigrationStatus');
    expect(useMigrationStatus).toBeDefined();
    expect(typeof useMigrationStatus).toBe('function');
  });
  
  it('should be importable from the hooks index', async () => {
    const { useMigrationStatus } = await import('../index');
    expect(useMigrationStatus).toBeDefined();
    expect(typeof useMigrationStatus).toBe('function');
  });
  
  it('should be importable from the cart module root', async () => {
    const { useMigrationStatus } = await import('../../index');
    expect(useMigrationStatus).toBeDefined();
    expect(typeof useMigrationStatus).toBe('function');
  });
});
