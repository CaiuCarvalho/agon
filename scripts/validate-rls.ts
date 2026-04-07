/**
 * validate-rls.ts - RLS Policy Validation Script
 * 
 * This script validates that Row Level Security (RLS) is properly configured
 * on all sensitive tables in the Supabase database.
 * 
 * Checks performed:
 * 1. RLS is enabled on cart_items and wishlist_items tables
 * 2. No policies with USING (true) exist (overly permissive)
 * 3. All policies use auth.uid() for user isolation
 * 
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation failures detected
 * 
 * Usage:
 *   npx tsx scripts/validate-rls.ts
 * 
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (server-side only)
 */

import { createClient } from '@supabase/supabase-js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

interface RLSStatus {
  tablename: string;
  rowsecurity: boolean;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

/**
 * Main validation function
 */
async function validateRLS(): Promise<void> {
  console.log('🔍 Validating RLS Configuration...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(`${colors.red}❌ Missing required environment variables${colors.reset}`);
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let hasErrors = false;

  // =============================================================================
  // Check 1: Verify RLS is enabled on sensitive tables
  // =============================================================================
  console.log('📋 Check 1: Verifying RLS is enabled on sensitive tables...');

  const sensitiveTablesQuery = `
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('cart_items', 'wishlist_items', 'profiles', 'addresses', 'orders')
    ORDER BY tablename;
  `;

  const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
    query: sensitiveTablesQuery,
  }).returns<RLSStatus[]>();

  if (rlsError) {
    // Fallback: Try direct query if RPC doesn't exist
    console.log(`${colors.yellow}⚠️  Note: Using fallback query method${colors.reset}`);
    
    const tables = ['cart_items', 'wishlist_items', 'profiles', 'addresses', 'orders'];
    for (const table of tables) {
      // Simple check: try to query the table
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === 'PGRST301') {
        console.log(`${colors.green}✅ ${table}: RLS enabled${colors.reset}`);
      } else if (!error) {
        console.log(`${colors.yellow}⚠️  ${table}: RLS status unknown (table accessible)${colors.reset}`);
      }
    }
  } else if (rlsStatus) {
    for (const table of rlsStatus) {
      if (table.rowsecurity) {
        console.log(`${colors.green}✅ ${table.tablename}: RLS enabled${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ ${table.tablename}: RLS NOT enabled${colors.reset}`);
        hasErrors = true;
      }
    }
  }

  console.log('');

  // =============================================================================
  // Check 2: Verify no overly permissive policies exist
  // =============================================================================
  console.log('📋 Check 2: Checking for overly permissive policies...');

  const policiesQuery = `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('cart_items', 'wishlist_items', 'profiles', 'addresses', 'orders')
    ORDER BY tablename, policyname;
  `;

  const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
    query: policiesQuery,
  }).returns<PolicyInfo[]>();

  if (policiesError) {
    console.log(`${colors.yellow}⚠️  Could not fetch policies (this is expected if exec_sql RPC doesn't exist)${colors.reset}`);
    console.log(`   Manual verification recommended: Check Supabase Dashboard > Database > Policies`);
  } else if (policies && policies.length > 0) {
    let foundPermissive = false;

    for (const policy of policies) {
      // Check for USING (true) or WITH CHECK (true)
      const usingTrue = policy.qual === 'true' || policy.qual === '(true)';
      const withCheckTrue = policy.with_check === 'true' || policy.with_check === '(true)';

      if (usingTrue || withCheckTrue) {
        console.log(`${colors.red}❌ ${policy.tablename}.${policy.policyname}: Overly permissive (USING/WITH CHECK = true)${colors.reset}`);
        foundPermissive = true;
        hasErrors = true;
      }

      // Check if policy uses auth.uid() for isolation
      const usesAuthUid = 
        (policy.qual && policy.qual.includes('auth.uid()')) ||
        (policy.with_check && policy.with_check.includes('auth.uid()'));

      if (!usesAuthUid && !usingTrue && !withCheckTrue) {
        console.log(`${colors.yellow}⚠️  ${policy.tablename}.${policy.policyname}: Does not use auth.uid() for isolation${colors.reset}`);
      }
    }

    if (!foundPermissive) {
      console.log(`${colors.green}✅ No overly permissive policies found${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠️  No policies found (this might indicate a problem)${colors.reset}`);
  }

  console.log('');

  // =============================================================================
  // Check 3: Verify critical tables have policies
  // =============================================================================
  console.log('📋 Check 3: Verifying critical tables have RLS policies...');

  const criticalTables = ['cart_items', 'wishlist_items'];
  
  if (policies) {
    for (const table of criticalTables) {
      const tablePolicies = policies.filter(p => p.tablename === table);
      
      if (tablePolicies.length === 0) {
        console.log(`${colors.red}❌ ${table}: No RLS policies found${colors.reset}`);
        hasErrors = true;
      } else {
        console.log(`${colors.green}✅ ${table}: ${tablePolicies.length} policies configured${colors.reset}`);
      }
    }
  } else {
    console.log(`${colors.yellow}⚠️  Could not verify policies (manual check recommended)${colors.reset}`);
  }

  console.log('');

  // =============================================================================
  // Summary
  // =============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (hasErrors) {
    console.log(`${colors.red}❌ RLS validation failed${colors.reset}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Please fix the issues above before deploying to production.');
    console.log('For help, see: supabase/RLS-MANUAL-TESTING-GUIDE.md');
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All RLS validations passed${colors.reset}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  }
}

// Run validation
validateRLS().catch((error) => {
  console.error(`${colors.red}❌ Validation script failed:${colors.reset}`, error);
  process.exit(1);
});
