// OrderDetailsRow Component
// Displays expanded order details

import { format } from 'date-fns';
import type { OrderWithDetails } from '../../types';
import { OrderItemsList } from './OrderItemsList';
import { TrackingDisplay } from '../Fulfillment/TrackingDisplay';

interface OrderDetailsRowProps {
  order: OrderWithDetails;
  onUpdateShipping?: (order: OrderWithDetails) => void;
}

export function OrderDetailsRow({ order, onUpdateShipping }: OrderDetailsRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };
  
  return (
    <td colSpan={7} className="px-6 py-4 bg-gray-50">
      <div className="space-y-6">
        {/* Order Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
          <OrderItemsList items={order.items} />
        </div>
        
        {/* Shipping Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Informações de Envio</h4>
              {onUpdateShipping && (
                <button
                  onClick={() => onUpdateShipping(order)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Atualizar Envio
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}, {order.shippingState} {order.shippingZip}
              </p>
              <p>Telefone: {order.shippingPhone}</p>
              <p>Email: {order.shippingEmail}</p>
            </div>
          </div>
          
          {/* Payment Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Informações de Pagamento</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{order.payment.status}</span>
              </p>
              <p>
                <span className="font-medium">Método:</span>{' '}
                {order.payment.paymentMethod || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Valor:</span>{' '}
                {formatCurrency(order.payment.amount)}
              </p>
              {order.payment.mercadopagoPaymentId && (
                <p>
                  <span className="font-medium">ID do Pagamento:</span>{' '}
                  {order.payment.mercadopagoPaymentId}
                </p>
              )}
              <p>
                <span className="font-medium">Criado:</span>{' '}
                {formatDate(order.payment.createdAt)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tracking Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informações de Rastreamento</h4>
          <TrackingDisplay 
            trackingCode={order.trackingCode} 
            carrier={order.carrier} 
          />
          {order.shippedAt && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Enviado em:</span> {formatDate(order.shippedAt)}
            </p>
          )}
        </div>
      </div>
    </td>
  );
}
