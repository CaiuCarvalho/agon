// OrderTable Component
// Displays orders in a table with expandable rows

import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import type { OrderWithDetails } from '../../types';
import { OrderDetailsRow } from './OrderDetailsRow';

interface OrderTableProps {
  orders: OrderWithDetails[];
  onUpdateShipping?: (order: OrderWithDetails) => void;
}

export function OrderTable({ orders, onUpdateShipping }: OrderTableProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };
  
  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      approved: 'bg-green-100 text-green-800 border border-green-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border border-gray-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
      in_process: 'bg-blue-100 text-blue-800 border border-blue-200',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
      in_process: 'Processando',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  const getShippingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 border border-gray-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  if (orders.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-gray-500">Nenhum pedido encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID do Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status Envio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Criado em
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.shippingName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getPaymentStatusBadge(order.payment.status)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getShippingStatusBadge(order.shippingStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {expandedOrderId === order.id ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr>
                    <OrderDetailsRow order={order} onUpdateShipping={onUpdateShipping} />
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
