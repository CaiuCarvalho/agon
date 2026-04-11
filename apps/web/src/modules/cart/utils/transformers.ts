import type { CartItem } from "../types";

/**
 * Transform database row (snake_case) to CartItem (camelCase)
 */
export function transformCartItemRow(row: any): CartItem {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    size: row.size,
    priceSnapshot: parseFloat(row.price_snapshot),
    productNameSnapshot: row.product_name_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: row.product
      ? {
          id: row.product.id,
          name: row.product.name,
          description: row.product.description,
          price: parseFloat(row.product.price),
          categoryId: row.product.category_id,
          imageUrl: row.product.image_url,
          stock: row.product.stock,
          features: row.product.features || [],
          rating: parseFloat(row.product.rating || 0),
          reviews: row.product.reviews || 0,
          createdAt: row.product.created_at,
          updatedAt: row.product.updated_at,
          deletedAt: row.product.deleted_at,
        }
      : undefined,
  };
}

