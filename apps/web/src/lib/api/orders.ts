const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";

export async function createOrder(cartItems: unknown[]) {
  const response = await fetch(`${API_URL}/payments/create`, {
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
