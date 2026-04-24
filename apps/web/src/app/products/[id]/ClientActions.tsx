"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Heart, Loader2, Minus, Plus } from "lucide-react";
import { useCartMutations } from "@/modules/cart/hooks/useCartMutations";
import { useWishlistMutations } from "@/modules/wishlist/hooks/useWishlistMutations";
import { useWishlist } from "@/modules/wishlist/hooks/useWishlist";
import { useRouter } from "next/navigation";
import { trackViewItem } from "@/lib/analytics";

interface ClientActionsProps {
  productId: string;
  productName: string;
  price: number;
  stock: number;
}

export default function ClientActions({ productId, productName, price, stock }: ClientActionsProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    trackViewItem({ item_id: productId, item_name: productName, price, quantity: 1 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const { addToCart, isAdding } = useCartMutations();
  const { toggleWishlist, isAdding: isTogglingWishlist } = useWishlistMutations();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();

  const favorited = wishlistItems.some(item => item.productId === productId);

  const handleAddToCart = () => {
    addToCart({
      productId,
      quantity,
      size: "Único"
    });
  };

  const handleBuyNow = () => {
    addToCart({
      productId,
      quantity,
      size: "Único"
    });
    router.push('/cart');
  };

  const incrementQuantity = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantidade */}
      <div>
        <label className="block text-sm font-medium mb-2">Quantidade</label>
        <div className="flex items-center gap-4">
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="h-12 w-12 rounded-full border border-border hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-xl font-bold w-12 text-center">{quantity}</span>
          <button
            onClick={incrementQuantity}
            disabled={quantity >= stock}
            className="h-12 w-12 rounded-full border border-border hover:border-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={stock === 0 || isAdding}
          className="flex-1 h-14 bg-primary text-white rounded-full font-bold uppercase tracking-wider hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" />
              {stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
            </>
          )}
        </button>

        <button
          onClick={() => toggleWishlist(productId)}
          disabled={isTogglingWishlist}
          className={`h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all ${
            favorited
              ? "bg-primary border-primary text-white"
              : "border-border hover:border-foreground"
          }`}
        >
          {isTogglingWishlist ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
          )}
        </button>
      </div>

      {stock > 0 && (
        <button
          onClick={handleBuyNow}
          disabled={isAdding}
          className="w-full h-14 bg-foreground text-background rounded-full font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
        >
          Comprar Agora
        </button>
      )}
    </div>
  );
}
