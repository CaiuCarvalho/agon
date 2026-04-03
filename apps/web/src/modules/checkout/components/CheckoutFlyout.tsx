"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../hooks/useCart";
import { CartItemCard } from "./CartItemCard";
import { toast } from "sonner";
import { ShoppingBag, X } from "lucide-react";

// A Reatividade Front End Interativa de Slide-In sem SideEffects pesados de Backend
export function CheckoutFlyout() {
  const { cart, isOpen, closeCart, isInitialLoading, removeItem, isSyncing } = useCart();
  const [mounted, setMounted] = useState(false);

  // Escapa o Portal Safely Pós Rehydrate
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleRemove = async (productId: string, size: string) => {
    try {
      await removeItem(productId, size);
      // Toast disparado na View (Lógica UI restrita aqui e nao no Hook Central)
      toast.success("Item devidamente removido do carrinho");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message || "Perda de sintonia temporal impeditiva de remover");
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fundo Backdrop Obscurecedor Blur/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Carrinho Lateral Ativo Flyout Offcanvas Restrito de Interação */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[101] flex h-screen w-full max-w-[420px] flex-col bg-background shadow-2xl overflow-hidden sm:rounded-l-[2rem] border-l border-border/40"
          >
            {/* Esconderijo da Scrollbar com Custom Scrollbar util futuramente */}
            <div className="flex flex-col h-full relative">
              {/* HEADER OFF-CANVAS */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-background/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-display font-black uppercase tracking-[0.15em] text-foreground">
                    Seu Carrinho
                  </h2>
                </div>
                <button 
                  onClick={closeCart} 
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 hover:bg-muted/80 text-foreground transition-colors active:scale-90"
                  aria-label="Fechar carrinho"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* LISTA E MEIO */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-accent/20">
                {isInitialLoading ? (
                  /* Estado Progressivo de Carga (Skeletons Baseados em SDD UI Princípios) */
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-5 bg-white border border-border/40 p-4 rounded-2xl animate-pulse">
                          <div className="h-24 w-24 bg-muted/60 rounded-xl"></div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="space-y-3">
                              <div className="h-4 bg-muted/60 rounded-full w-full"></div>
                              <div className="h-3 bg-muted/60 rounded-full w-2/4"></div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="h-5 bg-muted/60 rounded-full w-1/3"></div>
                              <div className="h-6 w-12 bg-muted/60 rounded-lg"></div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                ) : cart?.items.length === 0 ? (
                  /* Estado Neutro Inativo Vazio Frontal */
                  <div className="flex flex-col h-full items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 rounded-full bg-muted/40 flex items-center justify-center mb-6">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-display font-bold text-xl uppercase tracking-widest text-foreground mb-2">
                      Carrinho Vazio
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-[250px]">
                      Seu arsenal desportivo ainda não possui itens. Continue explorando nosso catálogo.
                    </p>
                    <button 
                      onClick={closeCart}
                      className="mt-8 px-8 py-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
                    >
                      Explorar Produtos
                    </button>
                  </div>
                ) : (
                  /* Estado Sucesso Restritivo Rendereizado Dinamicamente Otimista */
                  <div className="space-y-4">
                    {cart?.items.map((item) => (
                      <CartItemCard 
                        key={`${item.productId}-${item.size}`} 
                        item={item} 
                        onRemove={handleRemove}
                        isRemoving={isSyncing}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER TRANSAÇÃO E RESUMO */}
              <div className="border-t border-border/40 px-8 py-8 bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 relative">
                <div className="flex justify-between items-center font-bold text-lg mb-6">
                  <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Total Parcial</span>
                  <span className="font-display font-black text-2xl text-foreground">
                    R$ {cart?.total?.toFixed(2).replace('.', ',') || "0,00"}
                  </span>
                </div>
                <button 
                  disabled={isInitialLoading || !cart?.items.length || isSyncing} 
                  className={`relative w-full overflow-hidden font-display flex items-center justify-center font-black py-4 rounded-xl transition-all uppercase tracking-[0.2em] text-sm ${
                    isSyncing 
                      ? "bg-muted text-muted-foreground cursor-wait" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-primary/30"
                  }`}
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      Sincronizando...
                    </span>
                  ) : (
                    "Finalizar Compra"
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-4 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest">
                  <span>🔒 Compra 100% Segura</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
