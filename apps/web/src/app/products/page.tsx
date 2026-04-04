import ProductCard from "@/components/ProductCard";
import SearchFilters from "@/components/products/SearchFilters";
import AnimatedGrid from "@/components/products/AnimatedGrid";
import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductFilters, Category } from "@/modules/products/types";

export const metadata: Metadata = {
  title: "Arsenal | Agon",
  description: "A coleção de elite de itens da Seleção Brasileira",
};

/**
 * Transform database row (snake_case) to Product interface (camelCase)
 */
function transformProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    categoryId: row.category_id,
    imageUrl: row.image_url,
    stock: row.stock,
    features: row.features || [],
    rating: parseFloat(row.rating || 0),
    reviews: row.reviews || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    category: row.category ? {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
      description: row.category.description,
      createdAt: row.category.created_at,
      updatedAt: row.category.updated_at,
    } : undefined,
  };
}

/**
 * Transform database row (snake_case) to Category interface (camelCase)
 */
function transformCategoryRow(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Parse searchParams into ProductFilters
 */
function parseFilters(searchParams: Record<string, string | string[] | undefined>): ProductFilters {
  const filters: ProductFilters = {};

  // Parse search
  if (searchParams.search && typeof searchParams.search === 'string') {
    filters.search = searchParams.search;
  }

  // Parse categoryId
  if (searchParams.category && typeof searchParams.category === 'string') {
    filters.categoryId = searchParams.category;
  }

  // Parse minPrice
  if (searchParams.minPrice && typeof searchParams.minPrice === 'string') {
    const parsed = parseFloat(searchParams.minPrice);
    if (!isNaN(parsed)) filters.minPrice = parsed;
  }

  // Parse maxPrice
  if (searchParams.maxPrice && typeof searchParams.maxPrice === 'string') {
    const parsed = parseFloat(searchParams.maxPrice);
    if (!isNaN(parsed)) filters.maxPrice = parsed;
  }

  // Parse minRating
  if (searchParams.minRating && typeof searchParams.minRating === 'string') {
    const parsed = parseFloat(searchParams.minRating);
    if (!isNaN(parsed)) filters.minRating = parsed;
  }

  // Parse sortBy
  if (searchParams.sort && typeof searchParams.sort === 'string') {
    const validSorts = ['latest', 'oldest', 'price_asc', 'price_desc'];
    if (validSorts.includes(searchParams.sort)) {
      filters.sortBy = searchParams.sort as 'latest' | 'oldest' | 'price_asc' | 'price_desc';
    }
  }

  // Parse page
  if (searchParams.page && typeof searchParams.page === 'string') {
    const parsed = parseInt(searchParams.page, 10);
    if (!isNaN(parsed) && parsed > 0) filters.page = parsed;
  }

  return filters;
}

/**
 * Get products with full-text search (server-side)
 */
async function getProductsWithSearch(filters: ProductFilters): Promise<Product[]> {
  const supabase = await createClient();
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'latest',
  } = filters;

  const searchTerm = search!.trim();

  // Build the full-text search query using textSearch
  let nameQuery = supabase
    .from('products')
    .select('*, category:categories(*)')
    .is('deleted_at', null)
    .textSearch('name', searchTerm, { type: 'plain', config: 'portuguese' });

  let descQuery = supabase
    .from('products')
    .select('*, category:categories(*)')
    .is('deleted_at', null)
    .textSearch('description', searchTerm, { type: 'plain', config: 'portuguese' });

  // Apply filters to both queries
  const applyFilters = (query: any) => {
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }
    if (minRating !== undefined) {
      query = query.gte('rating', minRating);
    }
    return query;
  };

  nameQuery = applyFilters(nameQuery);
  descQuery = applyFilters(descQuery);

  // Execute both queries
  const [nameResults, descResults] = await Promise.all([
    nameQuery,
    descQuery,
  ]);

  if (nameResults.error) {
    console.error('Failed to search products:', nameResults.error);
    return [];
  }
  if (descResults.error) {
    console.error('Failed to search products:', descResults.error);
    return [];
  }

  // Merge results and remove duplicates
  const allProducts = [...(nameResults.data || []), ...(descResults.data || [])];
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.id, p])).values()
  );

  // Apply sorting
  uniqueProducts.sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'price_asc':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price_desc':
        return parseFloat(b.price) - parseFloat(a.price);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return uniqueProducts.map(transformProductRow);
}

/**
 * Get products with filters (server-side)
 */
async function getProducts(filters: ProductFilters): Promise<Product[]> {
  const supabase = await createClient();
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'latest',
    page = 1,
    limit = 20,
  } = filters;

  // If search is provided, use full-text search
  if (search && search.trim()) {
    return await getProductsWithSearch(filters);
  }

  // Start building query with category join (no search)
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .is('deleted_at', null);

  // Apply category filter
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Apply price range filters
  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  // Apply rating filter
  if (minRating !== undefined) {
    query = query.gte('rating', minRating);
  }

  // Apply sorting
  switch (sortBy) {
    case 'latest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }

  return (data || []).map(transformProductRow);
}

/**
 * Get all categories (server-side)
 */
async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }

  return (data || []).map(transformCategoryRow);
}

export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[] | undefined> 
}) {
  // Parse filters from searchParams
  const filters = parseFilters(searchParams);

  // Fetch products and categories in parallel
  const [products, categories] = await Promise.all([
    getProducts(filters),
    getCategories()
  ]);

  return (
    <div className="container mx-auto py-24 pb-40 px-4 md:px-8">
      <div className="mb-16">
        <h1 className="font-display text-5xl md:text-7xl mb-4 text-foreground uppercase tracking-tighter">
          O Arsenal <span className="text-primary">Agon</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-body font-medium max-w-2xl text-balance mb-12">
          Explore a linha exclusiva de equipamentos projetados para elite da performance. A armadura oficial da paixão nacional.
        </p>

        <Suspense fallback={<div className="h-16 animate-pulse bg-card/10 rounded-full" />}>
          <SearchFilters categories={categories} />
        </Suspense>
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-2xl bg-secondary/50">
          <p className="text-lg text-muted-foreground font-body font-medium uppercase tracking-widest">
            {filters.search || filters.categoryId ? 'Nenhum produto encontrado' : 'Estoque Indisponível'}
          </p>
        </div>
      ) : (
        <AnimatedGrid>
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              title={product.name}
              price={product.price}
              image={product.imageUrl}
              category={product.category?.name || "Premium"}
              stock={product.stock}
            />
          ))}
        </AnimatedGrid>
      )}
    </div>
  );
}
