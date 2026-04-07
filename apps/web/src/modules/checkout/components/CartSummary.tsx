"use client";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  imageUrl?: string;
}

interface CartSummaryProps {
  items: CartItem[];
}

export function CartSummary({ items }: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
  const shipping = 0; // Free shipping for MVP
  const total = subtotal + shipping;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
      
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="text-sm font-medium">{item.productName}</h3>
              <p className="text-sm text-gray-600">Tamanho: {item.size}</p>
              <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formatCurrency(item.productPrice * item.quantity)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.productPrice)} cada</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete</span>
          <span className="font-medium text-green-600">Grátis</span>
        </div>
        
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-base font-semibold">Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
