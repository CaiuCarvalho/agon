import { getProducts } from '@/modules/products/services/productService';
import Home from './HomeClient';
import type { Product } from '@/modules/products/types';

/**
 * Server Component Wrapper for Home Page
 * 
 * This component fetches products server-side to:
 * 1. Eliminate cold start on client (server warms up database)
 * 2. Provide initial data immediately (no loading state)
 * 3. Improve perceived performance
 * 
 * The actual page with client-side features (framer-motion, useAuth)
 * is in HomeClient.tsx
 */
export default async function HomeWrapper() {
  let initialProducts: Product[] | undefined;
  let productsError: string | null = null;

  try {
    console.log('[HomeWrapper] Fetching products server-side...');
    const startTime = Date.now();
    
    const result = await getProducts({ limit: 4, sortBy: 'latest' });
    initialProducts = result.products;
    
    const fetchTime = Date.now() - startTime;
    console.log(`[HomeWrapper] Products fetched in ${fetchTime}ms (server-side)`);
  } catch (error: any) {
    console.error('[HomeWrapper] Failed to fetch products server-side:', error.message);
    productsError = error.message || 'Failed to load products';
  }

  return <Home initialProducts={initialProducts} productsError={productsError} />;
}
