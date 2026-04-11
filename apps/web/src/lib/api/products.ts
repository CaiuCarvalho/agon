import { buildApiUrl } from "@/lib/url";

export async function fetchProducts() {
  const response = await fetch(buildApiUrl("/products"), {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  
  return response.json();
}

export async function fetchProductById(id: string) {
  const response = await fetch(buildApiUrl(`/products/${id}`), {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  
  return response.json();
}
