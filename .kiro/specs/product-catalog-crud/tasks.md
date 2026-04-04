# Implementation Plan: Product Catalog CRUD

## Overview

This implementation plan breaks down the Product Catalog CRUD feature into discrete, actionable coding tasks. The feature replaces mock product data with real Supabase persistence, enabling full product lifecycle management through an admin panel and providing customers with a rich browsing experience including search, filtering, sorting, and detailed product views.

The implementation follows a layered architecture: Database Schema → Services Layer → Hooks Layer → UI Components → Integration. Each task builds incrementally, with checkpoints to ensure stability. All mutations implement optimistic UI updates with mandatory query invalidation to enforce cross-page consistency.

## Tasks

- [x] 1. Set up database schema and RLS policies
  - Create `products` table with all required columns and constraints
  - Create `categories` table with unique constraints on name and slug
  - Add indexes for performance: category_id, deleted_at, created_at, price, name_search, description_search
  - Create triggers to auto-update `updated_at` timestamps
  - Enable Row Level Security on both tables
  - Create RLS policies: public SELECT (non-deleted products), admin INSERT/UPDATE/DELETE
  - Insert seed data for default categories (Manto Oficial, Equipamentos, Lifestyle, Cuidados)
  - _Requirements: 1.1-1.16, 2.1-2.8, 3.1-3.8_

- [ ]* 1.1 Write property test for stock non-negativity
  - **Property 1: Stock Non-Negativity (Invariant)**
  - **Validates: Requirements 1.7, 12.1**

- [ ]* 1.2 Write property test for soft delete immutability
  - **Property 2: Soft Delete Immutability (Invariant)**
  - **Validates: Requirements 6.5**

- [ ]* 1.3 Write property test for category foreign key integrity
  - **Property 3: Category Foreign Key Integrity (Invariant)**
  - **Validates: Requirements 1.5**

- [ ]* 1.4 Write property test for price precision
  - **Property 4: Price Precision (Invariant)**
  - **Validates: Requirements 1.4**

- [x] 2. Create TypeScript interfaces and Zod validation schemas
  - Create `apps/web/src/modules/products/types.ts` with Product, Category, ProductFormValues, CategoryFormValues, ProductFilters, PaginatedProducts interfaces
  - Create `apps/web/src/modules/products/schemas.ts` with Zod schemas: productSchema, categorySchema, productFiltersSchema, imageFileSchema
  - Implement validation rules: name (1-200 chars), description (1-2000 chars), price (positive, 2 decimals), stock (non-negative integer), categoryId (UUID), imageUrl (URL), features (array)
  - Implement category validation: name (1-100 chars, unique), slug (1-100 chars, lowercase alphanumeric with hyphens), description (optional)
  - Implement image file validation: MIME type (image/jpeg, image/png, image/webp), max size 5MB
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 13.4, 14.2, 14.3_

- [ ]* 2.1 Write property test for price non-negativity validation
  - **Property 1: Price Non-Negativity Validation**
  - **Validates: Requirements 1.4, 4.6**

- [ ]* 2.2 Write property test for name length validation
  - **Property 3: Name Length Validation**
  - **Validates: Requirements 4.4**

- [ ]* 2.3 Write property test for description length validation
  - **Property 4: Description Length Validation**
  - **Validates: Requirements 4.5**

- [ ]* 2.4 Write property test for stock non-negativity validation
  - **Property 5: Stock Non-Negativity Validation**
  - **Validates: Requirements 4.7, 12.1**

- [ ]* 2.5 Write property test for slug generation consistency
  - **Property 10: Slug Generation Consistency**
  - **Validates: Requirements 13.4**

- [ ]* 2.6 Write property test for image file type validation
  - **Property 11: Image File Type Validation**
  - **Validates: Requirements 14.2, 14.5**

- [ ]* 2.7 Write property test for image file size validation
  - **Property 12: Image File Size Validation**
  - **Validates: Requirements 14.3, 14.4**

- [x] 3. Implement Product Service Layer
  - Create `apps/web/src/modules/products/services/productService.ts`
  - Implement `getProducts(filters)` with pagination, search (ILIKE on name/description), category filter, price range filter, rating filter, sorting (latest, oldest, price_asc, price_desc)
  - Implement `getProductById(id)` with category join, filter deleted_at IS NULL
  - Implement `createProduct(values)` with Zod validation, insert into products table
  - Implement `updateProduct(id, values)` with partial Zod validation, update products table
  - Implement `softDeleteProduct(id)` setting deleted_at to NOW()
  - Implement `restoreProduct(id)` setting deleted_at to NULL
  - Implement `getDeletedProducts()` for admin view
  - Implement `transformProductRow()` helper to convert snake_case to camelCase
  - _Requirements: 4.9, 4.10, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 8.1-8.12, 9.1-9.10, 10.1-10.8_

