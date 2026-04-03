import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ClientActions from "./ClientActions";

async function getProduct(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://agonimports.com/api";
  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "Produto não encontrado | Agon" };
  
  return {
    title: `${product.name} | Agon`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  if (!product) {
    notFound();
  }

  const imageUrl = product.imageUrl || "https://res.cloudinary.com/dcbysq0ea/image/upload/v1740620614/x1ry6ngpqusw0ezywpxx.webp";

  return (
    <div className="container mx-auto py-12 pb-40 px-4 md:px-8">
      <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-display uppercase tracking-widest mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Voltar para o Arsenal
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Gallery Section */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary/20">
             <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
        
        {/* Info Section */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <p className="text-primary font-display uppercase tracking-[0.3em] font-black text-xs mb-4">
            {product.category?.name || "Premium Collection"}
          </p>
          
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-balance leading-none">
            {product.name}
          </h1>
          
          <p className="text-3xl font-body font-bold text-foreground mb-8 text-balance">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </p>
          
          <div className="mb-10 text-muted-foreground font-body leading-relaxed whitespace-pre-line text-balance">
            {product.description}
          </div>
          
          <ClientActions product={{
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.stock
          }} />
        </div>
      </div>
    </div>
  );
}
