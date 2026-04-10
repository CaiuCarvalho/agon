// useAdminAuth Hook
// Frontend admin authentication guard

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      // Check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile || profile.role !== 'admin') {
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
