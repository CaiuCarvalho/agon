import type { Product } from '../../types';
import { StockUpdateInput } from './StockUpdateInput';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggle: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateStock: (id: string, input: { stock: number }) => Promise<{ success: boolean; error?: string }>;
}

export function ProductTable({ products, onEdit, onToggle, onUpdateStock }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Nenhum produto encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className={product.deletedAt ? 'bg-gray-50' : ''}>
              <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
              </td>
              <td className="px-6 py-4">
                <StockUpdateInput
                  productId={product.id}
                  currentStock={product.stock}
                  onUpdate={onUpdateStock}
                />
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                  product.deletedAt 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-green-100 text-green-800 border-green-200'
                }`}>
                  {product.deletedAt ? 'Inativo' : 'Ativo'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                <button
                  onClick={() => onEdit(product)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => onToggle(product.id)}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  {product.deletedAt ? 'Restaurar' : 'Desativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
