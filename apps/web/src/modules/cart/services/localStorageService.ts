/**
 * localStorage Service for Cart and Wishlist
 * 
 * Manages cart and wishlist data in browser localStorage for guest users.
 * Provides multi-tab synchronization using Broadcast Channel API.
 * All operations include schema validation and error handling.
 * 
 * @module localStorageService
 */

import {
  localStorageCartSchema,
  localStorageWishlistSchema,
  type LocalStorageCartData,
  type LocalStorageWishlistData,
} from '../contracts';

const CART_STORAGE_KEY = 'agon_cart';
const WISHLIST_STORAGE_KEY = 'agon_wishlist';
const CURRENT_VERSION = 1;

// Broadcast channels for multi-tab sync
const cartChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('agon_cart_sync')
  : null;
const wishlistChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('agon_wishlist_sync')
  : null;

export const localStorageService = {
  /**
   * Initialize listeners for multi-tab synchronization
   * Sets up Broadcast Channel listeners to sync changes across browser tabs
   */
  init(
    onCartChange: (cart: LocalStorageCartData) => void,
    onWishlistChange: (wishlist: LocalStorageWishlistData) => void
  ): void {
    if (cartChannel) {
      cartChannel.onmessage = (event) => {
        if (event.data.type === 'cart_updated') {
          onCartChange(event.data.cart);
        }
      };
    }
    
    if (wishlistChannel) {
      wishlistChannel.onmessage = (event) => {
        if (event.data.type === 'wishlist_updated') {
          onWishlistChange(event.data.wishlist);
        }
      };
    }
  },
  
  /**
   * Broadcast cart changes to other tabs
   */
  broadcastCartChange(cart: LocalStorageCartData): void {
    if (cartChannel) {
      cartChannel.postMessage({ type: 'cart_updated', cart });
    }
  },
  
  /**
   * Broadcast wishlist changes to other tabs
   */
  broadcastWishlistChange(wishlist: LocalStorageWishlistData): void {
    if (wishlistChannel) {
      wishlistChannel.postMessage({ type: 'wishlist_updated', wishlist });
    }
  },
  
  // ==================== Cart Operations ====================
  
  /**
   * Get cart from localStorage with schema validation
   * Returns empty cart if not found or validation fails
   */
  getCart(): LocalStorageCartData {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return { items: [], version: CURRENT_VERSION };
      
      const parsed = JSON.parse(raw);
      const validated = localStorageCartSchema.parse(parsed);
      return validated;
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      return { items: [], version: CURRENT_VERSION };
    }
  },
  
  /**
   * Save cart to localStorage with schema validation and broadcasting
   */
  saveCart(cart: LocalStorageCartData): void {
    try {
      const validated = localStorageCartSchema.parse(cart);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validated));
      this.broadcastCartChange(validated);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  },
  
  /**
   * Add item to cart with quantity summing (max 99)
   * If item exists (same productId and size), quantities are summed
   */
  addToCart(productId: string, quantity: number, size: string): LocalStorageCartData {
    const cart = this.getCart();
    
    // Find existing item
    const existingIndex = cart.items.findIndex(
      item => item.productId === productId && item.size === size
    );
    
    if (existingIndex >= 0) {
      // Update quantity (max 99)
      cart.items[existingIndex].quantity = Math.min(
        cart.items[existingIndex].quantity + quantity,
        99
      );
    } else {
      // Add new item
      cart.items.push({ productId, quantity, size });
    }
    
    this.saveCart(cart);
    return cart;
  },
  
  /**
   * Update cart item quantity or size
   */
  updateCartItem(
    productId: string,
    size: string,
    updates: { quantity?: number; size?: string }
  ): LocalStorageCartData {
    const cart = this.getCart();
    
    const itemIndex = cart.items.findIndex(
      item => item.productId === productId && item.size === size
    );
    
    if (itemIndex >= 0) {
      if (updates.quantity !== undefined) {
        cart.items[itemIndex].quantity = updates.quantity;
      }
      if (updates.size !== undefined) {
        cart.items[itemIndex].size = updates.size;
      }
    }
    
    this.saveCart(cart);
    return cart;
  },
  
  /**
   * Remove item from cart by productId and size
   */
  removeFromCart(productId: string, size: string): LocalStorageCartData {
    const cart = this.getCart();
    
    cart.items = cart.items.filter(
      item => !(item.productId === productId && item.size === size)
    );
    
    this.saveCart(cart);
    return cart;
  },
  
  /**
   * Clear entire cart from localStorage
   */
  clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
    this.broadcastCartChange({ items: [], version: CURRENT_VERSION });
  },
  
  // ==================== Wishlist Operations ====================
  
  /**
   * Get wishlist from localStorage with schema validation
   * Returns empty wishlist if not found or validation fails
   */
  getWishlist(): LocalStorageWishlistData {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return { items: [], version: CURRENT_VERSION };
      
      const parsed = JSON.parse(raw);
      const validated = localStorageWishlistSchema.parse(parsed);
      return validated;
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage:', error);
      return { items: [], version: CURRENT_VERSION };
    }
  },
  
  /**
   * Save wishlist to localStorage with schema validation and broadcasting
   */
  saveWishlist(wishlist: LocalStorageWishlistData): void {
    try {
      const validated = localStorageWishlistSchema.parse(wishlist);
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(validated));
      this.broadcastWishlistChange(validated);
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  },
  
  /**
   * Add product to wishlist with 20-item limit check
   * Throws error if limit is reached
   */
  addToWishlist(productId: string): LocalStorageWishlistData {
    const wishlist = this.getWishlist();
    
    // Check 20-item limit
    if (wishlist.items.length >= 20) {
      throw new Error('Limite de 20 itens na wishlist atingido');
    }
    
    // Check if already exists
    const exists = wishlist.items.some(item => item.productId === productId);
    
    if (!exists) {
      wishlist.items.push({ productId });
    }
    
    this.saveWishlist(wishlist);
    return wishlist;
  },
  
  /**
   * Remove product from wishlist by productId
   */
  removeFromWishlist(productId: string): LocalStorageWishlistData {
    const wishlist = this.getWishlist();
    
    wishlist.items = wishlist.items.filter(item => item.productId !== productId);
    
    this.saveWishlist(wishlist);
    return wishlist;
  },
  
  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId: string): boolean {
    const wishlist = this.getWishlist();
    return wishlist.items.some(item => item.productId === productId);
  },
  
  /**
   * Clear entire wishlist from localStorage
   */
  clearWishlist(): void {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    this.broadcastWishlistChange({ items: [], version: CURRENT_VERSION });
  },
};
