import { describe, it, expect } from 'vitest';
import { orderFiltersSchema, shippingUpdateSchema } from './schemas';

describe('orderFiltersSchema - search', () => {
  it('accepts a non-empty search string', () => {
    const result = orderFiltersSchema.safeParse({ search: 'João' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.search).toBe('João');
  });

  it('rejects empty string (after trim)', () => {
    const result = orderFiltersSchema.safeParse({ search: '   ' });
    expect(result.success).toBe(false);
  });

  it('search is optional', () => {
    const result = orderFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.search).toBeUndefined();
  });

  it('rejects search longer than 200 chars', () => {
    const result = orderFiltersSchema.safeParse({ search: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('shippingUpdateSchema - forceOverride', () => {
  it('defaults forceOverride to false', () => {
    const result = shippingUpdateSchema.safeParse({ shippingStatus: 'processing' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.forceOverride).toBe(false);
  });

  it('accepts forceOverride=true', () => {
    const result = shippingUpdateSchema.safeParse({
      shippingStatus: 'processing',
      forceOverride: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.forceOverride).toBe(true);
  });

  it('still requires tracking + carrier when shipped', () => {
    const result = shippingUpdateSchema.safeParse({
      shippingStatus: 'shipped',
      forceOverride: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts shipped with tracking + carrier + override', () => {
    const result = shippingUpdateSchema.safeParse({
      shippingStatus: 'shipped',
      trackingCode: 'BR123',
      carrier: 'Correios',
      forceOverride: true,
    });
    expect(result.success).toBe(true);
  });
});
