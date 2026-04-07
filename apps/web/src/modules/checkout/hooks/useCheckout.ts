"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ShippingFormValues } from '../contracts';
import type { CreateOrderWithPaymentResponse } from '@/modules/payment/types';

interface CreateOrderRequest {
  shippingInfo: ShippingFormValues;
}

/**
 * Hook for checkout form submission and order creation with Mercado Pago
 * Handles validation, submission, success/error states, and navigation
 */
export function useCheckout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (request: CreateOrderRequest) => {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data: CreateOrderWithPaymentResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar pedido');
      }
      
      return data;
    },
    
    onSuccess: (data) => {
      // Invalidate cart queries to reflect empty cart
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      // Show success message
      toast.success('Redirecionando para pagamento...', {
        description: 'Você será redirecionado para o Mercado Pago',
      });
      
      // Redirect to Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('URL de pagamento não encontrada');
      }
    },
    
    onError: (error: Error) => {
      // Parse error message for specific cases
      const message = error.message.toLowerCase();
      
      if (message.includes('carrinho vazio') || message.includes('empty cart')) {
        toast.error('Carrinho vazio', {
          description: 'Adicione produtos ao carrinho antes de finalizar o pedido',
        });
      } else if (message.includes('estoque') || message.includes('stock')) {
        toast.error('Produto sem estoque', {
          description: 'Um ou mais produtos não têm estoque suficiente',
        });
      } else if (message.includes('autenticação') || message.includes('authentication')) {
        toast.error('Erro de autenticação', {
          description: 'Faça login para continuar',
        });
        router.push('/login');
      } else if (message.includes('mercado pago') || message.includes('pagamento')) {
        toast.error('Erro ao processar pagamento', {
          description: 'Tente novamente em alguns instantes',
        });
      } else {
        toast.error('Erro ao criar pedido', {
          description: error.message || 'Tente novamente mais tarde',
        });
      }
    },
  });

  const submitOrder = async (request: CreateOrderRequest) => {
    return createOrderMutation.mutateAsync(request);
  };

  return {
    submitOrder,
    isLoading: createOrderMutation.isPending,
    isError: createOrderMutation.isError,
    error: createOrderMutation.error,
  };
}
