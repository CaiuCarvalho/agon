# Requirements Document: Product Catalog CRUD

## Introduction

The Product Catalog CRUD feature is a critical foundation for the Agon e-commerce platform that replaces the current mock product data with real Supabase persistence. This feature enables full product lifecycle management through an admin panel while providing customers with a rich browsing experience including search, filtering, and detailed product views. The implementation establishes the data layer that unblocks cart, wishlist, and checkout features.

This feature integrates with existing components (ProductCard, SearchFilters, AnimatedGrid) and follows the authentication and RLS patterns established in the auth-pages-ui and user-profile-page specs.

## Glossary

- **Product_Catalog**: The complete system for managing and displaying products in the Agon e-commerce platform
- **Admin_Panel**: The protected interface at `/admin/products` for product management operations
- **Product_Listing**: The customer-facing page at `/products` displaying filterable product grid
- **Product_Detail**: The customer-facing page at `/products/[id]` showing complete product information
- **Products_Table**: The Supabase table storing product data with columns: id, name, description, price, category_id, image_url, stock, features, rating, reviews, created_at, updated_at, deleted_at
- **Categories_Table**: The Supabase table storing category data with columns: id, name, slug, description, created_at, updated_at
- **RLS_Policy**: Row Level Security policies controlling read/write access to database tables
- **Soft_Delete**: Deletion strategy that marks records as deleted (deleted_at timestamp) without removing data
- **Search_Debounce**: Delayed search execution (300ms) to reduce API calls during typing
- **Image_Upload**: The process of uploading product images to Cloudinary or Supabase Storage
- **Stock_Management**: The system for tracking and validating product inventory levels
- **Filter_System**: The UI components for filtering products by category, price range, and rating
- **Optimistic_UI**: UI updates that occur immediately before server confirmation, with rollback on failure
- **Supabase_Client**: The database client for all product and category operations

## Requirements

### Requirement 1: Products Database Schema

**User Story:** As a system, I need a properly structured products table, so that product data persists correctly with all required attributes.

#### Acceptance Criteria

1. THE Products_Table SHALL have column `id` (UUID, primary key, auto-generated)
2. THE Products_Table SHALL have column `name` (TEXT, NOT NULL)
3. THE Products_Table SHALL have column `description` (TEXT, NOT NULL)
4. THE Products_Table SHALL have column `price` (DECIMAL(10,2), NOT NULL, CHECK price >= 0)
5. THE Products_Table SHALL have column `category_id` (UUID, FOREIGN KEY to categories.id, NOT NULL)
6. THE Products_Table SHALL have column `image_url` (TEXT, NOT NULL)
7. THE Products_Table SHALL have column `stock` (INTEGER, NOT NULL, DEFAULT 0, CHECK stock >= 0)
8. THE Products_Table SHALL have column `features` (TEXT[], DEFAULT '{}')
9. THE Products_Table SHALL have column `rating` (DECIMAL(2,1), DEFAULT 0, CHECK rating >= 0 AND rating <= 5)
10. THE Products_Table SHALL have column `reviews` (INTEGER, DEFAULT 0, CHECK reviews >= 0)
11. THE Products_Table SHALL have column `created_at` (TIMESTAMPTZ, DEFAULT NOW())
12. THE Products_Table SHALL have column `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
13. THE Products_Table SHALL have column `deleted_at` (TIMESTAMPTZ, NULL)
14. THE Products_Table SHALL have an index on `category_id` for efficient filtering
15. THE Products_Table SHALL have an index on `deleted_at` for soft delete queries
16. THE Products_Table SHALL have a trigger to update `updated_at` on row modification

### Requirement 2: Categories Database Schema

**User Story:** As a system, I need a categories table to organize products, so that customers can browse by product type.

#### Acceptance Criteria

1. THE Categories_Table SHALL have column `id` (UUID, primary key, auto-generated)
2. THE Categories_Table SHALL have column `name` (TEXT, NOT NULL, UNIQUE)
3. THE Categories_Table SHALL have column `slug` (TEXT, NOT NULL, UNIQUE)
4. THE Categories_Table SHALL have column `description` (TEXT)
5. THE Categories_Table SHALL have column `created_at` (TIMESTAMPTZ, DEFAULT NOW())
6. THE Categories_Table SHALL have column `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
7. THE Categories_Table SHALL have an index on `slug` for URL-based lookups
8. THE Categories_Table SHALL have a trigger to update `updated_at` on row modification

