'use client';

import { Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/modules/products/types";

interface HomeProductsSectionProps {
  initialProducts?: Product[];
  error?: string | null;
}

export default function HomeProductsSection({ initialProducts, error }: HomeProductsSectionProps) {
  // If we have initial products from server, display them immediately
  // This eliminates the cold start loading state
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive text-lg">Erro ao carregar produtos</p>
        <p className="text-muted-foreground text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
      {initialProducts.slice(0, 4).map((product) => (
        <ProductCard 
          key={product.id} 
          id={product.id}
          image={product.imageUrl}
          title={product.name}
          price={product.price}
          category={product.categoryId}
        />
      ))}
    </div>
  );
}
