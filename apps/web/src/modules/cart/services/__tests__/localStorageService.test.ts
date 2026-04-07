/**
 * localStorage Service Unit Tests
 * 
 * Tests localStorage operations, schema validation, and multi-tab sync
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localStorageService } from '../localStorageService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('localStorageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Cart Operations', () => {
    describe('getCart', () => {
      it('should return empty cart when localStorage is empty', () => {
        const cart = localStorageService.getCart();
        
        expect(cart).toEqual({
          items: [],
          version: 1,
        });
      });

      it('should return cart from localStorage', () => {
        const mockCart = {
          items: [
            { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2, size: 'M' },
          ],
          version: 1,
        };
        
        localStorage.setItem('agon_cart', JSON.stringify(mockCart));
        
        const cart = localStorageService.getCart();
        expect(cart).toEqual(mockCart);
      });

      it('should return empty cart on invalid JSON', () => {
        localStorage.setItem('agon_cart', 'invalid-json');
        
        const cart = localStorageService.getCart();
        expect(cart).toEqual({
          items: [],
          version: 1,
        });
      });

      it('should return empty cart on schema validation failure', () => {
        const invalidCart = {
          items: [
            { productId: 'invalid-uuid', quantity: 2, size: 'M' },
          ],
          version: 1,
        };
        
        localStorage.setItem('agon_cart', JSON.stringify(invalidCart));
        
        const cart = localStorageService.getCart();
        expect(cart).toEqual({
          items: [],
          version: 1,
        });
      });
    });

    describe('saveCart', () => {
      it('should save cart to localStorage', () => {
        const cart = {
          items: [
            { productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2, size: 'M' },
          ],
          version: 1,
        };
        
        localStorageService.saveCart(cart);
        
        const saved = localStorage.getItem('agon_cart');
        expect(JSON.parse(saved!)).toEqual(cart);
      });

      it('should validate cart before saving', () => {
        const invalidCart: any = {
          items: [
            { productId: 'invalid-uuid', quantity: 2, size: 'M' },
          ],
          version: 1,
        };
        
        // Should not throw, but should log error
        localStorageService.saveCart(invalidCart);
        
        // localStorage should not be updated
        const saved = localStorage.getItem('agon_cart');
        expect(saved).toBeNull();
      });
    });

    describe('addToCart', () => {
      it('should add new item to cart', () => {
        const cart = localStorageService.addToCart(
          '550e8400-e29b-41d4-a716-446655440000',
          2,
          'M'
        );
        
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0]).toEqual({
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 2,
          size: 'M',
        });
      });

      it('should sum quantities for existing item (same productId and size)', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        const cart = localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 3, 'M');
        
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(5);
      });

      it('should cap quantity at 99', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 95, 'M');
        const cart = localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 10, 'M');
        
        expect(cart.items[0].quantity).toBe(99);
      });

      it('should treat different sizes as separate items', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        const cart = localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 3, 'L');
        
        expect(cart.items).toHaveLength(2);
      });
    });

    describe('updateCartItem', () => {
      it('should update item quantity', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        const cart = localStorageService.updateCartItem(
          '550e8400-e29b-41d4-a716-446655440000',
          'M',
          { quantity: 5 }
        );
        
        expect(cart.items[0].quantity).toBe(5);
      });

      it('should update item size', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        const cart = localStorageService.updateCartItem(
          '550e8400-e29b-41d4-a716-446655440000',
          'M',
          { size: 'L' }
        );
        
        expect(cart.items[0].size).toBe('L');
      });

      it('should do nothing if item not found', () => {
        const cart = localStorageService.updateCartItem(
          '550e8400-e29b-41d4-a716-446655440000',
          'M',
          { quantity: 5 }
        );
        
        expect(cart.items).toHaveLength(0);
      });
    });

    describe('removeFromCart', () => {
      it('should remove item from cart', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        const cart = localStorageService.removeFromCart('550e8400-e29b-41d4-a716-446655440000', 'M');
        
        expect(cart.items).toHaveLength(0);
      });

      it('should only remove matching productId and size', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 3, 'L');
        const cart = localStorageService.removeFromCart('550e8400-e29b-41d4-a716-446655440000', 'M');
        
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].size).toBe('L');
      });
    });

    describe('clearCart', () => {
      it('should remove cart from localStorage', () => {
        localStorageService.addToCart('550e8400-e29b-41d4-a716-446655440000', 2, 'M');
        localStorageService.clearCart();
        
        const saved = localStorage.getItem('agon_cart');
        expect(saved).toBeNull();
      });
    });
  });

  describe('Wishlist Operations', () => {
    describe('getWishlist', () => {
      it('should return empty wishlist when localStorage is empty', () => {
        const wishlist = localStorageService.getWishlist();
        
        expect(wishlist).toEqual({
          items: [],
          version: 1,
        });
      });

      it('should return wishlist from localStorage', () => {
        const mockWishlist = {
          items: [
            { productId: '550e8400-e29b-41d4-a716-446655440000' },
          ],
          version: 1,
        };
        
        localStorage.setItem('agon_wishlist', JSON.stringify(mockWishlist));
        
        const wishlist = localStorageService.getWishlist();
        expect(wishlist).toEqual(mockWishlist);
      });
    });

    describe('addToWishlist', () => {
      it('should add product to wishlist', () => {
        const wishlist = localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        
        expect(wishlist.items).toHaveLength(1);
        expect(wishlist.items[0].productId).toBe('550e8400-e29b-41d4-a716-446655440000');
      });

      it('should not add duplicate products', () => {
        localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        const wishlist = localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        
        expect(wishlist.items).toHaveLength(1);
      });

      it('should enforce 20-item limit', () => {
        // Add 20 items with valid UUIDs
        const baseUUIDs = [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
          '550e8400-e29b-41d4-a716-446655440005',
          '550e8400-e29b-41d4-a716-446655440006',
          '550e8400-e29b-41d4-a716-446655440007',
          '550e8400-e29b-41d4-a716-446655440008',
          '550e8400-e29b-41d4-a716-446655440009',
          '550e8400-e29b-41d4-a716-44665544000a',
          '550e8400-e29b-41d4-a716-44665544000b',
          '550e8400-e29b-41d4-a716-44665544000c',
          '550e8400-e29b-41d4-a716-44665544000d',
          '550e8400-e29b-41d4-a716-44665544000e',
          '550e8400-e29b-41d4-a716-44665544000f',
          '550e8400-e29b-41d4-a716-446655440010',
          '550e8400-e29b-41d4-a716-446655440011',
          '550e8400-e29b-41d4-a716-446655440012',
          '550e8400-e29b-41d4-a716-446655440013',
        ];
        
        for (const uuid of baseUUIDs) {
          localStorageService.addToWishlist(uuid);
        }
        
        // Try to add 21st item
        expect(() => {
          localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440099');
        }).toThrow('Limite de 20 itens na wishlist atingido');
      });
    });

    describe('removeFromWishlist', () => {
      it('should remove product from wishlist', () => {
        localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        const wishlist = localStorageService.removeFromWishlist('550e8400-e29b-41d4-a716-446655440000');
        
        expect(wishlist.items).toHaveLength(0);
      });
    });

    describe('isInWishlist', () => {
      it('should return true if product is in wishlist', () => {
        localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        
        const result = localStorageService.isInWishlist('550e8400-e29b-41d4-a716-446655440000');
        expect(result).toBe(true);
      });

      it('should return false if product is not in wishlist', () => {
        const result = localStorageService.isInWishlist('550e8400-e29b-41d4-a716-446655440000');
        expect(result).toBe(false);
      });
    });

    describe('clearWishlist', () => {
      it('should remove wishlist from localStorage', () => {
        localStorageService.addToWishlist('550e8400-e29b-41d4-a716-446655440000');
        localStorageService.clearWishlist();
        
        const saved = localStorage.getItem('agon_wishlist');
        expect(saved).toBeNull();
      });
    });
  });
});