### Requirement 3: Row Level Security Policies

**User Story:** As a system administrator, I need RLS policies to control data access, so that only authorized users can modify products.

#### Acceptance Criteria

1. THE Products_Table SHALL have RLS policy allowing SELECT for all users (public read access)
2. THE Products_Table SELECT policy SHALL filter out rows WHERE deleted_at IS NOT NULL
3. THE Products_Table SHALL have RLS policy allowing INSERT only for users WHERE role = 'admin'
4. THE Products_Table SHALL have RLS policy allowing UPDATE only for users WHERE role = 'admin'
5. THE Products_Table SHALL have RLS policy allowing DELETE only for users WHERE role = 'admin'
6. THE Categories_Table SHALL have RLS policy allowing SELECT for all users
7. THE Categories_Table SHALL have RLS policy allowing INSERT, UPDATE, DELETE only for users WHERE role = 'admin'
8. THE RLS_Policy SHALL reference the `profiles.role` column for authorization checks

### Requirement 4: Admin Product Creation

**User Story:** As an admin, I want to create new products, so that I can add inventory to the catalog.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Create Product" button at `/admin/products`
2. WHEN the admin clicks "Create Product", THE Admin_Panel SHALL open a product creation form modal
3. THE product form SHALL include fields: name (required), description (required), price (required, number), category (required, dropdown), image_url (required, text or upload), stock (required, number >= 0), features (optional, array)
4. THE product form SHALL validate that name is not empty and has max length 200
5. THE product form SHALL validate that description is not empty and has max length 2000
6. THE product form SHALL validate that price is a positive number with max 2 decimal places
7. THE product form SHALL validate that stock is a non-negative integer
8. THE product form SHALL use Zod schema for validation
9. WHEN the admin submits valid data, THE Admin_Panel SHALL call Supabase insert on Products_Table
10. WHEN the insert succeeds, THE Admin_Panel SHALL display a success toast and refresh the product list
11. WHEN the insert fails, THE Admin_Panel SHALL display an error toast with the failure reason
12. THE product form SHALL disable the submit button while the request is in progress

### Requirement 5: Admin Product Editing

**User Story:** As an admin, I want to edit existing products, so that I can update product information and pricing.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display an "Edit" button for each product in the list
2. WHEN the admin clicks "Edit", THE Admin_Panel SHALL open the product form modal pre-filled with current data
3. THE product form SHALL allow editing all fields except `id`, `created_at`, `updated_at`, `deleted_at`
4. THE product form SHALL apply the same validation rules as product creation
5. WHEN the admin submits valid changes, THE Admin_Panel SHALL call Supabase update on Products_Table
6. THE update SHALL set `updated_at` to the current timestamp via database trigger
7. WHEN the update succeeds, THE Admin_Panel SHALL display a success toast and refresh the product list
8. WHEN the update fails, THE Admin_Panel SHALL display an error toast and preserve the form state
9. THE Admin_Panel SHALL use Optimistic_UI to immediately reflect changes before server confirmation
10. WHEN the optimistic update fails, THE Admin_Panel SHALL rollback the UI to the previous state

### Requirement 6: Admin Product Soft Delete

