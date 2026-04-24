// GET /api/admin/categories — list all categories for the admin product form

import { NextRequest, NextResponse } from 'next/server';
import { validateAdmin, isApiError } from '@/modules/admin/services/adminService';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const adminResult = await validateAdmin(req);

  if (isApiError(adminResult)) {
    return NextResponse.json(
      { error: adminResult.message },
      { status: adminResult.code === 'UNAUTHORIZED' ? 401 : 403 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  return NextResponse.json(data);
}
