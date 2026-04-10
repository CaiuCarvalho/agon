// ShippingUpdateModal Component
// Modal for updating shipping information

import type { OrderWithDetails } from '../../types';
import { ShippingForm } from './ShippingForm';
import { useAdminShipping } from '../../hooks/useAdminShipping';

interface ShippingUpdateModalProps {
  order: OrderWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShippingUpdateModal({ order, onClose, onSuccess }: ShippingUpdateModalProps) {
  const { updateShipping } = useAdminShipping();
  
  const handleSubmit = async (data: any) => {
    const result = await updateShipping(order.id, data);
    
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      throw new Error(result.error || 'Falha ao atualizar envio');
    }
  };
  
  // Check if payment is approved
  const isPaymentApproved = order.payment.status === 'approved';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Atualizar Envio
        </h2>
        
        {!isPaymentApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Atenção: O pagamento deste pedido ainda não foi aprovado. 
              Você não poderá marcar como enviado até que o pagamento seja aprovado.
            </p>
          </div>
        )}
        
        <div className="mb-4 text-sm text-gray-600">
          <p><span className="font-medium">Pedido:</span> {order.id.slice(0, 8)}...</p>
          <p><span className="font-medium">Cliente:</span> {order.shippingName}</p>
          <p><span className="font-medium">Status do Pagamento:</span> {order.payment.status}</p>
        </div>
        
        <ShippingForm
          currentStatus={order.shippingStatus}
          currentTrackingCode={order.trackingCode}
          currentCarrier={order.carrier}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
