'use client';

import type { OrderWithDetails } from '../../types';

export function OrderAddressBlock({ order }: { order: OrderWithDetails }) {
  return (
    <div className="px-5 py-4 border-b grid grid-cols-2 gap-4 text-sm">
      <div>
        <h3 className="text-sm font-semibold mb-2">Cliente</h3>
        <div className="text-sm">{order.shippingName}</div>
        <div className="text-xs text-muted-foreground">{order.shippingEmail}</div>
        <div className="text-xs text-muted-foreground">{order.shippingPhone}</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Endereço</h3>
        <div className="text-sm">{order.shippingAddress}</div>
        <div className="text-xs text-muted-foreground">
          {order.shippingCity}, {order.shippingState} · {order.shippingZip}
        </div>
      </div>
    </div>
  );
}
