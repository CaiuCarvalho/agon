"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ExternalLink,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface OrderCardProps {
  order: any;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"; icon: any; description: string }> = {
  PENDING: {
    label: "Aguardando Pagamento",
    variant: "warning",
    icon: Clock,
    description: "Seu boleto ou PIX está aguardando compensação."
  },
  PAID: {
    label: "Pagamento Confirmado",
    variant: "success",
    icon: CheckCircle2,
    description: "Recebemos seu pagamento! Estamos preparando seu manto."
  },
  FAILED: {
    label: "Pagamento Falhou",
    variant: "destructive",
    icon: XCircle,
    description: "Houve um problema com a transação. Tente novamente."
  },
  SHIPPED: {
    label: "Em Trânsito",
    variant: "default",
    icon: Truck,
    description: "Seu pedido já saiu para entrega!"
  },
  DELIVERED: {
    label: "Entregue",
    variant: "secondary",
    icon: Package,
    description: "O manto já está em suas mãos. Aproveite!"
  },
  CANCELLED: {
    label: "Cancelado",
    variant: "outline",
    icon: XCircle,
    description: "Este pedido foi cancelado."
  },
};

export function OrderCard({ order }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <Card className={`overflow-hidden border-border/40 transition-all duration-300 ${isExpanded ? "ring-1 ring-primary/30" : "hover:border-primary/30"}`}>
      <CardContent className="p-0">
        {/* Header - Summary */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4 p-5">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                  ID: {order.id.slice(0, 8)}
                </span>
                <Badge variant={config.variant} className="text-[8px] uppercase font-black px-1.5 py-0">
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm font-bold">
                {format(new Date(order.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-8 p-5 sm:border-l border-border/10 bg-muted/5 sm:bg-transparent">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-0.5">Total</span>
              <p className="text-lg font-display tracking-tight text-foreground italic">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(order.total)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/10 bg-muted/5"
            >
              <div className="p-6 space-y-6">
                {/* Status Message */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border/40">
                  <div className={`mt-0.5 p-1.5 rounded-lg bg-${config.variant}/10 text-${config.variant}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">{config.label}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{config.description}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="h-3 w-3" /> Itens do Pedido
                  </h4>
                  <div className="grid gap-3">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-md bg-muted/50 border border-border/10 overflow-hidden flex-shrink-0">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-muted">
                                <Package className="h-4 w-4 opacity-30" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none">{item.product?.name || "Produto Agon"}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Qtde: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking & Links */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-border/10">
                  {order.trackingCode && (
                    <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-[9px] uppercase font-black text-primary tracking-widest mb-1">Código de Rastreio</p>
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono font-bold">{order.trackingCode}</code>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] uppercase font-black">
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 w-full mt-2">
                    <Button variant="outline" className="flex-1 h-9 uppercase text-[9px] font-black tracking-widest border-border/40">
                      <Receipt className="h-3 w-3 mr-2" /> 2ª Via da Nota
                    </Button>
                    {order.status === "PENDING" && order.paymentLink && (
                      <Button className="flex-1 h-9 uppercase text-[9px] font-black tracking-widest">
                        Pagar Agora <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Sub-component placeholder since we don't have ShoppingBag in the card scope
function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
