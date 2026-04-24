import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stable mock refs
const { mockCreateClient, mockWithRetry } = vi.hoisted(() => {
  const mockCreateClient = vi.fn()
  // withRetry just calls its callback immediately for tests
  const mockWithRetry = vi.fn().mockImplementation((fn: () => unknown) => fn())
  return { mockCreateClient, mockWithRetry }
})

vi.mock('@/lib/supabase/client', () => ({ createClient: mockCreateClient }))
vi.mock('@/modules/cart/services/cartService', () => ({
  cartService: { withRetry: mockWithRetry },
}))

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  chain.catch = (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)
  chain.single = vi.fn().mockResolvedValue(result)
  for (const m of ['select', 'eq', 'is', 'order', 'insert', 'delete']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

const PROD_UUID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'

const baseWishlistRow = {
  id: 'wl-1',
  user_id: 'user-abc',
  product_id: PROD_UUID,
  created_at: '2024-01-01T00:00:00Z',
  product: {
    id: PROD_UUID,
    name: 'Camisa Brasil',
    description: 'Oficial',
    price: '149.90',
    category_id: 'cat-1',
    image_url: 'https://cdn.example.com/img.jpg',
    stock: 10,
    features: ['Dry-fit'],
    rating: '4.5',
    reviews: 30,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-06-01T00:00:00Z',
    deleted_at: null,
  },
}

function makeSupabase(selectResult: { data: unknown; error: unknown }, singleResult?: { data: unknown; error: unknown }) {
  const chain = buildChain(selectResult)
  if (singleResult) {
    ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue(singleResult)
  }
  return { from: vi.fn().mockReturnValue(chain) }
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('wishlistService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Restore withRetry default behaviour
    mockWithRetry.mockImplementation((fn: () => unknown) => fn())
  })

  async function getService() {
    const { wishlistService } = await import('@/modules/wishlist/services/wishlistService')
    return wishlistService
  }

  // ─── getWishlistItems ────────────────────────────────────────────────────

  describe('getWishlistItems', () => {
    it('returns array of WishlistItem on success', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: [baseWishlistRow], error: null }))
      const service = await getService()
      const result = await service.getWishlistItems('user-abc')
      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user-abc')
      expect(result[0].productId).toBe(PROD_UUID)
    })

    it('returns empty array when no items', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: [], error: null }))
      const service = await getService()
      const result = await service.getWishlistItems('user-abc')
      expect(result).toEqual([])
    })

    it('includes nested product data', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: [baseWishlistRow], error: null }))
      const service = await getService()
      const result = await service.getWishlistItems('user-abc')
      expect(result[0].product).toBeDefined()
      expect(result[0].product!.name).toBe('Camisa Brasil')
      expect(result[0].product!.price).toBe(149.9)
    })

    it('throws when database returns error', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: { code: 'PGRST301', message: 'connection error' } }))
      const service = await getService()
      await expect(service.getWishlistItems('user-abc')).rejects.toBeDefined()
    })
  })

  // ─── addToWishlist ───────────────────────────────────────────────────────

  describe('addToWishlist', () => {
    it('returns WishlistItem on successful insert', async () => {
      const chain = buildChain({ data: null, error: null })
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: baseWishlistRow, error: null })
      mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
      const service = await getService()
      const result = await service.addToWishlist('user-abc', { productId: PROD_UUID })
      expect(result.productId).toBe(PROD_UUID)
    })

    it('throws Zod error for empty productId', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: null }))
      const service = await getService()
      await expect(service.addToWishlist('user-abc', { productId: '' })).rejects.toThrow()
    })

    it('returns existing item on unique constraint violation (23505)', async () => {
      let callCount = 0
      mockWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => {
        callCount++
        if (callCount === 1) {
          // First call: insert — returns unique violation
          return { data: null, error: { code: '23505', message: 'duplicate' } }
        }
        // Second call: select existing
        return { data: baseWishlistRow, error: null }
      })
      mockCreateClient.mockReturnValue({ from: vi.fn() })
      const service = await getService()
      const result = await service.addToWishlist('user-abc', { productId: PROD_UUID })
      expect(result.productId).toBe(PROD_UUID)
    })

    it('throws limit error when trigger message includes "20 itens"', async () => {
      mockWithRetry.mockImplementation(async () => ({
        data: null,
        error: { code: '23514', message: 'Limite de 20 itens' },
      }))
      mockCreateClient.mockReturnValue({ from: vi.fn() })
      const service = await getService()
      await expect(service.addToWishlist('user-abc', { productId: PROD_UUID })).rejects.toThrow('20 itens')
    })
  })

  // ─── removeFromWishlist ──────────────────────────────────────────────────

  describe('removeFromWishlist', () => {
    it('resolves without throwing on success', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: null }))
      const service = await getService()
      await expect(service.removeFromWishlist('user-abc', 'wl-1')).resolves.toBeUndefined()
    })

    it('throws when database returns error', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: { message: 'delete failed' } }))
      const service = await getService()
      await expect(service.removeFromWishlist('user-abc', 'wl-1')).rejects.toBeDefined()
    })
  })

  // ─── isInWishlist ────────────────────────────────────────────────────────

  describe('isInWishlist', () => {
    it('returns true when product is in wishlist', async () => {
      const chain = buildChain({ data: null, error: null })
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 'wl-1' }, error: null })
      mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
      const service = await getService()
      const result = await service.isInWishlist('user-abc', PROD_UUID)
      expect(result).toBe(true)
    })

    it('returns false when product is not in wishlist (PGRST116)', async () => {
      const chain = buildChain({ data: null, error: null })
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      })
      mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
      const service = await getService()
      const result = await service.isInWishlist('user-abc', PROD_UUID)
      expect(result).toBe(false)
    })

    it('throws on non-PGRST116 errors', async () => {
      const chain = buildChain({ data: null, error: null })
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'connection error' },
      })
      mockCreateClient.mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
      const service = await getService()
      await expect(service.isInWishlist('user-abc', PROD_UUID)).rejects.toBeDefined()
    })
  })

  // ─── clearWishlist ───────────────────────────────────────────────────────

  describe('clearWishlist', () => {
    it('resolves without throwing on success', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: null }))
      const service = await getService()
      await expect(service.clearWishlist('user-abc')).resolves.toBeUndefined()
    })

    it('throws when database returns error', async () => {
      mockCreateClient.mockReturnValue(makeSupabase({ data: null, error: { message: 'clear failed' } }))
      const service = await getService()
      await expect(service.clearWishlist('user-abc')).rejects.toBeDefined()
    })
  })
})
