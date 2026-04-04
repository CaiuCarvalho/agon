# Product Service Layer

## Overview

The Product Service Layer provides all CRUD operations for products with advanced features:

- **Full-text search** using PostgreSQL `to_tsvector` with Portuguese language support
- **Pagination** (offset-based)
- **Filtering** (category, price range, rating)
- **Sorting** (latest, oldest, price_asc, price_desc)
- **Soft delete** support
- **Optimistic locking** with `updated_at` validation
- **RLS policy** compliance
- **Image upload** to Cloudinary with validation and optimization

## Full-Text Search Implementation

### Critical Implementation Detail

The service uses **PostgreSQL full-text search with Portuguese language support** via `to_tsvector('portuguese', name)` and `plainto_tsquery('portuguese', searchTerm)` - **NOT ILIKE**.

This provides:
- Better performance with GIN indexes
- Language-specific stemming (e.g., "camisas" matches "camisa")
- Accent-insensitive search
- Better relevance ranking

### How It Works

When a search term is provided, the service:

1. Executes two separate queries using Supabase's `textSearch()` method:
   - One for the `name` column
   - One for the `description` column

2. Both queries use `config: 'portuguese'` which translates to:
   ```sql
   to_tsvector('portuguese', name) @@ plainto_tsquery('portuguese', searchTerm)
   ```

3. Results are merged and deduplicated by product ID

4. Sorting and pagination are applied in-memory

### Database Indexes

The following GIN indexes are required (already created in migration):

```sql
CREATE INDEX idx_products_name_search 
  ON products USING gin(to_tsvector('portuguese', name));

CREATE INDEX idx_products_description_search 
  ON products USING gin(to_tsvector('portuguese', description));
```

## API Reference

### `getProducts(filters)`

Get paginated products with optional filters.

**Parameters:**
```typescript
interface ProductFilters {
  search?: string;           // Full-text search term
  categoryId?: string;       // Filter by category UUID
  minPrice?: number;         // Minimum price filter
  maxPrice?: number;         // Maximum price filter
  minRating?: number;        // Minimum rating filter (0-5)
  sortBy?: 'latest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;             // Page number (default: 1)
  limit?: number;            // Items per page (default: 20)
}
```

**Returns:**
```typescript
interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Example:**
```typescript
const result = await getProducts({
  search: 'camisa',
  categoryId: 'uuid-here',
  minPrice: 50,
  maxPrice: 200,
  sortBy: 'price_asc',
  page: 1,
  limit: 20,
});
```

### `getProductById(id)`

Get a single product by ID.

**Parameters:**
- `id: string` - Product UUID

**Returns:**
- `Product | null` - Product object or null if not found

**Example:**
```typescript
const product = await getProductById('uuid-here');
```

### `createProduct(values)`

Create a new product.

**Parameters:**
```typescript
interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  features: string[];
}
```

**Returns:**
- `Product` - Created product with category join

**Example:**
```typescript
const product = await createProduct({
  name: 'Camisa Oficial',
  description: 'Camisa oficial da seleção',
  price: 299.90,
  categoryId: 'uuid-here',
  imageUrl: 'https://...',
  stock: 100,
  features: ['Tamanho M', 'Cor Amarela'],
});
```

### `updateProduct(id, values, currentUpdatedAt?)`

Update an existing product with optimistic locking.

**Parameters:**
- `id: string` - Product UUID
- `values: Partial<ProductFormValues>` - Fields to update
- `currentUpdatedAt?: string` - Current timestamp for optimistic locking

**Returns:**
- `Product` - Updated product with category join

**Throws:**
- Error if `currentUpdatedAt` doesn't match (concurrent modification)

**Example:**
```typescript
const product = await updateProduct(
  'uuid-here',
  { price: 249.90, stock: 95 },
  '2024-01-15T10:30:00Z' // Optional: for optimistic locking
);
```

### `softDeleteProduct(id)`

Soft delete a product (sets `deleted_at` timestamp).

**Parameters:**
- `id: string` - Product UUID

**Returns:**
- `void`

**Example:**
```typescript
await softDeleteProduct('uuid-here');
```

### `restoreProduct(id)`

Restore a soft-deleted product (sets `deleted_at` to NULL).

**Parameters:**
- `id: string` - Product UUID

**Returns:**
- `Product` - Restored product with category join

**Example:**
```typescript
const product = await restoreProduct('uuid-here');
```

### `getDeletedProducts()`

Get all soft-deleted products (admin only).

**Returns:**
- `Product[]` - Array of deleted products

**Example:**
```typescript
const deletedProducts = await getDeletedProducts();
```

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  const product = await getProductById('invalid-id');
} catch (error) {
  console.error(error.message); // "Failed to fetch product: ..."
}
```

## Optimistic Locking

The `updateProduct` function supports optimistic locking to prevent concurrent modifications:

