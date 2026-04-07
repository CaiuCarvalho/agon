// ============================================================
// Order-related types
// ============================================================

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  createdAt: string;
  product?: {
    name: string;
    imageUrl: string;
  };
}

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  shippingAddressId: string;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  paymentLink?: string;
}
