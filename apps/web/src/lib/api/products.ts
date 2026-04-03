const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";

export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`, {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  
  return response.json();
}

export async function fetchProductById(id: string) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  
  return response.json();
}
