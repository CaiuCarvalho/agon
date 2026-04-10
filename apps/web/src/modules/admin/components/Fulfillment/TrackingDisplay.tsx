// TrackingDisplay Component
// Displays tracking code and carrier information

interface TrackingDisplayProps {
  trackingCode: string | null;
  carrier: string | null;
}

export function TrackingDisplay({ trackingCode, carrier }: TrackingDisplayProps) {
  if (!trackingCode && !carrier) {
    return (
      <div className="text-sm text-gray-500">
        Sem informações de rastreamento
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {carrier && (
        <div className="text-sm">
          <span className="font-medium text-gray-700">Transportadora:</span>{' '}
          <span className="text-gray-900">{carrier}</span>
        </div>
      )}
      {trackingCode && (
        <div className="text-sm">
          <span className="font-medium text-gray-700">Código de Rastreamento:</span>{' '}
          <span className="text-gray-900 font-mono">{trackingCode}</span>
        </div>
      )}
    </div>
  );
}
