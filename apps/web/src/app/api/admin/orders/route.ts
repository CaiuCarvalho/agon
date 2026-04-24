// Admin Orders API Endpoints
// GET /api/admin/orders - List orders with pagination and filtering

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '../../../../modules/admin/services/adminService';
import { listOrders } from '../../../../modules/admin/services/orderService';
import { orderFiltersSchema } from '../../../../modules/admin/schemas';

export async function GET(req: NextRequest) {
  // Validate admin access
  const adminResult = await validateAdmin(req);
  
  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }
  
  // Get query params
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const paymentStatus = searchParams.get('paymentStatus') || undefined;
  const shippingStatus = searchParams.get('shippingStatus') || undefined;
  const search = searchParams.get('search') || undefined;

  // Validate filters
  const validation = orderFiltersSchema.safeParse({
    page,
    pageSize,
    paymentStatus,
    shippingStatus,
    search,
  });
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid filters',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  
  // Fetch orders
  const result = await listOrders(validation.data);
  
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