- [ ]* 3.1 Write property test for soft delete visibility exclusion
  - **Property 2: Soft Delete Visibility Exclusion**
  - **Validates: Requirements 3.2**

- [ ]* 3.2 Write property test for search term matching
  - **Property 8: Search Term Matching**
  - **Validates: Requirements 9.4, 9.10**

- [ ]* 3.3 Write property test for sort order correctness
  - **Property 9: Sort Order Correctness**
  - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**

- [x] 4. Implement Category Service Layer
  - Create `apps/web/src/modules/products/services/categoryService.ts`
  - Implement `getCategories()` fetching all categories ordered by name
  - Implement `getCategoryById(id)` fetching single category
  - Implement `getCategoryBySlug(slug)` for URL-based lookups
  - Implement `createCategory(values)` with Zod validation
  - Implement `updateCategory(id, values)` with partial Zod validation
  - Implement `deleteCategory(id)` with product count check (prevent deletion if products exist)
  - Implement `getCategoryProductCount(id)` counting non-deleted products
  - Implement `generateSlug(name)` converting to lowercase, removing accents, replacing spaces with hyphens
  - Implement `transformCategoryRow()` helper to convert snake_case to camelCase
  - _Requirements: 13.1-13.10_

- [ ]* 4.1 Write property test for category deletion protection
  - **Property 12: Category Deletion Protection (Error Condition)**
  - **Validates: Requirements 13.6**

- [x] 5. Implement Image Service Layer
  - Create `apps/web/src/modules/products/services/imageService.ts`
  - Implement `uploadImage(file)` uploading to Cloudinary with validation
  - Configure Cloudinary: cloud_name, upload_preset, folder (agon/products)
  - Implement upload progress tracking
  - Implement `deleteImage(publicId)` via server-side API route (optional cleanup)
  - Implement `getOptimizedUrl(url, options)` generating Cloudinary transformation URLs
  - Add error handling for upload failures, file size errors, invalid formats
  - _Requirements: 14.1-14.12_

- [x] 6. Checkpoint - Verify Services Layer
  - Test all service functions with mock Supabase client
  - Verify Zod validation catches invalid inputs
  - Verify data transformation (snake_case ↔ camelCase)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement React Query Hooks for Products
  - Create `apps/web/src/modules/products/hooks/useProducts.ts`
  - Implement `useProducts(filters)` hook with React Query, queryKey: ['products', filters], staleTime: 5 minutes
  - Implement `useProduct(id)` hook with React Query, queryKey: ['products', id], enabled when id exists
  - Configure caching: staleTime 5 minutes, gcTime 10 minutes
  - _Requirements: 8.1-8.12, 11.1-11.12_

- [x] 8. Implement React Query Mutation Hooks for Products
  - Create `apps/web/src/modules/products/hooks/useProductMutations.ts`
  - Implement `createProduct` mutation with optimistic update (add temp product to list), rollback on error, invalidate ['products'] queries on success
  - Implement `updateProduct` mutation with optimistic update (update product in list and single product cache), rollback on error, invalidate ['products'] and ['products', id] queries on success
  - Implement `softDeleteProduct` mutation with optimistic update (remove from list), rollback on error, invalidate ['products'] queries on success
  - Implement `restoreProduct` mutation with invalidation on success
  - Add toast notifications: success (green), error (red) using Sonner
  - **CRITICAL**: ALL mutations MUST invalidate affected queries to enforce cross-page consistency
  - **CRITICAL**: Optimistic updates MUST rollback to exact previous state on failure within 100ms
  - _Requirements: 4.9, 4.10, 4.11, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 17.1-17.8_

- [ ]* 8.1 Write property test for optimistic update rollback
  - **Property 8: Optimistic Update Rollback (Error Condition)**
  - **Validates: Requirements 17.4, 17.6**

- [x] 9. Implement React Query Hooks for Categories
  - Create `apps/web/src/modules/products/hooks/useCategories.ts`
  - Implement `useCategories()` hook with React Query, queryKey: ['categories'], staleTime: 10 minutes
  - Implement `useCategory(id)` hook with React Query, queryKey: ['categories', id]
  - Implement `useCategoryProductCount(id)` hook with React Query, queryKey: ['categories', id, 'product-count']
  - _Requirements: 13.8, 13.9_

