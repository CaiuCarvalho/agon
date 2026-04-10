import { useState } from 'react';

interface StockUpdateInputProps {
  productId: string;
  currentStock: number;
  onUpdate: (id: string, input: { stock: number }) => Promise<{ success: boolean; error?: string }>;
}

export function StockUpdateInput({ productId, currentStock, onUpdate }: StockUpdateInputProps) {
  const [stock, setStock] = useState(currentStock);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    setLoading(true);
    const result = await onUpdate(productId, { stock });
    setLoading(false);
    
    if (result.success) {
      setIsEditing(false);
    }
  };
  
  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        {currentStock}
      </button>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(parseInt(e.target.value, 10))}
        className="w-20 px-2 py-1 border rounded text-sm"
        min="0"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-xs text-green-600 hover:text-green-800"
      >
        Save
      </button>
      <button
        onClick={() => {
          setStock(currentStock);
          setIsEditing(false);
        }}
        className="text-xs text-gray-600 hover:text-gray-800"
      >
        Cancel
      </button>
    </div>
  );
}
