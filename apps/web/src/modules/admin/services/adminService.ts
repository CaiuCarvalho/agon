// Admin Authentication Service
// Provides admin validation middleware and authentication utilities

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { AdminUser, ApiError } from '../types';
import { isAdminRole } from '@/lib/auth/roles';

const adminEmailSchema = z.string().email();

/**
 * Validates if the current user is an admin with proper permissions
 * 
 * Security layers:
 * 1. Check authentication (user must be logged in)
 * 2. Check role (user.role must be 'admin')
 * 3. Check whitelist (user.email must be in ADMIN_EMAIL_PRIMARY or ADMIN_EMAIL_BACKUP)
 * 
 * @param req - Next.js request object
 * @returns AdminUser if valid, ApiError if invalid
 */
export async function validateAdmin(req: NextRequest): Promise<AdminUser | ApiError> {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    };
  }
  
  // Check role in profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profileError && user.user_metadata?.role !== 'admin') {
    console.log('[SECURITY] Profile not found:', {
      timestamp: new Date().toISOString(),
      user_email: user.email,
      endpoint: req.url,
      action: 'profile_not_found',
    });
    
    return {
      code: 'FORBIDDEN',
      message: 'Access denied',
    };
  }
  
  const isAdmin = isAdminRole({
    profileRole: profile?.role,
    metadataRole: user.user_metadata?.role,
  });

  if (!isAdmin) {
    console.log('[SECURITY] Non-admin access attempt:', {
      timestamp: new Date().toISOString(),
      user_email: user.email,
      endpoint: req.url,
      action: 'non_admin_access_attempt',
      role: profile?.role,
      metadata_role: user.user_metadata?.role,
    });
    
    return {
      code: 'FORBIDDEN',
      message: 'Admin access required',
    };
  }
  
  // Check whitelist
  const whitelist = [
    process.env.ADMIN_EMAIL_PRIMARY,
    process.env.ADMIN_EMAIL_BACKUP,
  ].filter(Boolean);
  
  const emailValidation = adminEmailSchema.safeParse(user.email);
  if (!emailValidation.success || !whitelist.includes(emailValidation.data)) {
    console.log('[SECURITY] Email not in whitelist:', {
      timestamp: new Date().toISOString(),
      user_email: user.email,
      endpoint: req.url,
      action: 'email_not_in_whitelist',
    });
    
    return {
      code: 'FORBIDDEN',
      message: 'Access denied',
    };
  }
  // All checks passed - return admin user
  return {
    id: user.id,
    email: user.email!,
    role: 'admin',
  };
}

/**
 * Helper to check if a result is an error
 */
export function isApiError(result: AdminUser | ApiError): result is ApiError {
  return 'code' in result && 'message' in result;
}