- [x] 10. Implement React Query Mutation Hooks for Categories
  - Create `apps/web/src/modules/products/hooks/useCategoryMutations.ts`
  - Implement `createCategory` mutation with invalidation on success
  - Implement `updateCategory` mutation with invalidation on success
  - Implement `deleteCategory` mutation with invalidation on success, special error handling for categories with products
  - Add toast notifications for all operations
  - **CRITICAL**: ALL mutations MUST invalidate ['categories'] queries
  - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6, 13.7_

- [x] 11. Checkpoint - Verify Hooks Layer
  - Test hooks with mock service layer
  - Verify React Query caching behavior
  - Verify optimistic updates and rollback
  - Verify query invalidation after mutations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Product Form Modal Component
  - Create `apps/web/src/modules/products/components/ProductForm.tsx`
  - Implement form fields: name (text), description (textarea), price (number), category (dropdown), image_url (text + upload button), stock (number), features (array input)
  - Integrate image upload: file input, preview, upload to Cloudinary, set imageUrl on success
  - Implement form validation with Zod schema, display inline errors
  - Implement submit handler calling onSubmit prop with validated values
  - Implement loading state during submission (disable submit button)
  - Support create mode (empty form) and edit mode (pre-filled with product data)
  - Add close button and modal backdrop
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.3, 5.4, 14.1-14.11_

- [ ]* 12.1 Write unit tests for Product Form validation
  - Test form renders with empty fields (create mode)
  - Test form renders with pre-filled fields (edit mode)
  - Test validation errors display for invalid inputs
  - Test image upload success and failure scenarios
  - Test form submission with valid data
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 14.3, 14.4, 14.5_

- [x] 13. Implement Product Table Component for Admin
  - Create `apps/web/src/modules/products/components/ProductTable.tsx`
  - Display products in table layout with columns: image thumbnail, name, category, price, stock, actions (Edit, Delete)
  - Implement pagination controls: Previous, Next, page numbers, total count
  - Implement "Show Deleted" toggle to view soft-deleted products
  - Add "Create Product" button opening ProductForm modal
  - Implement Edit button opening ProductForm modal with product data
  - Implement Delete button with confirmation dialog, call softDeleteProduct mutation
  - Implement Restore button for deleted products
  - Display loading skeleton while fetching products
  - Display empty state when no products exist
  - _Requirements: 7.1-7.10, 6.9, 6.10_

- [ ]* 13.1 Write unit tests for Product Table
  - Test table renders product list correctly
  - Test pagination controls work correctly
  - Test Edit button opens modal with product data
  - Test Delete button shows confirmation and calls mutation
  - Test empty state displays when no products
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.10_

- [x] 14. Implement Category Manager Component
  - Create `apps/web/src/modules/products/components/CategoryManager.tsx`
  - Display categories in table or list with columns: name, slug, product count, actions (Edit, Delete)
  - Add "Create Category" button opening category form modal
  - Implement category form with fields: name, slug (auto-generated from name), description
  - Implement Edit button opening form with category data
  - Implement Delete button with confirmation, show error if category has products
  - Display product count for each category
  - Add toast notifications for all operations
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ]* 14.1 Write unit tests for Category Manager
  - Test category list renders correctly
  - Test Create button opens form
  - Test slug auto-generation from name
  - Test Delete button blocked for categories with products
  - Test Edit updates category successfully
  - _Requirements: 13.1, 13.2, 13.4, 13.6_

- [x] 15. Implement Admin Products Page
  - Create `apps/web/src/app/admin/products/page.tsx` as client component
  - Implement authentication check: redirect to /login if not authenticated
  - Implement admin role check: display "Unauthorized" if not admin
  - Integrate ProductTable component with useProducts hook
  - Integrate ProductForm modal with useProductMutations hook
  - Integrate CategoryManager component (optional: separate tab or section)
  - Implement page state: isFormOpen, editingProduct, page, showDeleted
  - Add page title "Gerenciar Produtos" and breadcrumbs
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2_

- [ ]* 15.1 Write integration tests for Admin Products Page
  - Test admin can create product
  - Test admin can edit product
  - Test admin can soft delete product
  - Test non-admin cannot access page
  - Test unauthenticated user redirected to login
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 3.3, 3.4, 3.5_

