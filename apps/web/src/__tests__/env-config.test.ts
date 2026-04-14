import { afterEach, describe, expect, it } from 'vitest';
import { ConfigurationError, getSupabaseServerConfig } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

const originalEnv = { ...process.env };

function setEnv(entries: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('Critical env configuration', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('accepts private SUPABASE_* vars when NEXT_PUBLIC_* are missing', () => {
    setEnv({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });

    const config = getSupabaseServerConfig();

    expect(config.url).toBe('https://example.supabase.co');
    expect(config.anonKey).toContain('eyJ');
  });

  it('throws a typed configuration error when service role key is required and missing', () => {
    setEnv({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    });

    expect(() => createAdminClient()).toThrowError(ConfigurationError);
  });
});
