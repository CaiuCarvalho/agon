'use client';

import { useState } from 'react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { ProductTable } from './ProductTable';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../../types';

export function ProductsPage() {
  const {
    products,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProduct,
    updateStock,
  } = useAdminProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleSubmit = async (data: any) => {
    const result = editingProduct
      ? await updateProduct(editingProduct.id, data)
      : await createProduct(data);
    
    if (result.success) {
      setIsModalOpen(false);
      setEditingProduct(null);
    }
    
    return result;
  };
  
  if (loading && products.length === 0) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Product
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <ProductTable
        products={products}
        onEdit={handleEdit}
        onToggle={toggleProduct}
        onUpdateStock={updateStock}
      />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing {products.length} of {total} products
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchProducts(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => fetchProducts(page + 1)}
            disabled={page * pageSize >= total}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      
      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
