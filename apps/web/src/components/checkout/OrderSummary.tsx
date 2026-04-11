"use client";

import { CreditCard, QrCode, ShieldCheck, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  paymentMethod: "PIX" | "CARD";
  setPaymentMethod: (method: "PIX" | "CARD") => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  paymentMethod,
  setPaymentMethod,
  onSubmit,
  isSubmitting
}: OrderSummaryProps) {
  const total = subtotal + shippingCost;
  const freeShippingThreshold = 200;

  return (
    <div className="lg:col-span-1 space-y-8 sticky top-28">
      <div className="bg-card/30 backdrop-blur-xl border border-border/40 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <h2 className="text-3xl font-display uppercase italic font-black tracking-tighter mb-10">RESUMO DO <span className="text-primary">PEDIDO</span></h2>
        
        <div className="space-y-8 mb-10 border-b border-border/20 pb-10 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
          {items.map((item) => (
            <div key={item.id} className="flex gap-6 items-center">
              <div className="h-20 w-20 bg-muted/20 rounded-2xl overflow-hidden flex-shrink-0 border border-border/30">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1 truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Qtd: {item.quantity}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] text-primary uppercase font-black italic tracking-widest">{formatCurrency(item.price)} un.</span>
                </div>
              </div>
              <p className="text-sm font-black italic text-foreground">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-5 mb-10">
          <div className="flex justify-between text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">
            <span>Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">
            <span>Frete Agon Elite</span>
            {shippingCost === 0 ? (
              <span className="text-secondary font-black animate-pulse">GRÁTIS 🔥</span>
            ) : (
              <span className="text-foreground">{formatCurrency(shippingCost)}</span>
            )}
          </div>
          
          {subtotal < freeShippingThreshold && (
             <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 transition-all">
              <p className="text-[9px] text-center text-primary font-black uppercase tracking-widest">
                Faltam <span className="underline">{formatCurrency(freeShippingThreshold - subtotal)}</span> para o <span className="italic">Frete Grátis acima de R$ 200</span>!
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-end pt-6 border-t border-border/20">
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.4em] mb-1">Total Final</span>
            <span className="text-4xl font-display uppercase italic font-black text-primary tracking-tighter leading-none">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="space-y-5 mb-12">
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em] text-center mb-2">Método de Elite</p>
          <div className="grid grid-cols-2 gap-5">
            <button 
              onClick={() => setPaymentMethod("PIX")}
              className={`group flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden ${
                paymentMethod === "PIX" 
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,156,59,0.1)]" 
                  : "border-border/30 bg-background/20 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <QrCode className={`h-8 w-8 mb-3 transition-transform duration-500 group-hover:scale-110 ${paymentMethod === "PIX" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === "PIX" ? "text-primary" : "text-muted-foreground"}`}>PIX</span>
              {paymentMethod === "PIX" && <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />}
            </button>
            <button 
              onClick={() => setPaymentMethod("CARD")}
              className={`group flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-500 relative overflow-hidden ${
                paymentMethod === "CARD" 
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,156,59,0.1)]" 
                  : "border-border/30 bg-background/20 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <CreditCard className={`h-8 w-8 mb-3 transition-transform duration-500 group-hover:scale-110 ${paymentMethod === "CARD" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === "CARD" ? "text-primary" : "text-muted-foreground"}`}>Cartão</span>
              {paymentMethod === "CARD" && <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />}
            </button>
          </div>
        </div>

        <button 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="group relative w-full h-20 bg-primary text-primary-foreground font-display text-2xl uppercase italic font-black tracking-[0.1em] rounded-3xl overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_10px_40px_rgba(0,156,59,0.3)] hover:shadow-[0_15px_50px_rgba(0,156,59,0.5)]"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xl">Processando...</span>
            </div>
          ) : (
            <>
              <span className="relative z-10">FINALIZAR COMPRA</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary/20 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-3 mt-10 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Ambiente de Elite 100% SEGURO</span>
        </div>
      </div>
    </div>
  );
}
