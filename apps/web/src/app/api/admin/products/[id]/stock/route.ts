// Admin Product Stock API Endpoint
// PATCH /api/admin/products/[id]/stock - Update product stock

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { updateStock } from '@/modules/admin/services/productService';
import { stockUpdateSchema } from '@/modules/admin/schemas';

export async function PATCH(
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
  const validation = stockUpdateSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  
  // Update stock
  const result = await updateStock(id, validation.data);
  
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
