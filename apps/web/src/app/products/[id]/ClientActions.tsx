"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/modules/checkout/hooks/useCart";
import { ShoppingBag, ShieldCheck, Truck, Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/context/WishlistContext";
import { motion } from "framer-motion";
import { trackProductView, trackEvent } from "@/lib/analytics";

interface ClientActionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    stock: number;
  }
}

export default function ClientActions({ product }: ClientActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useWishlist();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  const favorited = isFavorite(product.id);

  // GA4: view_item — dispara uma vez quando a página do produto é carregada
  useEffect(() => {
    trackProductView({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const sizes = ["P", "M", "G", "GG", "EGG"];

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Por favor, selecione um tamanho.");
      return;
    }
    
    addToCart(
      { productId: product.id, quantity: 1, size: selectedSize },
      { productId: product.id, name: product.name, price: product.price, quantity: 1, size: selectedSize, imageUrl: product.imageUrl || "" }
    ).catch(() => {});

    // GA4: add_to_cart
    trackEvent("add_to_cart", {
      currency: "BRL",
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: 1 }],
    });
    
    toast.success(`${product.name} adicionado ao carrinho!`);
  };
  
  const handleToggleFavorite = async () => {
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      await toggleFavorite({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.imageUrl || "",
        category: "Manto Oficial",
        description: "",
        features: [],
        rating: 5,
        reviews: 0
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="font-display tracking-widest uppercase text-sm">Selecione o Tamanho</span>
          <span className="text-muted-foreground text-xs uppercase underline cursor-pointer hover:text-foreground">Guia de Tamanhos</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`h-12 border ${
                selectedSize === size
                  ? "border-primary text-primary"
                  : "border-border hover:border-foreground/50 text-foreground"
              } bg-background font-body font-medium transition-colors`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full h-16 ${product.stock === 0 ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary/90"} text-primary-foreground font-display text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]`}
        >
          <ShoppingBag className="w-5 h-5" />
          {product.stock === 0 ? "Produto Esgotado" : "Adicionar ao Carrinho"}
        </button>
        
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest text-center mt-2 animate-pulse">
            🔥 Corra! Apenas {product.stock} unidades restantes.
          </p>
        )}
        
        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className={`w-full h-16 border border-border bg-background font-display text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:border-foreground/50 ${favorited ? "text-primary border-primary" : "text-foreground"}`}
        >
          <motion.div animate={favorited ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart className={`w-5 h-5 ${favorited ? "fill-current" : ""}`} />
          </motion.div>
          {favorited ? "Na sua Wishlist" : "Favoritar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 border-t border-border pt-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h4 className="font-display uppercase tracking-wider text-sm">Garantia Agon</h4>
            <p className="font-body text-xs text-muted-foreground mt-1">Produto 100% autêntico com garantia contra defeitos.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Truck className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h4 className="font-display uppercase tracking-wider text-sm">Frete Premium</h4>
            <p className="font-body text-xs text-muted-foreground mt-1">Entregas expressas em embalagens exclusivas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