**User Story:** As an admin, I want to delete products without losing historical data, so that I can hide products while preserving order history.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Delete" button for each product in the list
2. WHEN the admin clicks "Delete", THE Admin_Panel SHALL display a confirmation dialog
3. THE confirmation dialog SHALL warn "This will hide the product from customers. Historical data will be preserved."
4. WHEN the admin confirms deletion, THE Admin_Panel SHALL call Supabase update setting `deleted_at` to NOW()
5. THE Soft_Delete SHALL NOT remove the row from Products_Table
6. WHEN the soft delete succeeds, THE Admin_Panel SHALL display a success toast and remove the product from the list
7. WHEN the soft delete fails, THE Admin_Panel SHALL display an error toast
8. THE Admin_Panel SHALL NOT display soft-deleted products in the product list by default
9. THE Admin_Panel SHALL optionally provide a "Show Deleted" toggle to view soft-deleted products
10. WHEN viewing deleted products, THE Admin_Panel SHALL display a "Restore" button to set `deleted_at` to NULL

### Requirement 7: Admin Product List with Pagination

**User Story:** As an admin, I want to view all products with pagination, so that I can manage large product catalogs efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display products in a table or grid layout at `/admin/products`
2. THE Admin_Panel SHALL display columns: image thumbnail, name, category, price, stock, actions
3. THE Admin_Panel SHALL load products in pages of 20 items
4. THE Admin_Panel SHALL display pagination controls (Previous, Next, page numbers)
5. THE Admin_Panel SHALL display total product count
6. WHEN the admin clicks a page number, THE Admin_Panel SHALL load that page without full page reload
7. THE Admin_Panel SHALL display a loading skeleton while fetching products
8. THE Admin_Panel SHALL sort products by `created_at DESC` by default (newest first)
9. THE Admin_Panel SHALL filter out products WHERE deleted_at IS NOT NULL by default
10. THE Admin_Panel SHALL display "No products found" when the list is empty

### Requirement 8: Customer Product Listing with Filters

**User Story:** As a customer, I want to browse products with filters, so that I can find items that match my preferences.

#### Acceptance Criteria

1. THE Product_Listing SHALL display all non-deleted products at `/products`
2. THE Product_Listing SHALL use the existing SearchFilters component
3. THE Product_Listing SHALL use the existing AnimatedGrid component for layout
4. THE Product_Listing SHALL use the existing ProductCard component for each product
5. THE Product_Listing SHALL filter products by category when a category is selected
6. THE Product_Listing SHALL filter products by price range when price filters are applied
7. THE Product_Listing SHALL filter products by minimum rating when rating filter is applied
8. THE Product_Listing SHALL apply multiple filters simultaneously (AND logic)
9. THE Product_Listing SHALL display "No products found" when filters return empty results
10. THE Product_Listing SHALL update the URL query parameters when filters change
11. THE Product_Listing SHALL preserve filter state on page reload from URL parameters
12. THE Product_Listing SHALL display a loading skeleton while fetching filtered products

### Requirement 9: Customer Product Search with Debounce

**User Story:** As a customer, I want to search for products by name, so that I can quickly find specific items.

#### Acceptance Criteria

1. THE Product_Listing SHALL display a search input field via SearchFilters component
2. WHEN the customer types in the search field, THE Product_Listing SHALL wait 300ms before executing the search
3. THE Search_Debounce SHALL cancel previous pending searches when new input is received
4. THE Product_Listing SHALL search products WHERE name ILIKE '%{search_term}%' OR description ILIKE '%{search_term}%'
5. THE Product_Listing SHALL update the URL with `?search={term}` parameter
6. THE Product_Listing SHALL display search results using the same grid layout
7. THE Product_Listing SHALL combine search with active filters (AND logic)
8. WHEN the search term is cleared, THE Product_Listing SHALL display all products (respecting other filters)
9. THE Product_Listing SHALL display search term count in the UI (e.g., "24 results for 'jersey'")
10. THE search SHALL be case-insensitive

### Requirement 10: Product Sorting

**User Story:** As a customer, I want to sort products by different criteria, so that I can browse in my preferred order.

#### Acceptance Criteria

