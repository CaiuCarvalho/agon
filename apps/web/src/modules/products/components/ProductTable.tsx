'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
  Loader2,
} from 'lucide-react';
import { ProductForm } from './ProductForm';
import { useProducts } from '../hooks/useProducts';
import { useProductMutations } from '../hooks/useProductMutations';
import type { Product, ProductFormValues } from '../types';

interface ProductTableProps {
  showDeleted?: boolean;
}

export function ProductTable({ showDeleted = false }: ProductTableProps) {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showDeletedProducts, setShowDeletedProducts] = useState(showDeleted);

  const limit = 20;
  const { data, isLoading } = useProducts({
    page,
    limit,
    // Note: In a full implementation, we'd need to add a filter for deleted products
    // For now, we'll filter client-side or extend the useProducts hook
  });

  const {
    createProduct,
    updateProduct,
    softDeleteProduct,
    restoreProduct,
  } = useProductMutations();

  // Filter products based on showDeletedProducts toggle
  const displayedProducts = data?.products.filter((product) =>
    showDeletedProducts ? product.deletedAt !== null : product.deletedAt === null
  ) || [];

  const handleCreateProduct = async (values: ProductFormValues) => {
    await createProduct.mutateAsync(values);
    setIsFormOpen(false);
  };

  const handleEditProduct = async (values: ProductFormValues) => {
    if (!editingProduct) return;
    
    await updateProduct.mutateAsync({
      id: editingProduct.id,
      values,
      currentUpdatedAt: editingProduct.updatedAt,
    });
    
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    await softDeleteProduct.mutateAsync(id);
    setDeletingProductId(null);
  };

  const handleRestoreProduct = async (id: string) => {
    await restoreProduct.mutateAsync(id);
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display uppercase tracking-wider">
            Gerenciar Produtos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeletedProducts(!showDeletedProducts)}
            className="uppercase font-bold tracking-widest text-xs"
          >
            {showDeletedProducts ? 'Ocultar Deletados' : 'Mostrar Deletados'}
          </Button>
          <Button
            onClick={openCreateForm}
            className="uppercase font-bold tracking-widest text-xs"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Produto
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {showDeletedProducts
              ? 'Nenhum produto deletado'
              : 'Nenhum produto encontrado'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {showDeletedProducts
              ? 'Não há produtos deletados no momento.'
              : 'Comece criando seu primeiro produto.'}
          </p>
          {!showDeletedProducts && (
            <Button onClick={openCreateForm} className="uppercase font-bold tracking-widest text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Criar Produto
            </Button>
          )}
        </div>
      )}

      {/* Product Table */}
      {!isLoading && displayedProducts.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Imagem
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Nome
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Categoria
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Preço
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Estoque
                  </th>
                  <th className="text-right p-4 text-xs uppercase tracking-widest font-bold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{product.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {product.category?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{formatPrice(product.price)}</div>
                    </td>
                    <td className="p-4">
                      <div
                        className={`text-sm ${
                          product.stock === 0
                            ? 'text-destructive font-semibold'
                            : product.stock <= 5
                            ? 'text-yellow-600 font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {product.stock === 0 ? 'Sem estoque' : product.stock}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {product.deletedAt ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreProduct(product.id)}
                            disabled={restoreProduct.isPending}
                            className="uppercase font-bold tracking-widest text-xs"
                          >
                            {restoreProduct.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restaurar
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditForm(product)}
                              className="uppercase font-bold tracking-widest text-xs"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingProductId(product.id)}
                              className="uppercase font-bold tracking-widest text-xs"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Deletar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 space-y-3 bg-card"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || 'N/A'}
                    </p>
                    <p className="font-medium mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div
                    className={`text-sm ${
                      product.stock === 0
                        ? 'text-destructive font-semibold'
                        : product.stock <= 5
                        ? 'text-yellow-600 font-semibold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Estoque: {product.stock === 0 ? 'Sem estoque' : product.stock}
                  </div>
                  <div className="flex gap-2">
                    {product.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreProduct(product.id)}
                        disabled={restoreProduct.isPending}
                        className="uppercase font-bold tracking-widest text-xs"
                      >
                        {restoreProduct.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingProductId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {displayedProducts.length} de {total} produtos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="uppercase font-bold tracking-widest text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-10 uppercase font-bold tracking-widest text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="uppercase font-bold tracking-widest text-xs"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}
        initialData={editingProduct}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProductId}
        onOpenChange={(open) => !open && setDeletingProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-wider">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso ocultará o produto dos clientes. Os dados históricos serão preservados.
              Esta ação pode ser revertida usando o botão "Restaurar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase font-bold tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProductId && handleDeleteProduct(deletingProductId)}
              disabled={softDeleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-bold tracking-widest text-xs"
            >
              {softDeleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
