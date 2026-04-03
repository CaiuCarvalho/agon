import { Cart, CartItem, AddToCartPayload } from "./contracts";

// Banco de Dados em Memória Simulado (Server-side Stateful representation)
let mockCartState: Cart = {
  sessionId: "session_mock_12345",
  items: [
    {
      productId: "11111111-1111-1111-1111-111111111111",
      name: "Camisa Brasil Titular 2026",
      price: 350.00,
      quantity: 1,
      size: "M",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    }
  ],
  total: 350.00
};

// Catálogo base para inferência segura de preços (Regra: O frontend manda ID, o mock descobre o preço)
const mockDatabaseCatalog: Record<string, { name: string; price: number; imageUrl: string }> = {
  "11111111-1111-1111-1111-111111111111": { name: "Camisa Brasil Titular 2026", price: 350.0, imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
  "22222222-2222-2222-2222-222222222222": { name: "Agasalho CBF Elite", price: 599.9, imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }
};

export const MOCK_CONFIG = {
  forceNetworkError: false, // Pode ser alterado para simular testes falhos de UI
  networkDelayMs: 600,
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const MockBackend = {
  async getCart(): Promise<Cart> {
    await delay(MOCK_CONFIG.networkDelayMs);
    if (MOCK_CONFIG.forceNetworkError) throw new Error("Network Error 500");
    return JSON.parse(JSON.stringify(mockCartState)); // Deep Copy para impedir referencias diretas JS
  },

  async addToCart(payload: AddToCartPayload): Promise<Cart> {
    await delay(MOCK_CONFIG.networkDelayMs);
    if (MOCK_CONFIG.forceNetworkError) throw new Error("Database Locking Error 500");

    const catalogItem = mockDatabaseCatalog[payload.productId];
    if (!catalogItem) throw new Error("Produto bloqueado ou finalizado de estoque.");

    const existingIndex = mockCartState.items.findIndex(
      i => i.productId === payload.productId && i.size === payload.size
    );

    if (existingIndex > -1) {
      mockCartState.items[existingIndex].quantity += payload.quantity;
    } else {
      mockCartState.items.push({
        ...catalogItem,
        productId: payload.productId,
        quantity: payload.quantity,
        size: payload.size,
      });
    }

    mockCartState.total = mockCartState.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return JSON.parse(JSON.stringify(mockCartState));
  },

  async removeCartItem(productId: string, size: string): Promise<Cart> {
    await delay(MOCK_CONFIG.networkDelayMs);
    if (MOCK_CONFIG.forceNetworkError) throw new Error("Failed to remove item");

    mockCartState.items = mockCartState.items.filter(i => !(i.productId === productId && i.size === size));
    mockCartState.total = mockCartState.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return JSON.parse(JSON.stringify(mockCartState));
  }
};
