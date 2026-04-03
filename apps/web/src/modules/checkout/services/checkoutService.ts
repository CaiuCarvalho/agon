// Servico Purista (Pure Service Abstractor)
// Não detém nenhum estado global local ou UI context.
import { Cart, AddToCartPayload, CartSchema } from "../contracts";
import { MockBackend } from "../mock";

export const checkoutService = {
  async fetchCartItems(): Promise<Cart> {
    const data = await MockBackend.getCart();
    return CartSchema.parse(data);
  },

  async addToCart(payload: AddToCartPayload): Promise<Cart> {
    const data = await MockBackend.addToCart(payload);
    return CartSchema.parse(data);
  },

  async removeCartItem(productId: string, size: string): Promise<Cart> {
    const data = await MockBackend.removeCartItem(productId, size);
    return CartSchema.parse(data);
  }
};
