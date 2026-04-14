import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutPageClient } from '@/modules/checkout/components/CheckoutPageClient';

export default async function CheckoutPage() {
  const startTime = Date.now();
  console.log('[CHECKOUT] START');
  
  try {
    const supabase = await createClient();
    console.log(`[CHECKOUT] Client created: ${Date.now() - startTime}ms`);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log(`[CHECKOUT] Auth check: ${Date.now() - startTime}ms, hasUser=${!!user}, hasError=${!!authError}`);
    
    if (authError || !user) {
      console.log('[CHECKOUT] REDIRECT to /login (no auth)');
      redirect('/login?redirect=/checkout');
    }
    
    // Fetch cart items directly using server-side supabase client
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log(`[CHECKOUT] Cart fetch: ${Date.now() - startTime}ms, items=${cartData?.length || 0}, hasError=${!!cartError}`);
    
    if (cartError) {
      console.error('[CHECKOUT] Cart error:', cartError);
      redirect('/cart');
    }
    
    // Check if cart is empty
    if (!cartData || cartData.length === 0) {
      console.log('[CHECKOUT] REDIRECT to /cart (empty)');
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
    
    console.log(`[CHECKOUT] RENDER with ${checkoutItems.length} items: ${Date.now() - startTime}ms`);
    
    return (
      <CheckoutPageClient 
        cartItems={checkoutItems}
        userEmail={user.email}
      />
    );
  } catch (error) {
    // Next.js redirect() throws internally — rethrow so the redirect is honored
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    console.error('[CHECKOUT] Unexpected error:', error);
    redirect('/cart');
  }
}
