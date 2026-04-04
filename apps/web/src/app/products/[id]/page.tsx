import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star } from "lucide-react";
import ClientActions from "./ClientActions";
import { createClient } from "@/lib/supabase/server";

/**
 * Product Detail Page - Server Component
 * 
 * Fetches product data server-side using Supabase
 * Returns 404 if product not found or soft-deleted
 * Displays complete product information with SEO metadata
 * 
 * Validates Requirements: 11.1-11.12, 18.4, 18.5, 19.3, 19.4, 19.5, 19.6
 */

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  stock: number;
  features: string[];
  rating: number;
  reviews: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[ProductDetail][Fetch]', error);
    return null;
  }

  return data as Product;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  
  if (!product) {
    return { 
      title: "Produto não encontrado | Agon",
      description: "O produto que você está procurando não foi encontrado."
    };
  }
  
  // Truncate description to 160 characters for meta description
  const truncatedDescription = product.description.length > 160 
    ? product.description.substring(0, 157) + '...'
    : product.description;
  
  return {
    title: `${product.name} | Agon`,
    description: truncatedDescription,
    openGraph: {
      title: `${product.name} | Agon`,
      description: truncatedDescription,
      images: [product.image_url],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  // Return 404 if product not found or soft-deleted
  if (!product || product.deleted_at !== null) {
    notFound();
  }

  const imageUrl = product.image_url || "https://res.cloudinary.com/dcbysq0ea/image/upload/v1740620614/x1ry6ngpqusw0ezywpxx.webp";
  
  // Stock status badges
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Product schema markup (JSON-LD) for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image_url,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "BRL",
      "availability": isOutOfStock 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock"
    },
    "aggregateRating": product.reviews > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews
    } : undefined
  };

  return (
    <>
      {/* JSON-LD Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <div className="container mx-auto py-12 pb-40 px-4 md:px-8">
        {/* Back to Products Link */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-display uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para o Arsenal
        </Link>
        
        {/* Product Layout: Image (left) + Info (right) on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Product Image Section */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary/20">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              
              {/* Stock Badges */}
              {isOutOfStock && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-display text-sm uppercase tracking-wider">
                  Esgotado
                </div>
              )}
              {isLowStock && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg font-display text-sm uppercase tracking-wider">
                  Apenas {product.stock} restantes
                </div>
              )}
            </div>
          </div>
          
          {/* Product Info Section */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Category Name */}
            <p className="text-primary font-display uppercase tracking-[0.3em] font-black text-xs mb-4">
              {product.category?.name || "Premium Collection"}
            </p>
            
            {/* Product Name */}
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-balance leading-none">
              {product.name}
            </h1>
            
            {/* Rating and Reviews */}
            {product.reviews > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.reviews} {product.reviews === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
            
            {/* Price */}
            <p className="text-3xl font-body font-bold text-foreground mb-8 text-balance">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </p>
            
            {/* Stock Status */}
            <div className="mb-6">
              {isOutOfStock ? (
                <p className="text-red-500 font-display text-sm uppercase tracking-wider">
                  Produto Esgotado
                </p>
              ) : isLowStock ? (
                <p className="text-orange-500 font-display text-sm uppercase tracking-wider">
                  🔥 Apenas {product.stock} unidades restantes
                </p>
              ) : (
                <p className="text-green-600 font-display text-sm uppercase tracking-wider">
                  Em Estoque
                </p>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-10 text-muted-foreground font-body leading-relaxed whitespace-pre-line text-balance">
              {product.description}
            </div>
            
            {/* Features List */}
            {product.features && product.features.length > 0 && (
              <div className="mb-10">
                <h3 className="font-display uppercase tracking-wider text-sm mb-4">
                  Características
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Client Actions (Add to Cart, Wishlist) */}
            <ClientActions 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.image_url,
                stock: product.stock
              }} 
            />
          </div>
        </div>
      </div>
    </>
  );
}
