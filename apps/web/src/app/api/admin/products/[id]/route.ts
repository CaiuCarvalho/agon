// Admin Product API Endpoints
// PUT /api/admin/products/[id] - Update product

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { updateProduct } from '@/modules/admin/services/productService';
import { productSchema } from '@/modules/admin/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;
  
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
  
  // Update product
  const result = await updateProduct(id, validation.data);
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: result.error?.message,
        details: result.error?.details,
      },
      { status: result.error?.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }
  
  return NextResponse.json(result.data);
}
