// Admin Panel Types
// All types for the admin panel module

export type PaymentStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'refunded' 
  | 'in_process';

export type ShippingStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered';

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus; // PERSISTED: Derived and updated by trigger/RPC when payment or shipping changes
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone: string;
  shippingEmail: string;
  paymentMethod: string;
  shippingStatus: ShippingStatus;
  trackingCode: string | null;
  carrier: string | null;
  shippedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  payment: Payment;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  subtotal: number;
}

export interface Payment {
  id: string;
  orderId: string;
  mercadopagoPaymentId: string | null;
  mercadopagoPreferenceId: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  /** When true, the supplier manages stock; the stock field is ignored for availability checks */
  unlimitedStock: boolean;
  category: string;
  sizes: string[];
  images: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  orderCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  averageOrderValue: number;
  recentOrders: OrderSummary[];
}

export interface OrderSummary {
  id: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
