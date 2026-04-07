"use client";

import { useCart } from "@/modules/cart/hooks/useCart";
import { useCartMutations } from "@/modules/cart/hooks/useCartMutations";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function CartPage() {
  const { items, totalItems, subtotal, isLoading } = useCart();
  const { updateQuantityDebounced, removeFromCart, isRemoving } = useCartMutations();

  // Show loading state during migration or initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground/30" />
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-muted-foreground mb-8">
            Adicione produtos ao carrinho para continuar comprando
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
            Carrinho
          </h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"} no carrinho
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-background border border-border p-4 md:p-6 flex flex-col md:flex-row gap-4"
              >
                {/* Product Image */}
                <div className="relative w-full md:w-32 h-32 bg-muted flex-shrink-0">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name || item.productNameSnapshot}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-tight mb-1">
                      {item.product?.name || item.productNameSnapshot}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Tamanho: {item.size}
                    </p>
                    
                    {/* Price change warning */}
                    {item.product && item.product.price !== item.priceSnapshot && (
                      <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 text-xs rounded mb-2">
                        ⚠️ Preço atualizado: R$ {item.priceSnapshot.toFixed(2).replace(".", ",")} → R$ {item.product.price.toFixed(2).replace(".", ",")}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantityDebounced(
                              { productId: item.productId, size: item.size },
                              item.quantity - 1
                            );
                          }
                        }}
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => {
                          if (item.quantity < 99) {
                            updateQuantityDebounced(
                              { productId: item.productId, size: item.size },
                              item.quantity + 1
                            );
                          }
                        }}
                        disabled={item.quantity >= 99}
                        className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R$ {((item.product?.price || item.priceSnapshot) * item.quantity).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {(item.product?.price || item.priceSnapshot).toFixed(2).replace(".", ",")} cada
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  disabled={isRemoving}
                  className="self-start md:self-center p-2 hover:bg-destructive/10 hover:text-destructive transition-colors rounded disabled:opacity-50"
                  title="Remover do carrinho"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted p-6 sticky top-4">
              <h2 className="font-display text-xl uppercase tracking-tight mb-6">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-medium">Calculado no checkout</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-display uppercase tracking-tight">Total</span>
                  <span className="font-display text-xl">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-primary text-white py-4 px-6 font-display text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                Finalizar Compra
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/products"
                className="w-full border border-border py-3 px-6 font-display text-sm uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
