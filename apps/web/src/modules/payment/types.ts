/**
 * Payment Module Types
 * 
 * Type definitions for Mercado Pago payment integration
 */

// Payment entity
export interface Payment {
  id: string;
  orderId: string;
  mercadopagoPaymentId: string | null;
  mercadopagoPreferenceId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
  paymentMethod: string | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

// Order entity (simplified for payment context)
export interface Order {
  id: string;
  userId: string;
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
  updatedAt: string;
}

// Mercado Pago preference request
export interface PreferenceRequest {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  payer: {
    email: string;
    name: string;
    phone: {
      area_code: string;
      number: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: 'approved' | 'all';
  external_reference: string;
  notification_url: string;
  statement_descriptor: string;
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
}

// Mercado Pago preference response
export interface PreferenceResponse {
  id: string; // preference_id
  init_point: string; // URL to redirect user
  sandbox_init_point: string;
  date_created: string;
  external_reference: string;
}

// Mercado Pago payment details
export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved: string | null;
  external_reference: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// Webhook notification payload
export interface WebhookNotification {
  action: string;
  api_version: string;
  data: {
    id: string; // payment_id
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice';
  user_id: string;
}

// Webhook signature validation
export interface WebhookSignature {
  ts: string; // timestamp
  v1: string; // HMAC-SHA256 hash
}

// Order creation with payment
export interface CreateOrderWithPaymentRequest {
  userId: string;
  shippingInfo: ShippingFormValues;
  paymentMethod: string;
}

export interface CreateOrderWithPaymentResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  preferenceId?: string;
  initPoint?: string;
  totalAmount?: number;
  itemCount?: number;
  error?: string;
}

// Payment status update
export interface UpdatePaymentStatusRequest {
  mercadopagoPaymentId: string;
  status: Payment['status'];
  paymentMethod: string;
}

export interface UpdatePaymentStatusResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  oldStatus?: string;
  newStatus?: string;
  orderStatus?: string;
  error?: string;
}

// Database row types (snake_case from Supabase)
export interface PaymentRow {
  id: string;
  order_id: string;
  mercadopago_payment_id: string | null;
  mercadopago_preference_id: string;
  status: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

// Shipping form values
export interface ShippingFormValues {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone: string;
  shippingEmail: string;
}

// ViaCEP response
export interface ViaCEPResponse {
  cep: string;
  logradouro: string; // street
  complemento: string;
  bairro: string; // neighborhood
  localidade: string; // city
  uf: string; // state
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

// Address data from ViaCEP
export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}
