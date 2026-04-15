'use client';

import { useState } from 'react';
import type { OrderWithDetails, ShippingStatus } from '../../types';
import { COMMON_CARRIERS } from '../../constants';
import { useAdminShipping } from '../../hooks/useAdminShipping';

interface Props {
  order: OrderWithDetails;
  onUpdated: () => void;
}

export function ShippingUpdateForm({ order, onUpdated }: Props) {
  const [status, setStatus] = useState<ShippingStatus>(order.shippingStatus);
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [customCarrier, setCustomCarrier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requiresOverride, setRequiresOverride] = useState(false);
  const { updateShipping, loading } = useAdminShipping();

  const paymentApproved = order.payment.status === 'approved';
  const requiresTracking = status === 'shipped' || status === 'delivered';
  const selectedCarrier = carrier === 'other' ? customCarrier : carrier;
  const carrierIsCommon = COMMON_CARRIERS.includes(carrier as typeof COMMON_CARRIERS[number]);
  const carrierValue = carrier && !carrierIsCommon && carrier !== 'other' ? 'other' : carrier;

  const submit = async (forceOverride: boolean) => {
    setError(null);
    if (requiresTracking && (!trackingCode || !selectedCarrier)) {
      setError('Código de rastreamento e transportadora são obrigatórios para "Enviado" ou "Entregue"');
      return;
    }
    const result = await updateShipping(order.id, {
      shippingStatus: status,
      trackingCode: trackingCode || undefined,
      carrier: selectedCarrier || undefined,
      forceOverride,
    });
    if (!result.success) {
      if (result.error?.includes('unpaid') || result.error?.includes('Payment')) {
        setRequiresOverride(true);
        setError(result.error);
      } else {
        setError(result.error ?? 'Erro ao atualizar');
      }
      return;
    }
    setRequiresOverride(false);
    onUpdated();
  };

  return (
    <div className="px-5 py-4 space-y-3">
      <h3 className="text-sm font-semibold">Atualizar envio</h3>

      {!paymentApproved && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded">
          Pagamento não aprovado ({order.payment.status}). Para avançar o envio você precisará confirmar a substituição.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          Status
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ShippingStatus)}
            className="mt-1 w-full px-2 py-1.5 text-sm border rounded-md bg-background"
          >
            <option value="pending">Pendente</option>
            <option value="processing">Processando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
          </select>
        </label>
        <label className="text-xs">
          Transportadora{requiresTracking && <span className="text-red-500"> *</span>}
          <select
            value={carrierValue}
            onChange={e => setCarrier(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-sm border rounded-md bg-background"
          >
            <option value="">Selecione...</option>
            {COMMON_CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="other">Outra</option>
          </select>
        </label>
      </div>

      {carrierValue === 'other' && (
        <label className="text-xs block">
          Nome da transportadora
          <input
            type="text"
            value={customCarrier || (carrierIsCommon ? '' : carrier)}
            onChange={e => setCustomCarrier(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </label>
      )}

      <label className="text-xs block">
        Código de rastreamento{requiresTracking && <span className="text-red-500"> *</span>}
        <input
          type="text"
          value={trackingCode}
          onChange={e => setTrackingCode(e.target.value)}
          placeholder="Ex: BR123456789BR"
          className="mt-1 w-full px-2 py-1.5 text-sm border rounded-md"
        />
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2 rounded">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => submit(false)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        {requiresOverride && (
          <button
            onClick={() => submit(true)}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            Salvar mesmo assim
          </button>
        )}
      </div>
    </div>
  );
}
