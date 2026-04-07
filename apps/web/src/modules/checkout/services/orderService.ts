// Order service - handles order creation and retrieval
// Pure service - no UI logic

import { createClient } from '@/lib/supabase/client';
import { ShippingFormValues, PaymentMethod } from '../contracts';

// Database row types (snake_case from Postgres)
export interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total_amount: string; // Postgres DECIMAL comes as string
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
  shipping_email: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: string; // Postgres DECIMAL comes as string
  quantity: number;
  size: string;
  subtotal: string; // Postgres DECIMAL comes as string
  created_at: string;
}

// Application types (camelCase)
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

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size: string;
  subtotal: number;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderRequest {
  shippingInfo: ShippingFormValues;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  totalAmount: number;
  itemCount: number;
}

/**
 * Transforms database order row to application Order type
 */
export function transformOrderRow(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    shippingName: row.shipping_name,
    shippingAddress: row.shipping_address,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    shippingZip: row.shipping_zip,
    shippingPhone: row.shipping_phone,
    shippingEmail: row.shipping_email,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transforms database order item row to application OrderItem type
 */
export function transformOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productPrice: parseFloat(row.product_price),
    quantity: row.quantity,
    size: row.size,
    subtotal: parseFloat(row.subtotal),
    createdAt: row.created_at,
  };
}

/**
 * Creates an order by calling the atomic RPC function
 * This function validates cart, checks stock, captures prices, creates order, and clears cart
 */
export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('create_order_atomic', {
    p_shipping_name: request.shippingInfo.shippingName,
    p_shipping_address: request.shippingInfo.shippingAddress,
    p_shipping_city: request.shippingInfo.shippingCity,
    p_shipping_state: request.shippingInfo.shippingState,
    p_shipping_zip: request.shippingInfo.shippingZip,
    p_shipping_phone: request.shippingInfo.shippingPhone,
    p_shipping_email: request.shippingInfo.shippingEmail,
    p_payment_method: request.paymentMethod,
  });
  
  if (error) {
    throw new Error(error.message || 'Erro ao criar pedido');
  }
  
  if (!data || !data.success) {
    throw new Error(data?.message || 'Erro ao criar pedido');
  }
  
  return {
    success: true,
    orderId: data.order_id,
    totalAmount: data.total_amount,
    itemCount: data.item_count,
  };
}

/**
 * Fetches a single order by ID with its items
 * RLS policies ensure users can only access their own orders
 */
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = createClient();
  
  // Fetch order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (orderError || !orderData) {
    return null;
  }
  
  // Fetch order items
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  if (itemsError) {
    return null;
  }
  
  const order = transformOrderRow(orderData as OrderRow);
  const items = (itemsData as OrderItemRow[]).map(transformOrderItemRow);
  
  return {
    ...order,
    items,
  };
}

/**
 * Fetches all orders for the current user with pagination
 */
export async function getUserOrders(page: number = 1, pageSize: number = 10): Promise<Order[]> {
  const supabase = createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error || !data) {
    return [];
  }
  
  return (data as OrderRow[]).map(transformOrderRow);
}

/**
 * Updates order status (admin only - RLS enforced)
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  
  return !error;
}

export const orderService = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
};
