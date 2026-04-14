"use client";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCartMutations } from "@/modules/cart/hooks/useCartMutations";
import { useWishlistMutations } from "@/modules/wishlist/hooks/useWishlistMutations";
import { useWishlist } from "@/modules/wishlist/hooks/useWishlist";

interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  price: number;
  badge?: string;
  category?: string;
  stock?: number;
}

const ProductCard = ({ id = "1", image, title, price, badge, category = "Manto Oficial", stock }: ProductCardProps) => {
  const { addToCart, isAdding } = useCartMutations();
  const { toggleWishlist, isAdding: isTogglingWishlist } = useWishlistMutations();
  const { items: wishlistItems } = useWishlist();
  
  // Check if product is in wishlist
  const favorited = wishlistItems.some(item => item.productId === id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add to cart with default size "Único"
    addToCart({
      productId: id,
      quantity: 1,
      size: "Único"
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle wishlist (add if not present, remove if present)
    toggleWishlist(id);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group relative flex flex-col bg-background"
    >
      {/* Imagem Premium */}
      <div className="relative w-full aspect-[1/1] overflow-hidden bg-[#f6f6f6] rounded-2xl mb-5">
        {badge && (
          <span className="absolute left-4 top-4 z-10 rounded-sm bg-primary px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
            {badge}
          </span>
        )}

        {stock === 0 && (
          <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="px-6 py-2 border-2 border-white text-white font-display text-sm uppercase tracking-[0.3em] font-black">
              Esgotado
            </span>
          </div>
        )}

        {stock !== undefined && stock > 0 && stock <= 5 && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-orange-500 px-3 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white animate-pulse">
            Últimas Unidades
          </span>
        )}
        
        <button 
          onClick={handleToggleFavorite}
          disabled={isTogglingWishlist}
          className={`absolute right-4 top-4 z-10 h-8 w-8 flex items-center justify-center rounded-full backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-110 active:scale-90 ${
            favorited 
              ? "bg-primary text-white scale-110 opacity-100" 
              : "bg-white/80 text-foreground opacity-0 group-hover:opacity-100 hover:bg-white"
          } ${isTogglingWishlist ? "animate-pulse" : ""}`}
        >
          {isTogglingWishlist ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <motion.div
              animate={favorited ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
            </motion.div>
          )}
        </button>

        <Link
          href={`/products/${id}`}
          className="block h-full w-full"
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
          />
        </Link>

        {/* Quick Add Button (Nike Style) */}
        <button 
          onClick={handleAddToCart}
          disabled={stock === 0 || isAdding}
          className={`absolute bottom-0 left-0 right-0 h-12 ${stock === 0 ? 'bg-muted cursor-not-allowed' : 'bg-primary'} text-white font-display text-sm uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex items-center justify-center gap-2`}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adicionando...
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {stock === 0 ? "Indisponível" : "Adicionar Rápido"}
            </>
          )}
        </button>
      </div>

      {/* Info do Produto */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
          {category}
        </p>
        
        <Link href={`/products/${id}`} className="hover:opacity-70 transition-opacity">
          <h3 className="font-display text-lg md:text-xl text-foreground uppercase tracking-tight leading-none truncate">
            {title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-1">
          <p className="font-body text-sm font-bold text-foreground">
            R$ {price.toFixed(2).replace(".", ",")}
          </p>
          <span className="text-[10px] text-muted-foreground uppercase font-medium">
            1 Cor
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
