import { AdminGuard } from '@/modules/admin/components/shared/AdminGuard';
import { ErrorBoundary } from '@/modules/admin/components/shared/ErrorBoundary';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AdminGuard>
        <div className="min-h-screen bg-gray-50">
          {/* Admin Navigation - Fixed at top with high z-index */}
          <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <Link 
                    href="/admin" 
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/admin/products" 
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    Produtos
                  </Link>
                  <Link 
                    href="/admin/orders" 
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    Pedidos
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-500 hidden sm:block">
                    Painel Admin
                  </span>
                  <Link 
                    href="/" 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Voltar ao Site
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          {/* Main content with padding to account for fixed nav */}
          <main className="max-w-7xl mx-auto pt-16">{children}</main>
        </div>
      </AdminGuard>
    </ErrorBoundary>
  );
}
