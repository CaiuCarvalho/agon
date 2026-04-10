// useAdminShipping Hook
// Manages shipping updates for orders

import { useState } from 'react';
import type { ShippingUpdateInput } from '../schemas';

export function useAdminShipping() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateShipping = async (
    orderId: string,
    input: ShippingUpdateInput
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update shipping');
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    updateShipping,
  };
}
