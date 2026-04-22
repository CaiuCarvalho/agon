import { describe, it, expect } from 'vitest'
import { transformCartItemRow } from '@/modules/cart/utils/transformers'

const baseRow = {
  id: 'item-1',
  user_id: 'user-abc',
  product_id: 'prod-xyz',
  quantity: 2,
  size: 'M',
  price_snapshot: '149.90',
  product_name_snapshot: 'Camisa Brasil 2022',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  product: null,
}

describe('transformCartItemRow', () => {
  describe('field mapping (snake_case → camelCase)', () => {
    it('maps id directly', () => {
      expect(transformCartItemRow(baseRow).id).toBe('item-1')
    })

    it('maps user_id → userId', () => {
      expect(transformCartItemRow(baseRow).userId).toBe('user-abc')
    })

    it('maps product_id → productId', () => {
      expect(transformCartItemRow(baseRow).productId).toBe('prod-xyz')
    })

    it('maps price_snapshot as float', () => {
      expect(transformCartItemRow(baseRow).priceSnapshot).toBe(149.90)
    })

    it('maps product_name_snapshot → productNameSnapshot', () => {
      expect(transformCartItemRow(baseRow).productNameSnapshot).toBe('Camisa Brasil 2022')
    })

    it('maps created_at → createdAt', () => {
      expect(transformCartItemRow(baseRow).createdAt).toBe('2024-01-01T00:00:00Z')
    })

    it('maps updated_at → updatedAt', () => {
      expect(transformCartItemRow(baseRow).updatedAt).toBe('2024-01-02T00:00:00Z')
    })

    it('preserves quantity', () => {
      expect(transformCartItemRow(baseRow).quantity).toBe(2)
    })

    it('preserves size', () => {
      expect(transformCartItemRow(baseRow).size).toBe('M')
    })
  })

  describe('price parsing', () => {
    it('parses string price to float', () => {
      expect(transformCartItemRow({ ...baseRow, price_snapshot: '99.99' }).priceSnapshot).toBe(99.99)
    })

    it('parses integer string price', () => {
      expect(transformCartItemRow({ ...baseRow, price_snapshot: '200' }).priceSnapshot).toBe(200)
    })
  })

  describe('nested product', () => {
    it('returns undefined when product is null', () => {
      expect(transformCartItemRow(baseRow).product).toBeUndefined()
    })

    it('maps nested product fields when present', () => {
      const row = {
        ...baseRow,
        product: {
          id: 'prod-1',
          name: 'Camisa',
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
      const result = transformCartItemRow(row)
      expect(result.product).toBeDefined()
      expect(result.product!.id).toBe('prod-1')
      expect(result.product!.name).toBe('Camisa')
      expect(result.product!.price).toBe(149.90)
      expect(result.product!.rating).toBe(4.5)
      expect(result.product!.categoryId).toBe('cat-1')
      expect(result.product!.imageUrl).toBe('https://cdn.example.com/img.jpg')
    })

    it('defaults features to [] when absent', () => {
      const row = { ...baseRow, product: { id: 'p', name: 'n', description: 'd', price: '10', category_id: 'c', image_url: '', stock: 0, features: null, rating: '0', reviews: 0, created_at: '', updated_at: '', deleted_at: null } }
      expect(transformCartItemRow(row).product!.features).toEqual([])
    })

    it('defaults reviews to 0 when absent', () => {
      const row = { ...baseRow, product: { id: 'p', name: 'n', description: 'd', price: '10', category_id: 'c', image_url: '', stock: 0, features: [], rating: '0', reviews: null, created_at: '', updated_at: '', deleted_at: null } }
      expect(transformCartItemRow(row).product!.reviews).toBe(0)
    })

    it('parses rating string to float', () => {
      const row = { ...baseRow, product: { id: 'p', name: 'n', description: 'd', price: '10', category_id: 'c', image_url: '', stock: 0, features: [], rating: '4.7', reviews: 5, created_at: '', updated_at: '', deleted_at: null } }
      expect(transformCartItemRow(row).product!.rating).toBe(4.7)
    })

    it('defaults rating to 0 when null', () => {
      const row = { ...baseRow, product: { id: 'p', name: 'n', description: 'd', price: '10', category_id: 'c', image_url: '', stock: 0, features: [], rating: null, reviews: 0, created_at: '', updated_at: '', deleted_at: null } }
      expect(transformCartItemRow(row).product!.rating).toBe(0)
    })
  })
})
