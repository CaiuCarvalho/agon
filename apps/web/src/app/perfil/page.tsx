"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { AddressManager } from "@/components/profile/AddressManager";
import { OrderHistoryViewer } from "@/components/profile/OrderHistoryViewer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/perfil");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display uppercase tracking-wider mb-2">
            Minha Conta
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais, endereços e pedidos
          </p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Editor Section */}
          <div className="md:col-span-1">
            <ProfileEditor user={user} onUpdate={updateUser} />
          </div>

          {/* Address Manager Section */}
          <div className="md:col-span-1">
            <AddressManager userId={user.id} />
          </div>

          {/* Order History Section - Full width on mobile, spans 2 cols on tablet, 1 col on desktop */}
          <div className="md:col-span-2 lg:col-span-1">
            <OrderHistoryViewer userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
