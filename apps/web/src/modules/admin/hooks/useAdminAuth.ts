// useAdminAuth Hook
// Frontend admin authentication guard

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminRole } from '@/lib/auth/roles';

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

      // Use getSession() instead of getUser() — reads from local cookie cache,
      // no network request needed (middleware already validated the session server-side)
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user;

      if (authError || !user) {
        router.push('/login?redirect=/admin');
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

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
