'use client';

import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Package, MapPin, Mail, Phone } from 'lucide-react';
import { validationService } from '@/modules/checkout/services/validationService';

interface OrderItem {
  productName: string;
  quantity: number;
  size: string;
  productPrice: number;
  subtotal: number;
}

interface Payment {
  status: string;
  paymentMethod: string | null;
  amount: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone: string;
  shippingEmail: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  payment: Payment | null;
}

interface OrderConfirmationClientProps {
  order: Order;
}

export function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const paymentStatus = order.payment?.status || 'pending';
  
  // Status badge configuration
  const statusConfig = {
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Pagamento Aprovado',
      message: 'Seu pedido está sendo processado e será enviado em breve!',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Pagamento Pendente',
      message: 'Aguardando confirmação do pagamento.',
    },
    in_process: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Processando Pagamento',
      message: 'Seu pagamento está sendo processado.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Pagamento Rejeitado',
      message: 'Não foi possível processar seu pagamento.',
    },
    cancelled: {
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Pagamento Cancelado',
      message: 'O pagamento foi cancelado.',
    },
  };
  
  const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Card */}
        <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-6 mb-6`}>
          <div className="flex items-start gap-4">
            <StatusIcon className={`${config.color} w-8 h-8 flex-shrink-0`} />
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${config.color} mb-2`}>
                {config.label}
              </h1>
              <p className="text-gray-700 mb-4">{config.message}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <strong>Pedido:</strong> #{order.id.slice(0, 8)}
                </span>
                <span>
                  <strong>Total:</strong> {validationService.formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Itens do Pedido</h2>
              </div>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-500">
                        Tamanho: {item.size} • Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {validationService.formatCurrency(item.productPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {validationService.formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {validationService.formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Informações de Entrega</h2>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{order.shippingName}</p>
                </div>
                <div>
                  <p className="text-gray-600">{order.shippingAddress}</p>
                  <p className="text-gray-600">
                    {order.shippingCity}, {order.shippingState} - {order.shippingZip}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{order.shippingPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{order.shippingEmail}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">Próximos Passos</h2>
              
              {paymentStatus === 'approved' && (
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p>✅ Pagamento confirmado</p>
                  <p>📦 Preparando seu pedido</p>
                  <p>🚚 Você receberá o código de rastreamento por email</p>
                </div>
              )}
              
              {paymentStatus === 'pending' && (
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p>⏳ Aguardando confirmação do pagamento</p>
                  <p>📧 Você receberá um email quando o pagamento for confirmado</p>
                </div>
              )}
              
              {(paymentStatus === 'rejected' || paymentStatus === 'cancelled') && (
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p>❌ O pagamento não foi processado</p>
                  <p>💡 Você pode tentar novamente com outro método de pagamento</p>
                </div>
              )}
              
              <Link
                href="/products"
                className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Continuar Comprando
              </Link>
              
              <Link
                href="/perfil"
                className="block w-full border border-gray-300 text-gray-700 text-center py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Ver Meus Pedidos
              </Link>
              
              {(paymentStatus === 'rejected' || paymentStatus === 'cancelled') && (
                <Link
                  href="/checkout"
                  className="block w-full border border-blue-600 text-blue-600 text-center py-3 px-4 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  Tentar Novamente
                </Link>
              )}
            </div>
            
            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Data do pedido:</strong><br />
                {new Date(order.createdAt).toLocaleString('pt-BR')}
              </p>
              <p>
                <strong>Método de pagamento:</strong><br />
                {order.payment?.paymentMethod || order.paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
