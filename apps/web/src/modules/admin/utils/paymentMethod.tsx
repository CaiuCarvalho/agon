// Payment Method Utilities
// Maps payment methods to Portuguese labels and icons

import { 
  CreditCard, 
  Smartphone, 
  FileText, 
  Wallet,
  HelpCircle 
} from 'lucide-react';

export type PaymentMethodType = 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'boleto' 
  | 'account_money'
  | null;

export interface PaymentMethodInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Maps payment method codes to Portuguese labels and icons
 */
export function getPaymentMethodInfo(method: PaymentMethodType): PaymentMethodInfo {
  const methodMap: Record<string, PaymentMethodInfo> = {
    credit_card: {
      label: 'Cartão de Crédito',
      icon: CreditCard,
      color: 'text-blue-600',
    },
    debit_card: {
      label: 'Cartão de Débito',
      icon: CreditCard,
      color: 'text-green-600',
    },
    pix: {
      label: 'PIX',
      icon: Smartphone,
      color: 'text-teal-600',
    },
    boleto: {
      label: 'Boleto Bancário',
      icon: FileText,
      color: 'text-orange-600',
    },
    account_money: {
      label: 'Saldo Mercado Pago',
      icon: Wallet,
      color: 'text-purple-600',
    },
  };

  if (!method || !methodMap[method]) {
    return {
      label: 'Não informado',
      icon: HelpCircle,
      color: 'text-gray-400',
    };
  }

  return methodMap[method];
}

/**
 * Gets just the label for a payment method
 */
export function getPaymentMethodLabel(method: PaymentMethodType): string {
  return getPaymentMethodInfo(method).label;
}
