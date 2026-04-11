import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function parseJwtRole(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof decoded?.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials for server operation');
  }

  const tokenRole = parseJwtRole(serviceRoleKey);
  if (tokenRole !== 'service_role') {
    throw new Error(
      `Invalid SUPABASE_SERVICE_ROLE_KEY role: expected service_role, got ${tokenRole || 'unknown'}`
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