1. THE Product_Listing SHALL provide sort options via SearchFilters component: Latest, Oldest, Price (Low to High), Price (High to Low)
2. WHEN "Latest" is selected, THE Product_Listing SHALL sort by `created_at DESC`
3. WHEN "Oldest" is selected, THE Product_Listing SHALL sort by `created_at ASC`
4. WHEN "Price (Low to High)" is selected, THE Product_Listing SHALL sort by `price ASC`
5. WHEN "Price (High to Low)" is selected, THE Product_Listing SHALL sort by `price DESC`
6. THE Product_Listing SHALL update the URL with `?sort={option}` parameter
7. THE Product_Listing SHALL preserve sort order when applying filters or search
8. THE Product_Listing SHALL default to "Latest" when no sort parameter is present

### Requirement 11: Product Detail Page

**User Story:** As a customer, I want to view complete product information, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. THE Product_Detail SHALL display at route `/products/[id]`
2. WHEN a customer clicks a ProductCard, THE Product_Listing SHALL navigate to Product_Detail
3. THE Product_Detail SHALL fetch product data by id from Products_Table
4. THE Product_Detail SHALL display: product image, name, category, price, description, features list, stock status, rating, review count
5. WHEN the product is not found, THE Product_Detail SHALL display a 404 page
6. WHEN the product has `deleted_at` set, THE Product_Detail SHALL display a 404 page
7. THE Product_Detail SHALL display "Add to Cart" and "Add to Wishlist" buttons via ClientActions component
8. THE Product_Detail SHALL display "Out of Stock" badge WHEN stock = 0
9. THE Product_Detail SHALL display "Only X left" badge WHEN stock > 0 AND stock <= 5
10. THE Product_Detail SHALL display a "Back to Products" link
11. THE Product_Detail SHALL set page metadata (title, description) for SEO
12. THE Product_Detail SHALL display a loading skeleton while fetching product data

### Requirement 12: Stock Management and Validation

**User Story:** As a system, I need to track and validate stock levels, so that customers cannot purchase unavailable products.

#### Acceptance Criteria

1. THE Products_Table SHALL enforce stock >= 0 via CHECK constraint
2. THE Admin_Panel SHALL allow admins to set stock to any non-negative integer
3. THE Product_Listing SHALL display stock status on ProductCard component
4. THE Product_Detail SHALL disable "Add to Cart" button WHEN stock = 0
5. THE Product_Detail SHALL display "Out of Stock" message WHEN stock = 0
6. THE Product_Detail SHALL display "Low Stock" warning WHEN stock > 0 AND stock <= 5
7. WHEN a product is added to cart, THE system SHALL NOT decrement stock (stock decrements on order completion)
8. THE Admin_Panel SHALL display current stock count for each product
9. THE Admin_Panel SHALL allow bulk stock updates (future enhancement, not required for MVP)

### Requirement 13: Category Management

**User Story:** As an admin, I want to manage product categories, so that products are properly organized.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a category management interface at `/admin/categories` (or within products page)
2. THE Admin_Panel SHALL allow creating new categories with name and slug
3. THE Admin_Panel SHALL validate that category name is unique
4. THE Admin_Panel SHALL auto-generate slug from name (lowercase, hyphenated)
5. THE Admin_Panel SHALL allow editing category name and description
6. THE Admin_Panel SHALL prevent deleting categories that have associated products
7. THE Admin_Panel SHALL display product count for each category
8. THE Product_Listing SHALL fetch categories from Categories_Table for filter dropdown
9. THE Product_Listing SHALL display "All Categories" as default filter option
10. WHEN a category is selected, THE Product_Listing SHALL filter products WHERE category_id = selected_category_id

### Requirement 14: Image Upload and Validation

**User Story:** As an admin, I want to upload product images, so that products have visual representation.

#### Acceptance Criteria

1. THE Admin_Panel product form SHALL provide an image upload field
2. THE Image_Upload SHALL accept file types: JPEG, PNG, WebP
3. THE Image_Upload SHALL validate file size <= 5MB
4. WHEN a file exceeds 5MB, THE Image_Upload SHALL display an error message
5. WHEN a non-image file is selected, THE Image_Upload SHALL display an error message
6. THE Image_Upload SHALL upload to Cloudinary or Supabase Storage
7. THE Image_Upload SHALL display upload progress indicator
8. WHEN upload succeeds, THE Image_Upload SHALL set the returned URL in the `image_url` field
9. WHEN upload fails, THE Image_Upload SHALL display an error toast
10. THE Admin_Panel SHALL display image preview after upload
11. THE Admin_Panel SHALL allow replacing the image by uploading a new file
12. THE Image_Upload SHALL compress images to max 1920x1080 resolution before upload (optional optimization)