- [x] 16. Checkpoint - Verify Admin Panel
  - Manually test admin panel at /admin/products
  - Verify product CRUD operations work end-to-end
  - Verify category management works
  - Verify image upload works
  - Verify optimistic updates and rollback
  - Verify cross-page consistency (admin panel ↔ product listing)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement Customer Product Listing Page
  - Create `apps/web/src/app/products/page.tsx` as server component
  - Fetch products using productService.getProducts() with filters from searchParams
  - Fetch categories using categoryService.getCategories()
  - Parse searchParams into ProductFilters: search, categoryId, minPrice, maxPrice, minRating, sortBy, page
  - Render SearchFilters component (existing) with categories prop
  - Render AnimatedGrid component (existing) with products
  - Render ProductCard component (existing) for each product
  - Implement loading skeleton while fetching
  - Display "No products found" when results are empty
  - Set page metadata: title "Arsenal | Agon", description "A coleção de elite de itens da Seleção Brasileira"
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 18.1, 18.2, 18.3, 19.1, 19.2_

- [ ]* 17.1 Write property test for filter combination consistency
  - **Property 7: Filter Combination Commutativity (Confluence)**
  - **Validates: Requirements 8.8**

- [ ]* 17.2 Write integration tests for Product Listing Page
  - Test page renders products correctly
  - Test category filter updates URL and filters products
  - Test price range filter works
  - Test search updates URL and filters products
  - Test sort order changes results
  - Test pagination works
  - _Requirements: 8.5, 8.6, 8.7, 8.10, 10.1-10.8_

- [x] 18. Enhance SearchFilters Component with Debounce
  - Verify `apps/web/src/components/products/SearchFilters.tsx` exists
  - Implement search input with 300ms debounce using useDebounce hook or setTimeout
  - Cancel previous pending searches when new input received
  - Update URL query parameter ?search={term} on debounced search
  - Implement category filter dropdown updating URL ?categoryId={id}
  - Implement price range sliders updating URL ?minPrice={min}&maxPrice={max}
  - Implement rating filter updating URL ?minRating={rating}
  - Implement sort dropdown with options: Latest, Oldest, Price (Low to High), Price (High to Low)
  - Update URL ?sortBy={option} on sort change
  - Display active filter count badge
  - Add "Reset Filters" button clearing all filters
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 10.1-10.8_

- [ ]* 18.1 Write property test for search debounce idempotence
  - **Property 5: Search Debounce Idempotence (Idempotence)**
  - **Validates: Requirements 9.3**

- [ ]* 18.2 Write unit tests for SearchFilters
  - Test search input debounces correctly
  - Test category filter updates URL
  - Test price range filter updates URL
  - Test sort dropdown updates URL
  - Test reset button clears all filters
  - _Requirements: 9.1, 9.2, 9.3, 10.1_

- [x] 19. Implement Product Detail Page
  - Create `apps/web/src/app/products/[id]/page.tsx` as server component
  - Fetch product using productService.getProductById(params.id)
  - Return notFound() if product is null or deleted_at is not null
  - Render product layout: image (left), info (right) on desktop; stacked on mobile
  - Display: product image, name, category name, price (formatted as R$ X,XX), description, features list, stock status, rating, review count
  - Display stock badges: "Out of Stock" (stock = 0), "Only X left" (stock 1-5)
  - Render ClientActions component (existing) with productId and stock props for "Add to Cart" and "Add to Wishlist" buttons
  - Disable "Add to Cart" button when stock = 0
  - Add "Back to Products" link
  - Set page metadata: title "{product.name} | Agon", description (product.description truncated to 160 chars), Open Graph tags, product schema markup (JSON-LD)
  - _Requirements: 11.1-11.12, 18.4, 18.5, 19.3, 19.4, 19.5, 19.6_

- [ ]* 19.1 Write integration tests for Product Detail Page
  - Test page renders product correctly
  - Test 404 returned for non-existent product
  - Test 404 returned for soft-deleted product
  - Test "Add to Cart" disabled when stock = 0
  - Test stock badges display correctly
  - _Requirements: 11.5, 11.6, 11.8, 11.9, 12.4, 12.5_

