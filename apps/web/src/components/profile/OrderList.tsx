"use client";

import { OrderCard } from "./OrderCard";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";

interface OrderListProps {
  orders: any[];
  isLoading?: boolean;
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="text-[10px] uppercase font-black tracking-widest mt-4 text-muted-foreground animate-pulse">
          Buscando seu histórico...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/5 rounded-3xl border border-dashed border-border/40">
        <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>
        <h3 className="text-2xl font-display uppercase italic font-black tracking-widest mb-2 italic">
          Histórico Vazio
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-8">
          Você ainda não realizou nenhuma compra na Agon. Nossos melhores mantos estão te esperando!
        </p>
        <Button
          variant="outline"
          className="uppercase font-black tracking-[0.2em] text-[10px] h-12 px-8 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
          asChild
        >
          <a href="/#produtos">Explorar a Loja Agon</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground">
          Total de {orders.length} pedidos
        </p>
      </div>
      <div className="grid gap-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
