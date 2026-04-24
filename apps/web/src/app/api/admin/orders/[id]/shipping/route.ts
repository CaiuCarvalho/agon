// Admin Order Shipping API Endpoint
// PATCH /api/admin/orders/[id]/shipping - Update shipping information

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '../../../../../../modules/admin/services/adminService';
import { updateShipping } from '../../../../../../modules/admin/services/fulfillmentService';
import { shippingUpdateSchema } from '../../../../../../modules/admin/schemas';

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
  const validation = shippingUpdateSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  
  // Update shipping
  const result = await updateShipping(id, validation.data);
  
  if (!result.success) {
    // Map error codes to HTTP status codes
    const statusCode = 
      result.error?.code === 'NOT_FOUND' ? 404 :
      result.error?.code === 'PAYMENT_NOT_APPROVED' ? 400 :
      result.error?.code === 'INVALID_STATUS_PROGRESSION' ? 400 :
      result.error?.code === 'MISSING_TRACKING_INFO' ? 400 :
      result.error?.code === 'VALIDATION_ERROR' ? 400 :
      500;
    
    return NextResponse.json(
      { 
        error: result.error?.message,
        details: result.error?.details,
      },
      { status: statusCode }
    );
  }
  
  return NextResponse.json(result.data);
}
