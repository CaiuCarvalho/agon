"use client";

import { useWishlist } from "@/modules/wishlist/hooks/useWishlist";
import { useWishlistMutations } from "@/modules/wishlist/hooks/useWishlistMutations";
import { Heart, Loader2, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedGrid from "@/components/products/AnimatedGrid";

export default function WishlistPage() {
  const { items, isLoading } = useWishlist();
  const { removeFromWishlist, isRemoving } = useWishlistMutations();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  // Empty wishlist state
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Heart className="h-24 w-24 mx-auto mb-6 text-muted-foreground/30" />
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight mb-4">
            Sua lista de favoritos está vazia
          </h1>
          <p className="text-muted-foreground mb-8">
            Adicione produtos aos favoritos para salvá-los para depois
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-none font-display text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            Ver Produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight mb-2">
            Favoritos
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {items.length}/20 itens
            </p>
            {items.length >= 18 && (
              <p className="text-sm text-orange-600">
                {items.length === 20 ? "Limite atingido" : `Restam ${20 - items.length} vagas`}
              </p>
            )}
          </div>
        </div>

        {/* Wishlist Grid */}
        <AnimatedGrid>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex flex-col bg-background"
            >
              {/* Product Image */}
              <div className="relative w-full aspect-[1/1] overflow-hidden bg-muted rounded-2xl mb-5">
                <Link
                  href={`/products/${item.productId}`}
                  className="block h-full w-full"
                >
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name || "Produto"}
                      fill
                      className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  disabled={isRemoving}
                  className="absolute right-4 top-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-destructive hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Remover dos favoritos"
                >
                  <Trash2 className="h-5 w-5" />
                </button>

                {/* Stock Badge */}
                {item.product?.stock === 0 && (
                  <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="px-6 py-2 border-2 border-white text-white font-display text-sm uppercase tracking-[0.3em] font-black">
                      Esgotado
                    </span>
                  </div>
                )}

                {item.product && item.product.stock > 0 && item.product.stock <= 5 && (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-orange-500 px-3 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white animate-pulse">
                    Últimas Unidades
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col gap-1">
                {item.product?.categoryId && (
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                    {item.product.categoryId}
                  </p>
                )}

                <Link
                  href={`/products/${item.productId}`}
                  className="hover:opacity-70 transition-opacity"
                >
                  <h3 className="font-display text-lg md:text-xl text-foreground uppercase tracking-tight leading-none truncate">
                    {item.product?.name || "Produto"}
                  </h3>
                </Link>

                <div className="flex items-center justify-between mt-1">
                  {item.product?.price && (
                    <p className="font-body text-sm font-bold text-foreground">
                      R$ {item.product.price.toFixed(2).replace(".", ",")}
                    </p>
                  )}
                  {item.product?.stock !== undefined && (
                    <span className={`text-[10px] uppercase font-medium ${
                      item.product.stock === 0 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {item.product.stock === 0 ? "Esgotado" : `${item.product.stock} em estoque`}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatedGrid>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border border-border py-3 px-8 font-display text-sm uppercase tracking-widest hover:bg-muted transition-colors"
          >
            Continuar Comprando
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
