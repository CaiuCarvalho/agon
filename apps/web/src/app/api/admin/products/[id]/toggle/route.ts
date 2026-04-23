// Admin Product Toggle API Endpoint
// PATCH /api/admin/products/[id]/toggle - Toggle product soft delete

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '../../../../../../modules/admin/services/adminService';
import { toggleProduct } from '../../../../../../modules/admin/services/productService';

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
  
  // Toggle product
  const result = await toggleProduct(id);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(result.data);
}
