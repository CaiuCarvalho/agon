'use client';

import type { OrderItem } from '../../types';

function brl(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export function OrderItemsTable({ items, total }: { items: OrderItem[]; total: number }) {
  return (
    <div className="px-5 py-4 border-b">
      <h3 className="text-sm font-semibold mb-2">Itens</h3>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Produto</th>
              <th className="text-left px-3 py-2 font-medium">Tam.</th>
              <th className="text-right px-3 py-2 font-medium">Qtd</th>
              <th className="text-right px-3 py-2 font-medium">Preço</th>
              <th className="text-right px-3 py-2 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">{i.productName}</td>
                <td className="px-3 py-2">{i.size}</td>
                <td className="px-3 py-2 text-right">{i.quantity}</td>
                <td className="px-3 py-2 text-right">{brl(i.productPrice)}</td>
                <td className="px-3 py-2 text-right font-medium">{brl(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/30">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right font-semibold">Total</td>
              <td className="px-3 py-2 text-right font-bold">{brl(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
