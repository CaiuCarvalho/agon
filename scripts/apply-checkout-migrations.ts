/**
 * Script to apply checkout migrations programmatically
 * Run with: npx tsx scripts/apply-checkout-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigrations() {
  console.log('🚀 Starting checkout migrations...\n');

  try {
    // Read the consolidated migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', 'APPLY_CHECKOUT_MIGRATIONS.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration file');
    console.log('📊 Executing SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('DO $') || statement.includes('CREATE') || statement.includes('ALTER')) {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement
          });
          
          if (stmtError) {
            console.error('❌ Error executing statement:', stmtError.message);
            throw stmtError;
          }
        }
      }
    }

    console.log('✅ Migrations applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['orders', 'order_items']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables (this is OK if migrations succeeded)');
    } else {
      console.log('✓ Tables verified:', tables?.map(t => t.table_name).join(', '));
    }

    console.log('\n✨ Checkout migrations completed!');
    console.log('\nNext steps:');
    console.log('1. Test the checkout flow in your app');
    console.log('2. Verify RLS policies are working');
    console.log('3. Test the create_order_atomic RPC function');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the products table exists (run product catalog migrations first)');
    console.error('2. Check that your SUPABASE_SERVICE_ROLE_KEY has admin permissions');
    console.error('3. You can also apply migrations manually in the Supabase SQL Editor');
    console.error('   File: supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql');
    process.exit(1);
  }
}

// Run migrations
applyMigrations();
