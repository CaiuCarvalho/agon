'use client';

// Admin Guard Component
// Protects admin routes from unauthorized access

import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Router will redirect
  }
  
  return <>{children}</>;
}
