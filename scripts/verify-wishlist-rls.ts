#!/usr/bin/env tsx
/**
 * Verification script for Task 2.3: Check if RLS policies exist for wishlist_items
 * This script verifies that the required RLS policies are present in the database.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyWishlistRLSPolicies() {
  console.log('🔍 Verifying RLS policies for wishlist_items table...\n');

  try {
    // Query to check RLS policies
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'wishlist_items');

    if (error) {
      console.error('❌ Error querying policies:', error.message);
      process.exit(1);
    }

    const requiredPolicies = [
      'wishlist_items_select_own',
      'wishlist_items_insert_own',
      'wishlist_items_delete_own',
    ];

    console.log(`Found ${policies?.length || 0} policies for wishlist_items:\n`);

    const foundPolicies = new Set(policies?.map(p => p.policyname) || []);

    let allPoliciesExist = true;

    for (const policyName of requiredPolicies) {
      if (foundPolicies.has(policyName)) {
        console.log(`✅ ${policyName}`);
        const policy = policies?.find(p => p.policyname === policyName);
        if (policy) {
          console.log(`   Command: ${policy.cmd}`);
          console.log(`   Using: ${policy.qual || 'N/A'}`);
          console.log(`   With Check: ${policy.with_check || 'N/A'}\n`);
        }
      } else {
        console.log(`❌ ${policyName} - NOT FOUND\n`);
        allPoliciesExist = false;
      }
    }

    if (allPoliciesExist) {
      console.log('\n✅ All required RLS policies exist for wishlist_items!');
      console.log('   Task 2.3 is complete.');
      process.exit(0);
    } else {
      console.log('\n❌ Some required RLS policies are missing!');
      console.log('   Task 2.3 needs to be completed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

verifyWishlistRLSPolicies();
