import ProductCard from "@/components/ProductCard";
import SearchFilters from "@/components/products/SearchFilters";
import AnimatedGrid from "@/components/products/AnimatedGrid";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Arsenal | Agon",
  description: "A coleção de elite de itens da Seleção Brasileira.",
};

async function getProducts(searchParams: Record<string, string | string[] | undefined>) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });
  try {
    const res = await fetch(`${baseUrl}/api/products?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return { products: [] };
    const json = await res.json();
    return json.data || { products: [] };
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return { products: [] };
  }
}

async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";
  try {
    const res = await fetch(`${baseUrl}/api/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.categories || [];
  } catch (err) {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [data, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories()
  ]);
  const products = (data.products || []) as { id: string; name: string; price: number; imageUrl?: string; category?: { name: string }; stock: number }[];

  return (
    <div className="container mx-auto py-24 pb-40 px-4 md:px-8">
      <div className="mb-16">
        <h1 className="font-display text-5xl md:text-7xl mb-4 text-foreground uppercase tracking-tighter">
          O Arsenal <span className="text-primary">Agon</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-body font-medium max-w-2xl text-balance mb-12">
          Explore a linha exclusiva de equipamentos projetados para elite da performance. A armadura oficial da paixão nacional.
        </p>

        <Suspense fallback={<div className="h-16 animate-pulse bg-card/10 rounded-full" />}>
          <SearchFilters categories={categories} />
        </Suspense>
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-2xl bg-secondary/50">
          <p className="text-lg text-muted-foreground font-body font-medium uppercase tracking-widest">Estoque Indisponível</p>
        </div>
      ) : (
        <AnimatedGrid>
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard 
                id={product.id}
                title={product.name}
                price={product.price}
                image={product.imageUrl || "https://res.cloudinary.com/dcbysq0ea/image/upload/v1740620614/x1ry6ngpqusw0ezywpxx.webp"}
                category={product.category?.name || "Premium"}
                stock={product.stock}
              />
            </div>
          ))}
        </AnimatedGrid>
      )}
    </div>
  );
}
