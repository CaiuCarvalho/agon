// Metrics Card Component
// Displays individual metric with formatting

interface MetricsCardProps {
  title: string;
  value: number;
  format: 'currency' | 'number';
}

export function MetricsCard({ title, value, format }: MetricsCardProps) {
  const formattedValue = format === 'currency'
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    : value.toLocaleString('pt-BR');
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
    </div>
  );
}
