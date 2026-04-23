import { describe, it, expect, vi } from 'vitest'
import {
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  getDeletedProducts,
} from '@/modules/products/services/productService'

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildChain(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {}
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  chain.catch = (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)
  chain.single = vi.fn().mockResolvedValue(result)
  for (const m of ['select', 'eq', 'is', 'not', 'update', 'insert', 'order', 'range', 'gte', 'lte', 'textSearch']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  return chain
}

const PROD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const CAT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

const baseProductRow = {
  id: PROD_ID,
  name: 'Camisa Brasil',
  description: 'Oficial',
  price: '149.90',
  category_id: CAT_ID,
  image_url: 'https://cdn.example.com/img.jpg',
  stock: 10,
  features: ['Dry-fit'],
  rating: '4.5',
  reviews: 30,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-01T00:00:00Z',
  deleted_at: null,
  category: {
    id: CAT_ID,
    name: 'Camisas',
    slug: 'camisas',
    description: null,
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2022-06-01T00:00:00Z',
  },
}

function makeSupabase(chainResult: { data: unknown; error: unknown; count?: number }) {
  const chain = buildChain(chainResult)
  return {
    from: vi.fn().mockReturnValue(chain),
  } as unknown as Parameters<typeof getProductById>[0]
}

// ─── getProductById ───────────────────────────────────────────────────────────

describe('getProductById', () => {
  it('returns null when PGRST116 (not found)', async () => {
    const supabase = makeSupabase({ data: null, error: { code: 'PGRST116', message: 'not found' } })
    const result = await getProductById(supabase, 'missing')
    expect(result).toBeNull()
  })

  it('throws on other database errors', async () => {
    const supabase = makeSupabase({ data: null, error: { code: '23505', message: 'db error' } })
    await expect(getProductById(supabase, 'prod-1')).rejects.toThrow('Failed to fetch product: db error')
  })

  it('returns transformed Product on success', async () => {
    const supabase = makeSupabase({ data: baseProductRow, error: null })
    const product = await getProductById(supabase, 'prod-1')
    expect(product).not.toBeNull()
    expect(product!.id).toBe(PROD_ID)
    expect(product!.name).toBe('Camisa Brasil')
    expect(product!.price).toBe(149.9)
    expect(product!.rating).toBe(4.5)
    expect(product!.categoryId).toBe(CAT_ID)
    expect(product!.imageUrl).toBe('https://cdn.example.com/img.jpg')
  })

  it('includes nested category when present', async () => {
    const supabase = makeSupabase({ data: baseProductRow, error: null })
    const product = await getProductById(supabase, 'prod-1')
    expect(product!.category).toBeDefined()
    expect(product!.category!.name).toBe('Camisas')
    expect(product!.category!.slug).toBe('camisas')
  })

  it('omits category when absent', async () => {
    const row = { ...baseProductRow, category: undefined }
    const supabase = makeSupabase({ data: row, error: null })
    const product = await getProductById(supabase, 'prod-1')
    expect(product!.category).toBeUndefined()
  })
})

// ─── createProduct ────────────────────────────────────────────────────────────

describe('createProduct', () => {
  const validValues = {
    name: 'Camisa Nova',
    description: 'Descrição válida',
    price: 99.9,
    categoryId: CAT_ID,
    imageUrl: 'https://cdn.example.com/img.jpg',
    stock: 5,
    features: ['feature-a'],
  }

  it('returns created Product on success', async () => {
    const created = { ...baseProductRow, name: 'Camisa Nova', price: '99.90' }
    const supabase = makeSupabase({ data: created, error: null })
    const result = await createProduct(supabase, validValues)
    expect(result.name).toBe('Camisa Nova')
    expect(result.price).toBe(99.9)
  })

  it('throws when database returns an error', async () => {
    const supabase = makeSupabase({ data: null, error: { code: '23502', message: 'not-null violation' } })
    await expect(createProduct(supabase, validValues)).rejects.toThrow('Failed to create product')
  })

  it('throws Zod error for invalid price (negative)', async () => {
    const supabase = makeSupabase({ data: null, error: null })
    await expect(createProduct(supabase, { ...validValues, price: -1 })).rejects.toThrow()
  })

  it('throws Zod error for empty name', async () => {
    const supabase = makeSupabase({ data: null, error: null })
    await expect(createProduct(supabase, { ...validValues, name: '' })).rejects.toThrow()
  })
})

// ─── updateProduct ────────────────────────────────────────────────────────────

describe('updateProduct', () => {
  it('returns updated Product on success', async () => {
    const updated = { ...baseProductRow, name: 'Camisa Atualizada', price: '199.00' }
    const supabase = makeSupabase({ data: updated, error: null })
    const result = await updateProduct(supabase, 'prod-1', { name: 'Camisa Atualizada', price: 199 })
    expect(result.name).toBe('Camisa Atualizada')
    expect(result.price).toBe(199)
  })

  it('throws concurrency error on PGRST116 (optimistic lock conflict)', async () => {
    const supabase = makeSupabase({ data: null, error: { code: 'PGRST116', message: 'not found' } })
    await expect(updateProduct(supabase, 'prod-1', { name: 'x' }, '2023-01-01')).rejects.toThrow(
      'Product was modified by another user'
    )
  })

  it('throws generic error on other db errors', async () => {
    const supabase = makeSupabase({ data: null, error: { code: '23505', message: 'unique violation' } })
    await expect(updateProduct(supabase, 'prod-1', { name: 'x' })).rejects.toThrow('Failed to update product')
  })
})

// ─── softDeleteProduct ────────────────────────────────────────────────────────

describe('softDeleteProduct', () => {
  it('resolves without throwing on success', async () => {
    const supabase = makeSupabase({ data: null, error: null })
    await expect(softDeleteProduct(supabase, 'prod-1')).resolves.toBeUndefined()
  })

  it('throws on database error', async () => {
    const supabase = makeSupabase({ data: null, error: { message: 'db error' } })
    await expect(softDeleteProduct(supabase, 'prod-1')).rejects.toThrow('Failed to delete product')
  })
})

// ─── restoreProduct ───────────────────────────────────────────────────────────

describe('restoreProduct', () => {
  it('returns restored Product on success', async () => {
    const supabase = makeSupabase({ data: { ...baseProductRow, deleted_at: null }, error: null })
    const result = await restoreProduct(supabase, 'prod-1')
    expect(result.deletedAt).toBeNull()
  })

  it('throws on database error', async () => {
    const supabase = makeSupabase({ data: null, error: { message: 'restore failed' } })
    await expect(restoreProduct(supabase, 'prod-1')).rejects.toThrow('Failed to restore product')
  })
})

// ─── getDeletedProducts ───────────────────────────────────────────────────────

describe('getDeletedProducts', () => {
  it('returns array of deleted products', async () => {
    const deletedRow = { ...baseProductRow, deleted_at: '2024-01-01T00:00:00Z' }
    const supabase = makeSupabase({ data: [deletedRow], error: null })
    const result = await getDeletedProducts(supabase)
    expect(result).toHaveLength(1)
    expect(result[0].deletedAt).toBe('2024-01-01T00:00:00Z')
  })

  it('returns empty array when no deleted products', async () => {
    const supabase = makeSupabase({ data: [], error: null })
    const result = await getDeletedProducts(supabase)
    expect(result).toEqual([])
  })

  it('throws on database error', async () => {
    const supabase = makeSupabase({ data: null, error: { message: 'query failed' } })
    await expect(getDeletedProducts(supabase)).rejects.toThrow('Failed to fetch deleted products')
  })
})
