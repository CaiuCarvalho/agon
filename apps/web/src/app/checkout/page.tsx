import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutPageClient } from '@/modules/checkout/components/CheckoutPageClient';

export default async function CheckoutPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/checkout');
  }
  
  // Fetch cart items directly using server-side supabase client
  const { data: cartData, error: cartError } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (cartError) {
    console.error('Error fetching cart:', cartError);
    redirect('/cart');
  }
  
  // Check if cart is empty
  if (!cartData || cartData.length === 0) {
    redirect('/cart');
  }
  
  // Transform cart items to match CheckoutPageClient props
  const checkoutItems = cartData.map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product?.name || item.product_name_snapshot,
    productPrice: item.product?.price ? parseFloat(item.product.price) : parseFloat(item.price_snapshot),
    quantity: item.quantity,
    size: item.size,
    imageUrl: item.product?.image_url,
  }));
  
  return (
    <CheckoutPageClient 
      cartItems={checkoutItems}
      userEmail={user.email}
    />
  );
}
