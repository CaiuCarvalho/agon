import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase SSR so no real network calls happen.
// getSession resolves to null session → middleware falls through to returning supabaseResponse.
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(),
  })),
}))

import { middleware } from '@/middleware'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const originalEnv = process.env

// /checkout is in the middleware matcher but is NOT admin/perfil, so with null session
// the middleware returns supabaseResponse (with x-request-id) rather than a redirect.
function makeRequest(path = '/checkout', headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost${path}`, { headers })
}

describe('middleware — x-request-id propagation', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJtest',
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('sets x-request-id in the response when none is provided', async () => {
    const res = await middleware(makeRequest())
    const id = res.headers.get('x-request-id')
    expect(id).not.toBeNull()
    expect(id).toMatch(UUID_REGEX)
  })

  it('preserves an existing x-request-id from the incoming request', async () => {
    const existingId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const res = await middleware(makeRequest('/checkout', { 'x-request-id': existingId }))
    expect(res.headers.get('x-request-id')).toBe(existingId)
  })

  it('generates a different ID for each request with no incoming header', async () => {
    const [res1, res2] = await Promise.all([
      middleware(makeRequest()),
      middleware(makeRequest()),
    ])
    const id1 = res1.headers.get('x-request-id')
    const id2 = res2.headers.get('x-request-id')
    expect(id1).not.toBe(id2)
  })

  it('generated x-request-id is a valid UUID v4', async () => {
    const res = await middleware(makeRequest())
    const id = res.headers.get('x-request-id')!
    expect(id).toMatch(UUID_REGEX)
    // UUID v4 has '4' in the 15th character (version nibble)
    expect(id[14]).toBe('4')
  })

  it('propagates existing x-request-id even for /pedido routes', async () => {
    const existingId = '12345678-1234-4234-9234-123456789012'
    const res = await middleware(makeRequest('/pedido/order-99', { 'x-request-id': existingId }))
    expect(res.headers.get('x-request-id')).toBe(existingId)
  })
})
