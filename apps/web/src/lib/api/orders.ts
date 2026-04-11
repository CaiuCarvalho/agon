import { buildApiUrl } from "@/lib/url";

export async function createOrder(cartItems: unknown[]) {
  const response = await fetch(buildApiUrl("/payments/create"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Adicionar Authorization header se houver auth
    },
    body: JSON.stringify({ items: cartItems }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to create order");
  }
  
  return response.json();
}
