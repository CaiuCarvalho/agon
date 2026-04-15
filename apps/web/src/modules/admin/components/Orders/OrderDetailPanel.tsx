'use client';

import { useOrderDetail } from '../../hooks/useOrderDetail';
import { OrderDetailHeader } from './OrderDetailHeader';
import { OrderItemsTable } from './OrderItemsTable';
import { OrderAddressBlock } from './OrderAddressBlock';
import { ShippingUpdateForm } from './ShippingUpdateForm';

interface Props {
  orderId: string | null;
  onUpdated: () => void;
}

export function OrderDetailPanel({ orderId, onUpdated }: Props) {
  const { order, loading, error, refresh } = useOrderDetail(orderId);

  if (!orderId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Selecione um pedido para ver os detalhes
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!order) return null;

  return (
    <div className="h-full overflow-y-auto">
      <OrderDetailHeader order={order} />
      <OrderItemsTable items={order.items} total={order.totalAmount} />
      <OrderAddressBlock order={order} />
      {order.trackingCode && (
        <div className="px-5 py-3 border-b text-sm">
          <span className="text-muted-foreground">Rastreio atual: </span>
          <span className="font-mono">{order.trackingCode}</span>
          {order.carrier && <span className="text-muted-foreground"> · {order.carrier}</span>}
        </div>
      )}
      <ShippingUpdateForm
        order={order}
        onUpdated={() => {
          refresh();
          onUpdated();
        }}
      />
    </div>
  );
}
