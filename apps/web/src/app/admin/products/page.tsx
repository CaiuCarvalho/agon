'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { ProductTable } from '@/modules/products/components/ProductTable';
import { CategoryManager } from '@/modules/products/components/CategoryManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag, Loader2 } from 'lucide-react';

/**
 * Admin Products Page
 * 
 * Provides admin interface for managing products and categories.
 * 
 * Features:
 * - Authentication check: redirects to /login if not authenticated
 * - Admin role check: displays "Unauthorized" if not admin
 * - Tabbed interface for Products and Categories
 * - Integration with ProductTable and CategoryManager components
 * 
 * Validates Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2
 */
export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthContext();

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/admin/products');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Admin role check
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display uppercase tracking-wider mb-2">
            Acesso Não Autorizado
          </h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md uppercase font-bold tracking-widest text-xs hover:bg-primary/90 transition-colors"
          >
            Voltar para Início
          </button>
        </div>
      </div>
    );
  }

  // Admin interface
  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display uppercase tracking-wider mb-2">
          Gerenciar Produtos
        </h1>
        <p className="text-muted-foreground">
          Gerencie produtos e categorias do catálogo
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="products" className="uppercase font-bold tracking-widest text-xs">
            <Package className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categories" className="uppercase font-bold tracking-widest text-xs">
            <Tag className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-0">
          <ProductTable />
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
