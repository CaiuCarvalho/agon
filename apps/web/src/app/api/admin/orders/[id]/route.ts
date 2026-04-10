// Admin Order Details API Endpoint
// GET /api/admin/orders/[id] - Get order details by ID

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { getOrderDetails } from '@/modules/admin/services/orderService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate admin access
  const adminResult = await validateAdmin(req);
  
  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }
  
  // Fetch order details
  const result = await getOrderDetails(params.id);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message },
      { status: result.error?.code === 'DATABASE_ERROR' ? 404 : 500 }
    );
  }
  
  return NextResponse.json(result.data);
}