### Requirement 15: Responsive Design

**User Story:** As a user on any device, I want the product catalog to be responsive, so that I can browse on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE Product_Listing SHALL use responsive grid layout: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
2. THE Product_Detail SHALL stack image and info vertically on mobile, side-by-side on desktop
3. THE SearchFilters SHALL stack search and sort controls vertically on mobile
4. THE Admin_Panel SHALL be responsive with horizontal scrolling for product table on mobile
5. THE product form modal SHALL be scrollable on small screens
6. THE ProductCard component SHALL maintain aspect ratio across all screen sizes
7. THE category filter buttons SHALL scroll horizontally on mobile without wrapping

### Requirement 16: Error Handling and Loading States

**User Story:** As a user, I want clear feedback during operations, so that I understand the system state.

#### Acceptance Criteria

1. THE Product_Listing SHALL display a loading skeleton while fetching products
2. THE Product_Detail SHALL display a loading skeleton while fetching product data
3. THE Admin_Panel SHALL display loading indicators during create/update/delete operations
4. WHEN a database operation fails, THE system SHALL display a toast notification with error message
5. WHEN the Supabase_Client connection fails, THE system SHALL display a connection error message
6. WHEN a product fetch returns 404, THE Product_Detail SHALL display a "Product not found" page
7. WHEN filters return no results, THE Product_Listing SHALL display "No products match your filters" with a reset button
8. THE Admin_Panel SHALL disable form submit buttons during pending operations
9. THE Admin_Panel SHALL preserve form state when operations fail
10. THE system SHALL log errors to console for debugging (not exposed to users)

### Requirement 17: Optimistic UI Updates

**User Story:** As an admin, I want immediate feedback when I make changes, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN an admin creates a product, THE Admin_Panel SHALL immediately add it to the list with a loading indicator
2. WHEN the create operation fails, THE Admin_Panel SHALL remove the optimistic entry and display an error
3. WHEN an admin edits a product, THE Admin_Panel SHALL immediately update the list item
4. WHEN the update operation fails, THE Admin_Panel SHALL rollback to the previous state and display an error
5. WHEN an admin deletes a product, THE Admin_Panel SHALL immediately remove it from the list
6. WHEN the delete operation fails, THE Admin_Panel SHALL restore the product and display an error
7. THE Optimistic_UI updates SHALL complete within 100ms of user action
8. THE rollback on failure SHALL complete within 100ms of error detection

### Requirement 18: Integration with Existing Components

**User Story:** As a developer, I want to reuse existing components, so that the UI is consistent and maintainable.

#### Acceptance Criteria

1. THE Product_Listing SHALL use the existing ProductCard component without modification
2. THE Product_Listing SHALL use the existing SearchFilters component without modification
3. THE Product_Listing SHALL use the existing AnimatedGrid component for layout animations
4. THE Product_Detail SHALL use the existing ClientActions component for cart/wishlist buttons
5. THE Admin_Panel SHALL use existing UI components from the design system (buttons, inputs, modals)
6. THE system SHALL use existing toast notification system (Sonner)
7. THE system SHALL use existing authentication context (useAuth hook)
8. THE system SHALL follow existing TypeScript patterns and file structure

### Requirement 19: SEO and Metadata

**User Story:** As a platform owner, I want proper SEO metadata, so that products are discoverable via search engines.

#### Acceptance Criteria

1. THE Product_Listing SHALL set page title "Arsenal | Agon"
2. THE Product_Listing SHALL set meta description "A coleção de elite de itens da Seleção Brasileira"
3. THE Product_Detail SHALL set page title "{product_name} | Agon"
4. THE Product_Detail SHALL set meta description to product description (truncated to 160 chars)
5. THE Product_Detail SHALL include Open Graph tags for social sharing
6. THE Product_Detail SHALL include product schema markup (JSON-LD) for rich snippets
7. THE Product_Listing SHALL include canonical URL
8. THE Product_Detail SHALL include canonical URL

