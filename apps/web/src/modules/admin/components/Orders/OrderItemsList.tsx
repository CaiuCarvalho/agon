// OrderItemsList Component
// Displays order items in a table

import type { OrderItem } from '../../types';

interface OrderItemsListProps {
  items: OrderItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Size
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Quantity
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-sm text-gray-900">
                {item.productName}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {item.size}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {formatCurrency(item.productPrice)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {item.quantity}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                {formatCurrency(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
