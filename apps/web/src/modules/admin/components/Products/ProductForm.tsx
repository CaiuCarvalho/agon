import { useState, useEffect } from 'react';
import type { Product } from '../../types';
import type { ProductInput } from '../../schemas';
import { ImageUpload } from './ImageUpload';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: ProductInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

function buildFormData(product: Product | null): ProductInput {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    unlimitedStock: product?.unlimitedStock ?? false,
    categoryId: product?.categoryId ?? null,
    sizes: product?.sizes ?? [],
    imageUrl: product?.imageUrl ?? '',
  };
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductInput>(() => buildFormData(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setFormData(buildFormData(product));
    setErrors({});
  }, [product?.id]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const result = await onSubmit(formData);
    setLoading(false);

    if (!result.success && result.error) {
      setErrors({ general: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
          {errors.general}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (R$)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) })}
            className="w-full px-3 py-2 border rounded-lg"
            min="0"
            disabled={formData.unlimitedStock}
            required={!formData.unlimitedStock}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="unlimitedStock"
          checked={formData.unlimitedStock ?? false}
          onChange={(e) => setFormData({ ...formData, unlimitedStock: e.target.checked })}
          className="w-4 h-4 accent-blue-600"
        />
        <label htmlFor="unlimitedStock" className="text-sm font-medium text-gray-700">
          Estoque ilimitado (dropshipping / fornecedor gerencia)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.categoryId ?? ''}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value || null })
          }
          className="w-full px-3 py-2 border rounded-lg bg-white"
        >
          <option value="">— No category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sizes (comma-separated)
        </label>
        <input
          type="text"
          value={formData.sizes.join(', ')}
          onChange={(e) =>
            setFormData({
              ...formData,
              sizes: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="P, M, G, GG"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <ImageUpload
          imageUrl={formData.imageUrl}
          onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
