/**
 * Environment Variable Validation
 * 
 * This module validates environment variables at application startup using Zod.
 * It ensures that all required environment variables are present and correctly formatted.
 * 
 * CRITICAL SECURITY RULES:
 * 1. SERVICE_ROLE_KEY must NEVER be exposed to the frontend
 * 2. Only NEXT_PUBLIC_* variables are accessible in client-side code
 * 3. Validation runs at build time and runtime
 * 
 * @module env
 */

import { z } from 'zod';

/**
 * Schema for client-side (public) environment variables
 * These variables are safe to expose to the browser
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .startsWith('https://', 'NEXT_PUBLIC_SUPABASE_URL must use HTTPS'),
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    .startsWith('eyJ', 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid JWT token'),
  
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required')
    .optional(),
  
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required')
    .optional(),
});

/**
 * Schema for server-side environment variables
 * These variables must NEVER be exposed to the client
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .startsWith('eyJ', 'SUPABASE_SERVICE_ROLE_KEY must be a valid JWT token')
    .optional(), // Optional because not all deployments need it
});

/**
 * Combined schema for all environment variables
 */
const envSchema = clientEnvSchema.merge(serverEnvSchema);

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate environment variables
 * 
 * This function should be called at application startup to ensure
 * all required environment variables are present and valid.
 * 
 * @throws {Error} If validation fails
 */
export function validateEnvironment(): void {
  // Check if we're on the client side
  const isClient = typeof window !== 'undefined';

  if (isClient) {
    // CLIENT-SIDE: Only validate public variables
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    };

    const result = clientEnvSchema.safeParse(clientEnv);

    if (!result.success) {
      console.error('❌ Invalid client environment variables:', result.error.flatten().fieldErrors);
      throw new Error(
        'Invalid client environment variables. Check console for details.'
      );
    }

    // CRITICAL SECURITY CHECK: Ensure SERVICE_ROLE_KEY is NOT accessible on client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('🚨 SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY is exposed to client!');
      throw new Error(
        'CRITICAL SECURITY ERROR: Service Role Key must never be exposed to the client. ' +
        'Only use NEXT_PUBLIC_* variables in client-side code.'
      );
    }
  } else {
    // SERVER-SIDE: Validate all variables
    const serverEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    const result = envSchema.safeParse(serverEnv);

    if (!result.success) {
      console.error('❌ Invalid server environment variables:', result.error.flatten().fieldErrors);
      throw new Error(
        'Invalid server environment variables. Check console for details.'
      );
    }

  }
}

/**
 * Get validated client environment variables
 * 
 * This function returns only the public environment variables that are
 * safe to use in client-side code.
 * 
 * @returns Validated client environment variables
 */
export function getClientEnv(): ClientEnv {
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  };

  return clientEnvSchema.parse(clientEnv);
}

// Validate environment on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed on server startup:', error);
    // Don't throw in production to allow graceful degradation
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }
}