```typescript
// Get current product
const product = await getProductById('uuid-here');

// Update with optimistic locking
try {
  const updated = await updateProduct(
    product.id,
    { price: 249.90 },
    product.updatedAt // Pass current timestamp
  );
} catch (error) {
  // Handle concurrent modification
  console.error('Product was modified by another user');
}
```

## RLS Policy Compliance

All queries respect Row Level Security policies:

- **Public read**: Non-deleted products only (`deleted_at IS NULL`)
- **Admin write**: Requires `profiles.role = 'admin'`

The service automatically filters deleted products in customer-facing queries.

## Data Transformation

The service automatically transforms database rows (snake_case) to TypeScript interfaces (camelCase):

**Database:**
```json
{
  "category_id": "uuid",
  "image_url": "https://...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**TypeScript:**
```json
{
  "categoryId": "uuid",
  "imageUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Testing

To test the service:

1. Ensure the database migration is applied
2. Verify GIN indexes exist
3. Test search with Portuguese terms
4. Test all CRUD operations
5. Test RLS policies with different user roles

## Performance Considerations

- **Search**: Uses GIN indexes for fast full-text search
- **Pagination**: Offset-based (consider cursor-based for large datasets)
- **Joins**: Category join is efficient with proper indexes
- **Caching**: Consider React Query for client-side caching

---

## Image Service

The Image Service handles product image uploads to Cloudinary with validation and optimization.

### Configuration

Set the following environment variables in `apps/web/.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### API Reference

#### `uploadImage(file, onProgress?)`

Upload an image to Cloudinary with validation and progress tracking.

**Parameters:**
- `file: File` - The image file to upload
- `onProgress?: (progress: number) => void` - Optional callback for upload progress (0-100)

**Returns:**
```typescript
interface ImageUploadResponse {
  url: string;        // Cloudinary secure URL
  publicId: string;   // Cloudinary public ID
  width: number;      // Image width in pixels
  height: number;     // Image height in pixels
}
```

**Validation:**
- File types: JPEG, PNG, WebP only
- Max file size: 5MB
- Uploads to folder: `agon/products`

**Example:**
```typescript
const handleUpload = async (file: File) => {
  try {
    const result = await imageService.uploadImage(file, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });
    console.log('Uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

#### `deleteImage(publicId)`

Delete an image from Cloudinary (requires server-side API route).

**Parameters:**
- `publicId: string` - The Cloudinary public ID

**Returns:**
- `void`

**Note:** This requires a server-side API route at `/api/images/delete` for security.

**Example:**
```typescript
await imageService.deleteImage('agon/products/abc123');
```

#### `getOptimizedUrl(url, options?)`

Generate an optimized Cloudinary URL with transformations.

**Parameters:**
- `url: string` - The original Cloudinary URL
- `options?: { width?: number; height?: number; quality?: number }`

**Returns:**
- `string` - Optimized URL with transformations

**Example:**
```typescript
const optimized = imageService.getOptimizedUrl(
  'https://res.cloudinary.com/demo/image/upload/v123/agon/products/sample.jpg',
  { width: 800, height: 600, quality: 85 }
);
// Returns: .../upload/w_800,h_600,c_fill,q_85,f_auto/agon/products/sample.jpg
```

#### `validateImageFile(file)`

Validate an image file before upload.

**Parameters:**
- `file: File` - The file to validate

**Returns:**
```typescript
{ success: boolean; error?: string }
```

**Example:**
```typescript
const validation = imageService.validateImageFile(file);
if (!validation.success) {
  console.error(validation.error);
}
```

#### `getImageDimensions(file)`

Get image dimensions from a file.

**Parameters:**
- `file: File` - The image file

**Returns:**
- `Promise<{ width: number; height: number }>`

**Example:**
```typescript
const dimensions = await imageService.getImageDimensions(file);
console.log(`Image size: ${dimensions.width}x${dimensions.height}`);
```

#### `createPreviewUrl(file)` / `revokePreviewUrl(url)`

Create and revoke object URLs for image previews.

**Example:**
```typescript
const previewUrl = imageService.createPreviewUrl(file);
// Use previewUrl in <img src={previewUrl} />
// When done:
imageService.revokePreviewUrl(previewUrl);
```

### Error Handling

The image service provides localized error messages in Portuguese:

- File too large: "Arquivo muito grande. O tamanho máximo é 5MB."
- Invalid format: "Formato não suportado. Use JPEG, PNG ou WebP."
- Upload failure: "Falha ao fazer upload da imagem. Tente novamente."

### Image Optimization

The `getOptimizedUrl` function automatically adds:
- Width/height transformations
- Quality optimization (default: 80)
- Auto format selection (`f_auto` - WebP for supported browsers)
- Crop mode (`c_fill`) when both dimensions are specified

This ensures optimal image delivery across different devices and network conditions.