### Requirement 20: Performance Optimization

**User Story:** As a user, I want fast page loads, so that I can browse products without delays.

#### Acceptance Criteria

1. THE Product_Listing SHALL use server-side rendering (SSR) for initial page load
2. THE Product_Listing SHALL cache product data with `cache: 'no-store'` for fresh data (or implement revalidation strategy)
3. THE Product_Listing SHALL lazy load images using Next.js Image component or native lazy loading
4. THE Product_Detail SHALL prefetch product data on ProductCard hover (optional optimization)
5. THE SearchFilters SHALL debounce search input to reduce API calls
6. THE Admin_Panel SHALL paginate product list to avoid loading all products at once
7. THE system SHALL use database indexes on frequently queried columns (category_id, deleted_at)
8. THE Product_Listing SHALL render within 2 seconds on 3G connection (target, not strict requirement)

## Correctness Properties

### Property 1: Stock Non-Negativity (Invariant)

**Property:** For all products, the stock value SHALL always be >= 0.

**Test Strategy:** Property-based test that generates random stock updates and verifies the database constraint prevents negative values.

### Property 2: Soft Delete Immutability (Invariant)

**Property:** For all soft-deleted products, the product data (name, price, description) SHALL remain unchanged after deletion.

**Test Strategy:** Property-based test that soft-deletes products and verifies all fields except `deleted_at` remain identical.

### Property 3: Category Foreign Key Integrity (Invariant)

**Property:** For all products, the `category_id` SHALL reference a valid category in the Categories_Table.

**Test Strategy:** Integration test that attempts to create products with invalid category_id and verifies the foreign key constraint prevents insertion.

### Property 4: Price Precision (Invariant)

**Property:** For all products, the price SHALL have at most 2 decimal places.

**Test Strategy:** Property-based test that generates random prices and verifies the database stores exactly 2 decimal places.

### Property 5: Search Debounce Idempotence (Idempotence)

**Property:** Typing the same search term multiple times SHALL produce the same results.

**Test Strategy:** Property-based test that executes the same search multiple times and verifies consistent results.

### Property 6: Filter Combination Commutativity (Confluence)

**Property:** Applying filters in different orders SHALL produce the same result set (e.g., category then price = price then category).

**Test Strategy:** Property-based test that applies filters in random orders and verifies result sets are identical.

### Property 7: RLS Policy Enforcement (Security)

**Property:** Non-admin users SHALL NOT be able to create, update, or delete products via direct database access.

**Test Strategy:** Integration test that attempts CRUD operations with non-admin user tokens and verifies RLS policies block unauthorized access.

### Property 8: Optimistic Update Rollback (Error Condition)

**Property:** When a product update fails, the UI SHALL rollback to the previous state within 100ms.

**Test Strategy:** Integration test that simulates server failures and measures rollback timing.

### Property 9: Pagination Consistency (Metamorphic)

**Property:** The total count of products across all pages SHALL equal the total product count in the database.

**Test Strategy:** Property-based test that fetches all pages and verifies the sum equals the database count.

### Property 10: Image URL Validity (Round Trip)

**Property:** For all uploaded images, the returned URL SHALL be accessible and return a valid image.

**Test Strategy:** Integration test that uploads images, fetches the URL, and verifies the response is a valid image file.

### Property 11: Soft Delete Visibility (Invariant)

**Property:** Soft-deleted products SHALL NOT appear in customer-facing Product_Listing or Product_Detail pages.

**Test Strategy:** Integration test that soft-deletes products and verifies they are not returned in public API endpoints.

### Property 12: Category Deletion Protection (Error Condition)

**Property:** Attempting to delete a category with associated products SHALL fail with a descriptive error.

**Test Strategy:** Integration test that creates products in a category, attempts to delete the category, and verifies the operation is blocked.