- [x] 20. Implement Responsive Design for All Components
  - Verify Product Listing uses responsive grid: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
  - Verify Product Detail stacks vertically on mobile, side-by-side on desktop
  - Verify SearchFilters stacks controls vertically on mobile
  - Verify Admin Panel table scrolls horizontally on mobile
  - Verify ProductForm modal is scrollable on small screens
  - Verify ProductCard maintains aspect ratio across screen sizes
  - Verify category filter buttons scroll horizontally on mobile
  - Test on mobile (< 640px), tablet (640px - 1024px), desktop (> 1024px)
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ]* 20.1 Write visual regression tests for responsive design
  - Test Product Listing on mobile, tablet, desktop
  - Test Product Detail on mobile, tablet, desktop
  - Test Admin Panel on mobile, tablet, desktop
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 21. Implement Error Handling and Loading States
  - Add loading skeletons to Product Listing, Product Detail, Admin Panel
  - Add error boundaries to catch React errors
  - Implement connection error handling: display "Connection error. Please try again." with retry button
  - Implement 404 handling for Product Detail: display "Product not found" page
  - Implement empty states: "No products found" (listing), "No products match your filters" (filtered), "Create a product" (admin empty)
  - Add toast notifications for all mutations: success (green), error (red)
  - Log errors to console with structured format: [Products][Operation] error
  - Preserve form state on error (don't clear form)
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10_

- [ ]* 21.1 Write unit tests for error handling
  - Test connection error displays retry button
  - Test 404 page displays for missing product
  - Test empty states display correctly
  - Test form state preserved on error
  - _Requirements: 16.1, 16.4, 16.5, 16.6, 16.9_

- [x] 22. Checkpoint - Verify Customer Experience
  - Manually test product listing at /products
  - Verify search, filters, and sorting work
  - Verify product detail page displays correctly
  - Verify responsive design on mobile and desktop
  - Verify loading states and error handling
  - Verify cross-page consistency (listing ↔ detail ↔ admin)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Implement Performance Optimizations
  - Verify database indexes are created (category_id, deleted_at, created_at, price, name_search, description_search)
  - Configure React Query caching: products (5 min stale), categories (10 min stale)
  - Implement search debounce (300ms) to reduce API calls
  - Use Next.js Image component for lazy loading product images
  - Implement pagination to limit result sets (20 items per page)
  - Add loading="lazy" to product images
  - Verify Cloudinary CDN delivers optimized images
  - Test page load times: Product Listing < 2s, Product Detail < 1.5s, Admin Panel < 2s
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [ ]* 23.1 Write performance tests
  - Test Product Listing loads within 2 seconds
  - Test Product Detail loads within 1.5 seconds
  - Test search debounce reduces API calls
  - Test pagination limits result sets
  - _Requirements: 20.1, 20.2, 20.5, 20.6, 20.8_

- [x] 24. Implement SEO and Metadata
  - Set Product Listing metadata: title "Arsenal | Agon", description "A coleção de elite de itens da Seleção Brasileira", canonical URL
  - Set Product Detail metadata: title "{product.name} | Agon", description (product.description truncated), Open Graph tags (og:title, og:description, og:image), canonical URL
  - Add product schema markup (JSON-LD) to Product Detail: @type Product, name, description, image, offers (price, availability)
  - Verify meta tags render correctly in page source
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ]* 24.1 Write SEO tests
  - Test Product Listing has correct meta tags
  - Test Product Detail has correct meta tags
  - Test product schema markup is valid JSON-LD
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.6_

- [x] 25. Final Integration and Wiring
  - Verify all components integrate correctly
  - Test complete user flows: admin creates product → customer views in listing → customer views detail
  - Test mutation consistency: admin updates product → changes reflect in listing and detail pages immediately
  - Test soft delete: admin deletes product → product disappears from customer views but remains in admin "Show Deleted" view
  - Test category management: admin creates category → category appears in filters and product form
  - Test image upload: admin uploads image → image displays in listing and detail pages
  - Verify RLS policies enforce access control
  - Verify all toast notifications work
  - _Requirements: 18.1-18.8_

- [ ]* 25.1 Write E2E tests for complete user flows
  - Test admin product creation flow
  - Test admin product editing flow
  - Test admin product deletion flow
  - Test customer product browsing flow
  - Test customer product search flow
  - Test customer product filtering flow
  - _Requirements: 4.1-4.11, 5.1-5.10, 6.1-6.10, 8.1-8.12, 9.1-9.10, 11.1-11.12_

- [x] 26. Final Checkpoint - Production Readiness
  - Run all unit tests and verify passing
  - Run all integration tests and verify passing
  - Run all E2E tests and verify passing
  - Verify no TypeScript errors with `npx tsc --noEmit`
  - Verify no console errors in browser
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on multiple devices (mobile, tablet, desktop)
  - Verify accessibility with screen reader
  - Verify performance benchmarks met
  - Verify security: RLS policies, input validation, image upload restrictions
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Implementation follows layered architecture: Database → Services → Hooks → Components → Integration
- All mutations implement optimistic UI updates with mandatory query invalidation
- Cross-page consistency is enforced: changes in admin panel immediately reflect in customer views
- Soft delete strategy preserves historical data while hiding products from customers
- Search debounce (300ms) reduces API calls during typing
- React Query caching reduces redundant requests
- Responsive design ensures usability on all devices
- Comprehensive error handling provides clear feedback to users
- SEO optimization ensures products are discoverable via search engines

