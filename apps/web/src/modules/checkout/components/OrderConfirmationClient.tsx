"use client";

import { useState } from 'react';
import Link from 'next/link';
import { OrderWithItems } from '../services/orderService';

interface OrderConfirmationClientProps {
  order: OrderWithItems;
}

export function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orderNumber = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h1 className="text-2xl font-bold text-green-900">Pedido realizado com sucesso!</h1>
          </div>
          <p className="text-green-700 ml-11">
            Seu pedido foi confirmado e está sendo processado.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Pedido #{orderNumber}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <button
              onClick={handleCopyOrderNumber}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar número
                </>
              )}
            </button>
          </div>

          {/* Order Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {order.status === 'pending' ? 'Pendente' : order.status}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-4">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      Tamanho: {item.size} • Quantidade: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.productPrice)} cada
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-semibold mb-4">Informações de Entrega</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Nome:</span> {order.shippingName}</p>
            <p><span className="font-medium">Endereço:</span> {order.shippingAddress}</p>
            <p><span className="font-medium">Cidade:</span> {order.shippingCity} - {order.shippingState}</p>
            <p><span className="font-medium">CEP:</span> {order.shippingZip}</p>
            <p><span className="font-medium">Telefone:</span> {order.shippingPhone}</p>
            <p><span className="font-medium">Email:</span> {order.shippingEmail}</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-base font-semibold mb-2">Forma de Pagamento</h3>
          <p className="text-sm text-gray-700">
            {order.paymentMethod === 'cash_on_delivery' ? 'Pagamento na Entrega' : order.paymentMethod}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-md font-medium hover:bg-blue-700"
          >
            Continuar Comprando
          </Link>
          <Link
            href="/perfil"
            className="flex-1 border border-gray-300 text-gray-700 text-center py-3 px-6 rounded-md font-medium hover:bg-gray-50"
          >
            Ver Meus Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
