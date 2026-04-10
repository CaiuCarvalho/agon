import { ProductForm } from './ProductForm';
import type { Product } from '../../types';
import type { ProductInput } from '../../schemas';

interface ProductFormModalProps {
  product: Product | null;
  onSubmit: (data: ProductInput) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ProductFormModal({ product, onSubmit, onClose }: ProductFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {product ? 'Edit Product' : 'Create Product'}
        </h2>
        <ProductForm
          product={product}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
