'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, X, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { productSchema, type ProductFormData } from '../schemas';
import { useCategories } from '../hooks/useCategories';
import type { ProductFormValues, Product } from '../types';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Product | null;
  isLoading: boolean;
}

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
          categoryId: initialData.categoryId,
          imageUrl: initialData.imageUrl,
          stock: initialData.stock,
          features: initialData.features || [],
        }
      : {
          name: '',
          description: '',
          price: 0,
          categoryId: '',
          imageUrl: '',
          stock: 0,
          features: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error - Zod default() causes type inference issues with useFieldArray
    name: 'features',
  });

  const imageUrl = watch('imageUrl');

  // Update image preview when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
    }
  }, [imageUrl]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        categoryId: initialData.categoryId,
        imageUrl: initialData.imageUrl,
        stock: initialData.stock,
        features: initialData.features || [],
      });
      setImagePreview(initialData.imageUrl);
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        imageUrl: '',
        stock: 0,
        features: [],
      });
      setImagePreview(null);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      // Don't reset here - let parent component handle closing and resetting
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Package className="h-5 w-5" />
            <DialogTitle className="text-xl font-display uppercase tracking-wider">
              {initialData ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {initialData
              ? 'Atualize as informações do produto.'
              : 'Adicione um novo produto ao catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Nome do Produto *
            </Label>
            <Input
              id="name"
              placeholder="Ex: Camisa Oficial Brasil 2024"
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

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Descrição *
            </Label>
            <textarea
              id="description"
              placeholder="Descreva o produto em detalhes..."
              {...register('description')}
              rows={4}
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

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
              >
                Preço (R$) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
                className={
                  errors.price
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {errors.price && (
                <p className="text-[10px] text-destructive uppercase font-bold">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="stock"
                className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
              >
                Estoque *
              </Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                {...register('stock', { valueAsNumber: true })}
                className={
                  errors.stock
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />
              {errors.stock && (
                <p className="text-[10px] text-destructive uppercase font-bold">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label
              htmlFor="categoryId"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Categoria *
            </Label>
            <select
              id="categoryId"
              {...register('categoryId')}
              disabled={categoriesLoading}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.categoryId
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }`}
            >
              <option value="">Selecione uma categoria</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="imageUrl"
              className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
            >
              Imagem do Produto *
            </Label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-full h-48 rounded-md overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setValue('imageUrl', '');
                  }}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Input
              id="imageUrl"
              type="text"
              placeholder="URL da imagem"
              {...register('imageUrl')}
              className={
                errors.imageUrl
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />

            {errors.imageUrl && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Características
            </Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="Ex: Material respirável"
                    {...register(`features.${index}` as const)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append('')}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Característica
              </Button>
            </div>
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
                'Criar Produto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
