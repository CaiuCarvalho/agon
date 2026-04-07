import ProductCard from "@/components/ProductCard";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Produtos | Agon",
  description: "Camisas oficiais de times e seleções",
};

async function getProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  return data || [];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-24 pb-40 px-4 md:px-8">
      <div className="mb-16">
        <h1 className="font-display text-5xl md:text-7xl mb-4 text-foreground uppercase tracking-tighter">
          Produtos <span className="text-primary">Agon</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-body font-medium max-w-2xl">
          Camisas oficiais de times e seleções
        </p>
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-2xl bg-secondary/50">
          <p className="text-lg text-muted-foreground font-body font-medium uppercase tracking-widest">
            Nenhum produto disponível
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              title={product.name}
              price={parseFloat(product.price)}
              image={product.image_url}
              category="Manto Oficial"
              stock={product.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
