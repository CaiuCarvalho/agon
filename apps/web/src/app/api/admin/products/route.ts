// Admin Products API Endpoints
// GET /api/admin/products - List products with pagination
// POST /api/admin/products - Create new product

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { listProducts, createProduct } from '@/modules/admin/services/productService';
import { productSchema } from '@/modules/admin/schemas';

export async function GET(req: NextRequest) {
  // Validate admin access
  const adminResult = await validateAdmin(req);
  
  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }
  
  // Get page from query params
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Fetch products
  const result = await listProducts(page);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  // Validate admin access
  const adminResult = await validateAdmin(req);
  
  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }
  
  // Parse and validate request body
  const body = await req.json();
  const validation = productSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  
  // Create product
  const result = await createProduct(validation.data);
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error?.message,
        details: result.error?.details,
      },
      { status: result.error?.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }
  
  return NextResponse.json(result.data, { status: 201 });
}
