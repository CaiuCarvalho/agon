import { getProducts } from '@/modules/products/services/productService';
import { createClient } from '@/lib/supabase/server';
import Home from './HomeClient';
import type { Product } from '@/modules/products/types';

export default async function HomeWrapper() {
  let initialProducts: Product[] | undefined;
  let productsError: string | null = null;

  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const result = await getProducts(supabase, { limit: 16, sortBy: 'latest' });
    initialProducts = result.products;
  } catch (error: any) {
    console.error('[products] fetch failed', {
      page: 'home',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      durationMs: Date.now() - startTime,
      code: error?.code,
      message: error?.message,
      hint: error?.hint,
    });
    productsError = error?.message || 'Failed to load products';
  }

  return <Home initialProducts={initialProducts} productsError={productsError} />;
}
