'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Trash2, Plus, Tag } from 'lucide-react';
import { categorySchema } from '../schemas';
import { useCategories, useCategoryProductCount } from '../hooks/useCategories';
import { useCategoryMutations } from '../hooks/useCategoryMutations';
import { generateSlug } from '../services/categoryService';
import type { Category, CategoryFormValues } from '../types';

/**
 * Category Manager Component
 * 
 * Displays categories in a table/list with:
 * - Name, Slug, Product count
 * - Edit and Delete actions
 * - Create Category button
 * - Category form modal
 * - Delete confirmation with product count check
 * 
 * Validates Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */
export function CategoryManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const { data: categories, isLoading } = useCategories();
  const {
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryMutations();

  const openCreateForm = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleCreateCategory = async (values: CategoryFormValues) => {
    await createCategory.mutateAsync(values);
    setIsFormOpen(false);
  };

  const handleEditCategory = async (values: CategoryFormValues) => {
    if (!editingCategory) return;
    
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      values,
    });
    
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setDeletingCategoryId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-display uppercase tracking-wider">
            Gerenciar Categorias
          </h2>
        </div>
        <Button
          onClick={openCreateForm}
          className="uppercase font-bold tracking-widest text-xs"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Categoria
        </Button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!categories || categories.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhuma categoria encontrada
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Comece criando sua primeira categoria.
          </p>
          <Button onClick={openCreateForm} className="uppercase font-bold tracking-widest text-xs">
            <Plus className="h-4 w-4 mr-2" />
            Criar Categoria
          </Button>
        </div>
      )}

      {/* Category Table */}
      {!isLoading && categories && categories.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Nome
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Slug
                  </th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest font-bold">
                    Produtos
                  </th>
                  <th className="text-right p-4 text-xs uppercase tracking-widest font-bold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onEdit={openEditForm}
                    onDelete={setDeletingCategoryId}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={openEditForm}
                onDelete={setDeletingCategoryId}
              />
            ))}
          </div>
        </>
      )}

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingCategory ? handleEditCategory : handleCreateCategory}
        initialData={editingCategory}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategoryId}
        onOpenChange={(open) => !open && setDeletingCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-wider">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.
              Categorias com produtos associados não podem ser deletadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase font-bold tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategoryId && handleDeleteCategory(deletingCategoryId)}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase font-bold tracking-widest text-xs"
            >
              {deleteCategory.isPending ? (
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

/**
 * Category Row Component (Desktop Table Row)
 */
interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const { data: productCount, isLoading } = useCategoryProductCount(category.id);

  return (
    <tr className="border-t hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <div className="font-medium">{category.name}</div>
        {category.description && (
          <div className="text-sm text-muted-foreground line-clamp-1">
            {category.description}
          </div>
        )}
      </td>
      <td className="p-4">
        <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
          {category.slug}
        </code>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `${productCount ?? 0} produto${(productCount ?? 0) !== 1 ? 's' : ''}`
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
            className="uppercase font-bold tracking-widest text-xs"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="uppercase font-bold tracking-widest text-xs"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Deletar
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Category Card Component (Mobile View)
 */
function CategoryCard({ category, onEdit, onDelete }: CategoryRowProps) {
  const { data: productCount, isLoading } = useCategoryProductCount(category.id);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div>
        <h3 className="font-medium">{category.name}</h3>
        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {category.slug}
        </code>
        {category.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `${productCount ?? 0} produto${(productCount ?? 0) !== 1 ? 's' : ''}`
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Category Form Modal Component
 */
interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
  initialData?: Category | null;
  isLoading: boolean;
}

function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || '',
        }
      : {
          name: '',
          slug: '',
          description: '',
        },
  });

  const name = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!initialData && name) {
      const generatedSlug = generateSlug(name);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [name, initialData, setValue]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: CategoryFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Tag className="h-5 w-5" />
            <DialogTitle className="text-xl font-display uppercase tracking-wider">
              {initialData ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {initialData
              ? 'Atualize as informações da categoria.'
              : 'Adicione uma nova categoria ao catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Nome da Categoria *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Manto Oficial"
              {...register('name')}
              className={
                errors.name
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            {errors.name && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label
              htmlFor="slug"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Slug *
            </Label>
            <Input
              id="slug"
              placeholder="manto-oficial"
              {...register('slug')}
              className={
                errors.slug
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Gerado automaticamente a partir do nome. Pode ser editado manualmente.
            </p>
            {errors.slug && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.slug.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Descrição (Opcional)
            </Label>
            <textarea
              id="description"
              placeholder="Descreva a categoria..."
              {...register('description')}
              rows={3}
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.description
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            />
            {errors.description && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="uppercase font-bold tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="uppercase font-bold tracking-widest text-xs min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : initialData ? (
                'Atualizar'
              ) : (
                'Criar Categoria'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
