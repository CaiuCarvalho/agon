// ShippingForm Component
// Form for updating shipping status with tracking information

import { useState } from 'react';
import type { ShippingStatus } from '../../types';
import { COMMON_CARRIERS } from '../../constants';

interface ShippingFormProps {
  currentStatus: ShippingStatus;
  currentTrackingCode?: string | null;
  currentCarrier?: string | null;
  onSubmit: (data: { shippingStatus: ShippingStatus; trackingCode?: string; carrier?: string }) => Promise<void>;
  onCancel: () => void;
}

export function ShippingForm({ 
  currentStatus, 
  currentTrackingCode,
  currentCarrier,
  onSubmit, 
  onCancel 
}: ShippingFormProps) {
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(currentStatus);
  const [trackingCode, setTrackingCode] = useState(currentTrackingCode || '');
  const [carrier, setCarrier] = useState(currentCarrier || '');
  const [customCarrier, setCustomCarrier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const requiresTracking = shippingStatus === 'shipped' || shippingStatus === 'delivered';
  const selectedCarrier = carrier === 'other' ? customCarrier : carrier;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate tracking requirements
    if (requiresTracking && (!trackingCode || !selectedCarrier)) {
      setError('Código de rastreamento e transportadora são obrigatórios para status "Enviado" ou "Entregue"');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({
        shippingStatus,
        trackingCode: trackingCode || undefined,
        carrier: selectedCarrier || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar envio');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="shippingStatus" className="block text-sm font-medium text-gray-700 mb-1">
          Status de Envio
        </label>
        <select
          id="shippingStatus"
          value={shippingStatus}
          onChange={(e) => setShippingStatus(e.target.value as ShippingStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
          Transportadora {requiresTracking && <span className="text-red-500">*</span>}
        </label>
        <select
          id="carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={requiresTracking}
        >
          <option value="">Selecione...</option>
          {COMMON_CARRIERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="other">Outra</option>
        </select>
      </div>
      
      {carrier === 'other' && (
        <div>
          <label htmlFor="customCarrier" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Transportadora {requiresTracking && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            id="customCarrier"
            value={customCarrier}
            onChange={(e) => setCustomCarrier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o nome da transportadora"
            required={requiresTracking}
          />
        </div>
      )}
      
      <div>
        <label htmlFor="trackingCode" className="block text-sm font-medium text-gray-700 mb-1">
          Código de Rastreamento {requiresTracking && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          id="trackingCode"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ex: BR123456789BR"
          required={requiresTracking}
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
