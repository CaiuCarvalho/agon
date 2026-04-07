import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClientActions from "./ClientActions";

async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-24 px-4 md:px-8">
      <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Imagem */}
        <div className="aspect-square bg-secondary/20 rounded-2xl overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-primary font-bold uppercase tracking-wider mb-2">
              Manto Oficial
            </p>
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight mb-4">
              {product.name}
            </h1>
            <p className="text-2xl font-bold">
              R$ {parseFloat(product.price).toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="border-t border-b border-border py-6">
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Características:</h3>
              <ul className="space-y-2">
                {product.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span className="font-bold">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} avaliações)</span>
            </div>
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Apenas {product.stock} unidades restantes
              </p>
            </div>
          )}

          <ClientActions 
            productId={product.id}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}
