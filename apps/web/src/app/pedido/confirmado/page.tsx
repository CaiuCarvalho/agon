import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderConfirmationClient } from '@/modules/payment/components/OrderConfirmationClient';

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order_id?: string };
}) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const orderId = searchParams.order_id;
  
  if (!orderId) {
    redirect('/');
  }
  
  // Fetch order with payment and items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      payments (*)
    `)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();
  
  if (orderError || !order) {
    console.error('Order not found:', orderError);
    redirect('/');
  }
  
  // Transform data
  const orderData = {
    id: order.id,
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    shippingName: order.shipping_name,
    shippingAddress: order.shipping_address,
    shippingCity: order.shipping_city,
    shippingState: order.shipping_state,
    shippingZip: order.shipping_zip,
    shippingPhone: order.shipping_phone,
    shippingEmail: order.shipping_email,
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    items: order.order_items.map((item: any) => ({
      productName: item.product_name,
      quantity: item.quantity,
      size: item.size,
      productPrice: parseFloat(item.product_price),
      subtotal: parseFloat(item.subtotal),
    })),
    payment: order.payments?.[0] ? {
      status: order.payments[0].status,
      paymentMethod: order.payments[0].payment_method,
      amount: parseFloat(order.payments[0].amount),
    } : null,
  };
  
  return <OrderConfirmationClient order={orderData} />;
}
