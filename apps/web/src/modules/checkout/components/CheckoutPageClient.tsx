"use client";

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShippingForm } from './ShippingForm';
import { CartSummary } from './CartSummary';
import { PaymentMethodsDisplay } from '@/modules/payment/components/PaymentMethodsDisplay';
import { useCheckout } from '../hooks/useCheckout';
import { ShippingFormValues } from '../contracts';
import { trackBeginCheckout } from '@/lib/analytics';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  imageUrl?: string;
}

interface CheckoutPageClientProps {
  cartItems: CartItem[];
  userEmail?: string;
}

export function CheckoutPageClient({ cartItems, userEmail }: CheckoutPageClientProps) {
  const { submitOrder, isLoading } = useCheckout();
  const submitButtonRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    trackBeginCheckout(
      cartItems.map(i => ({ item_id: i.productId, item_name: i.productName, price: i.productPrice, quantity: i.quantity })),
      cartItems.reduce((sum, i) => sum + i.productPrice * i.quantity, 0),
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = async (values: ShippingFormValues) => {
    await submitOrder({
      shippingInfo: values,
    });
  };

  const handleCheckoutClick = () => {
    // Trigger form submission via ref
    if (submitButtonRef.current) {
      submitButtonRef.current();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/cart" className="text-blue-600 hover:underline">
                Carrinho
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Checkout</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold mb-8">Finalizar Pedido</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Informações de Entrega</h2>
              <ShippingForm
                defaultEmail={userEmail}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                submitRef={submitButtonRef}
              />
            </div>

            {/* Payment Method */}
            <PaymentMethodsDisplay />

            {/* Action buttons - Mobile */}
            <div className="lg:hidden space-y-3">
              <button
                type="button"
                onClick={handleCheckoutClick}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processando...' : 'Finalizar Pedido'}
              </button>
              <div className="flex gap-3">
                <Link
                  href="/cart"
                  className="flex-1 text-center border border-gray-300 py-2 px-4 rounded-md text-sm hover:bg-gray-50"
                >
                  Voltar ao Carrinho
                </Link>
                <Link
                  href="/products"
                  className="flex-1 text-center border border-gray-300 py-2 px-4 rounded-md text-sm hover:bg-gray-50"
                >
                  Continuar Comprando
                </Link>
              </div>
            </div>
          </div>

          {/* Right column - Cart Summary (sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-4">
              <CartSummary items={cartItems} />
              
              {/* Action buttons - Desktop */}
              <div className="hidden lg:block space-y-3">
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processando...' : 'Finalizar Pedido'}
                </button>
                <Link
                  href="/cart"
                  className="block text-center border border-gray-300 py-2 px-4 rounded-md text-sm hover:bg-gray-50"
                >
                  Voltar ao Carrinho
                </Link>
                <Link
                  href="/products"
                  className="block text-center text-blue-600 py-2 px-4 text-sm hover:underline"
                >
                  Continuar Comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
