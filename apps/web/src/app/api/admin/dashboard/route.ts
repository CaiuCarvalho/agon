// Admin Dashboard API Endpoint
// GET /api/admin/dashboard - Fetch dashboard metrics

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { getDashboardMetrics } from '@/modules/admin/services/dashboardService';

export async function GET(req: NextRequest) {
  // Validate admin access
  const adminResult = await validateAdmin(req);
  
  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }
  
  // Fetch dashboard metrics
  const result = await getDashboardMetrics();
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json(result.data);
}
