'use client';

import { CreditCard, Smartphone, FileText, Shield } from 'lucide-react';

/**
 * Payment Methods Display Component
 * 
 * Shows available Mercado Pago payment methods with icons
 */
export function PaymentMethodsDisplay() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Métodos de Pagamento</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md border border-gray-200">
          <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
          <span className="text-sm text-center text-gray-700">Cartão de Crédito</span>
        </div>
        
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md border border-gray-200">
          <CreditCard className="w-8 h-8 text-green-600 mb-2" />
          <span className="text-sm text-center text-gray-700">Cartão de Débito</span>
        </div>
        
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md border border-gray-200">
          <Smartphone className="w-8 h-8 text-teal-600 mb-2" />
          <span className="text-sm text-center text-gray-700">PIX</span>
        </div>
        
        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md border border-gray-200">
          <FileText className="w-8 h-8 text-orange-600 mb-2" />
          <span className="text-sm text-center text-gray-700">Boleto</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <svg className="w-24 h-6" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="20" fontSize="16" fontWeight="bold" fill="#009EE3">Mercado Pago</text>
          </svg>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Pagamento 100% seguro</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        Você será redirecionado para o Mercado Pago para finalizar o pagamento
      </p>
    </div>
  );
}
