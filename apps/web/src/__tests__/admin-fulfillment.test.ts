import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stable mock refs that survive vi.resetModules()
const { mockCreateAdminClient } = vi.hoisted(() => {
  const mockCreateAdminClient = vi.fn()
  return { mockCreateAdminClient }
})

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mockCreateAdminClient }))
vi.mock('@/lib/env', () => ({
  isConfigurationError: (e: unknown) =>
    e != null && typeof e === 'object' && 'missingVars' in (e as object),
}))

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  chain.catch = (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)
  chain.single = vi.fn().mockResolvedValue(result)
  for (const m of ['select', 'eq', 'is', 'update', 'insert', 'delete', 'order', 'range']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

const baseOrderRow = {
  id: 'order-1',
  user_id: 'user-1',
  status: 'processing',
  total_amount: 299.9,
  shipping_name: 'João',
  shipping_address: 'Rua A, 1',
  shipping_city: 'São Paulo',
  shipping_state: 'SP',
  shipping_zip: '01310-100',
  shipping_phone: '11999990000',
  shipping_email: 'joao@email.com',
  payment_method: 'pix',
  shipping_status: 'processing',
  tracking_code: null,
  carrier: null,
  shipped_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
}

function makeSupabase({
  fetchResult,
  updateResult,
}: {
  fetchResult: { data: unknown; error: unknown }
  updateResult?: { data: unknown; error: unknown }
}) {
  const fetchChain = buildChain(fetchResult)
  const updateChain = buildChain(updateResult ?? { data: null, error: null })

  return {
    from: vi.fn().mockImplementation((_table: string) => ({
      select: vi.fn().mockReturnValue(fetchChain),
      update: vi.fn().mockReturnValue(updateChain),
    })),
  }
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('updateShipping', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  async function callUpdateShipping(orderId: string, input: Record<string, unknown>) {
    const { updateShipping } = await import('@/modules/admin/services/fulfillmentService')
    return updateShipping(orderId, input as any)
  }

  it('returns VALIDATION_ERROR for invalid shippingStatus value', async () => {
    mockCreateAdminClient.mockReturnValue(makeSupabase({ fetchResult: { data: null, error: null } }))
    const result = await callUpdateShipping('order-1', { shippingStatus: 'invalid' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('VALIDATION_ERROR')
  })

  it('returns NOT_FOUND when order does not exist', async () => {
    const supabase = makeSupabase({ fetchResult: { data: null, error: { code: 'PGRST116', message: 'not found' } } })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('missing-order', { shippingStatus: 'processing' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('NOT_FOUND')
  })

  it('returns PAYMENT_NOT_APPROVED when payment is pending and no forceOverride', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'pending', payments: { status: 'pending' } }
    const supabase = makeSupabase({ fetchResult: { data: fetchRow, error: null } })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', { shippingStatus: 'processing' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('PAYMENT_NOT_APPROVED')
  })

  it('allows update when payment is pending but forceOverride is true', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'pending', payments: { status: 'pending' } }
    const updatedRow = { ...baseOrderRow, shipping_status: 'processing' }
    const supabase = makeSupabase({
      fetchResult: { data: fetchRow, error: null },
      updateResult: { data: updatedRow, error: null },
    })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', { shippingStatus: 'processing', forceOverride: true })
    expect(result.success).toBe(true)
  })

  it('returns INVALID_STATUS_PROGRESSION when regressing from shipped to pending', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'shipped', payments: { status: 'approved' } }
    const supabase = makeSupabase({ fetchResult: { data: fetchRow, error: null } })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', { shippingStatus: 'pending' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('INVALID_STATUS_PROGRESSION')
  })

  it('returns INVALID_STATUS_PROGRESSION when regressing from delivered to processing', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'delivered', payments: { status: 'approved' } }
    const supabase = makeSupabase({ fetchResult: { data: fetchRow, error: null } })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', { shippingStatus: 'processing' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('INVALID_STATUS_PROGRESSION')
  })

  it('returns VALIDATION_ERROR when marking as shipped without tracking (caught by schema refine)', async () => {
    mockCreateAdminClient.mockReturnValue(makeSupabase({ fetchResult: { data: null, error: null } }))
    const result = await callUpdateShipping('order-1', { shippingStatus: 'shipped' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('VALIDATION_ERROR')
  })

  it('returns VALIDATION_ERROR when marking as delivered without carrier (caught by schema refine)', async () => {
    mockCreateAdminClient.mockReturnValue(makeSupabase({ fetchResult: { data: null, error: null } }))
    const result = await callUpdateShipping('order-1', { shippingStatus: 'delivered', trackingCode: 'ABC123' })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('VALIDATION_ERROR')
  })

  it('succeeds and returns Order when all business rules pass', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'processing', payments: { status: 'approved' } }
    const updatedRow = { ...baseOrderRow, shipping_status: 'shipped', tracking_code: 'BR123', carrier: 'Correios' }
    const supabase = makeSupabase({
      fetchResult: { data: fetchRow, error: null },
      updateResult: { data: updatedRow, error: null },
    })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', {
      shippingStatus: 'shipped',
      trackingCode: 'BR123',
      carrier: 'Correios',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.shippingStatus).toBe('shipped')
      expect(result.data.trackingCode).toBe('BR123')
      expect(result.data.carrier).toBe('Correios')
    }
  })

  it('returns DATABASE_ERROR when update query fails', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'processing', payments: { status: 'approved' } }
    const supabase = makeSupabase({
      fetchResult: { data: fetchRow, error: null },
      updateResult: { data: null, error: { code: '23505', message: 'db error' } },
    })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', {
      shippingStatus: 'shipped',
      trackingCode: 'BR123',
      carrier: 'Correios',
    })
    expect(result.success).toBe(false)
    expect((result as any).error.code).toBe('DATABASE_ERROR')
  })

  it('same status (no regression) succeeds for processing → processing', async () => {
    const fetchRow = { ...baseOrderRow, shipping_status: 'processing', payments: { status: 'approved' } }
    const updatedRow = { ...baseOrderRow, shipping_status: 'processing' }
    const supabase = makeSupabase({
      fetchResult: { data: fetchRow, error: null },
      updateResult: { data: updatedRow, error: null },
    })
    mockCreateAdminClient.mockReturnValue(supabase)
    const result = await callUpdateShipping('order-1', { shippingStatus: 'processing' })
    expect(result.success).toBe(true)
  })
})
