import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stable mock references via vi.hoisted so they're available inside vi.mock factories
const { mockAbortSignal, mockSelect, mockFrom, mockCreateClient } = vi.hoisted(() => {
  const mockAbortSignal = vi.fn().mockResolvedValue({ error: null })
  const mockSelect = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockCreateClient = vi.fn(() => Promise.resolve({ from: mockFrom }))
  return { mockAbortSignal, mockSelect, mockFrom, mockCreateClient }
})

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))

import { GET } from '@/app/api/health/route'

describe('/api/health GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ abortSignal: mockAbortSignal })
    mockAbortSignal.mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({ from: mockFrom })
  })

  describe('happy path — database healthy', () => {
    it('returns HTTP 200', async () => {
      const res = await GET()
      expect(res.status).toBe(200)
    })

    it('returns status: ok', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.status).toBe('ok')
    })

    it('returns database.status ok with numeric latencyMs', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.database.status).toBe('ok')
      expect(data.database.latencyMs).toBeTypeOf('number')
      expect(data.database.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('returns memory with heapUsedMb and heapTotalMb', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.memory.heapUsedMb).toBeTypeOf('number')
      expect(data.memory.heapTotalMb).toBeTypeOf('number')
      expect(data.memory.heapUsedMb).toBeGreaterThan(0)
    })

    it('returns uptime as a non-negative integer', async () => {
      const res = await GET()
      const data = await res.json()
      expect(Number.isInteger(data.uptime)).toBe(true)
      expect(data.uptime).toBeGreaterThanOrEqual(0)
    })

    it('returns timestamp as a valid ISO 8601 string', async () => {
      const before = Date.now()
      const res = await GET()
      const after = Date.now()
      const data = await res.json()
      const ts = new Date(data.timestamp).getTime()
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })
  })

  describe('degraded — database returns error', () => {
    beforeEach(() => {
      mockAbortSignal.mockResolvedValue({ error: { message: 'connection refused' } })
    })

    it('returns HTTP 503', async () => {
      const res = await GET()
      expect(res.status).toBe(503)
    })

    it('returns status: degraded', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.status).toBe('degraded')
    })

    it('reports database.status error with latencyMs', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.database.status).toBe('error')
      expect(data.database.latencyMs).toBeTypeOf('number')
    })

    it('still includes memory and uptime in degraded response', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.memory).toBeDefined()
      expect(data.uptime).toBeDefined()
    })
  })

  describe('down — createClient throws', () => {
    beforeEach(() => {
      mockCreateClient.mockRejectedValueOnce(new Error('could not connect'))
    })

    it('returns HTTP 503', async () => {
      const res = await GET()
      expect(res.status).toBe(503)
    })

    it('returns status: down', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.status).toBe('down')
    })

    it('includes error message in database field', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.database.error).toContain('could not connect')
    })

    it('still includes memory and uptime', async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.memory.heapUsedMb).toBeTypeOf('number')
      expect(data.uptime).toBeTypeOf('number')
    })
  })
})
