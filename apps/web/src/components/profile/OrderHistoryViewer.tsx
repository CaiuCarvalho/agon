"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderList } from "@/components/profile/OrderList";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Package } from "lucide-react";

interface OrderHistoryViewerProps {
  userId: string;
}

export function OrderHistoryViewer({ userId }: OrderHistoryViewerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch orders with order items and product details
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Transform data to match expected format
      const transformedOrders = ordersData.map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        status: order.status,
        total: order.total,
        paymentMethod: order.payment_method,
        shippingAddressId: order.shipping_address_id,
        trackingCode: order.tracking_code,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          size: item.size,
          createdAt: item.created_at,
          product: item.products
            ? {
                name: item.products.name,
                imageUrl: item.products.image_url,
              }
            : undefined,
        })),
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar histórico de pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/40 shadow-lg">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-xl font-display uppercase tracking-wider flex items-center gap-2">
          <Package className="h-5 w-5" />
          Histórico de Pedidos
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <OrderList orders={orders} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
