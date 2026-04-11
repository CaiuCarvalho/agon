// useAdminAuth Hook
// Frontend admin authentication guard

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminRole } from '@/lib/auth/roles';

const AUTH_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    checkAdminAccess();
  }, []);
  
  const checkAdminAccess = async () => {
    try {
      const supabase = createClient();
      
      // Check authentication
      const { data: { user }, error: authError } = await withTimeout(
        supabase.auth.getUser(),
        AUTH_TIMEOUT_MS,
        'supabase.auth.getUser'
      );
      
      if (authError || !user) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      // Check role
      const profileQuery = supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      
      const { data: profile, error: profileError } = await withTimeout<{
        data: { role: string | null } | null;
        error: { message: string } | null;
      }>(
        profileQuery as PromiseLike<{
          data: { role: string | null } | null;
          error: { message: string } | null;
        }>,
        AUTH_TIMEOUT_MS,
        'profiles.role query'
      );
      
      const isAdmin = isAdminRole({
        profileRole: profile?.role,
        metadataRole: user.user_metadata?.role,
      });

      if (!isAdmin) {
        router.push('/');
        return;
      }
      
      // Check whitelist (client-side check only, backend is authoritative)
      const whitelist = [
        process.env.NEXT_PUBLIC_ADMIN_EMAIL_PRIMARY,
        process.env.NEXT_PUBLIC_ADMIN_EMAIL_BACKUP,
      ].filter(Boolean);
      
      // If whitelist is configured, check it
      if (whitelist.length > 0 && !whitelist.includes(user.email || '')) {
        router.push('/');
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error('[Admin Auth] Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, isAdmin };
}
