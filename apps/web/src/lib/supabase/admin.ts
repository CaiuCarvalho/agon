import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ConfigurationError, getSupabaseServerConfig } from '@/lib/env';

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
  const { url: supabaseUrl, serviceRoleKey } = getSupabaseServerConfig({ requireServiceRole: true });

  const tokenRole = parseJwtRole(serviceRoleKey);
  if (tokenRole !== 'service_role') {
    throw new ConfigurationError(
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

