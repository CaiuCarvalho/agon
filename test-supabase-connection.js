/**
 * Test Supabase Connection
 * 
 * Run this on the VPS to test if Supabase is configured correctly:
 * node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }
  if (!supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    process.exit(1);
  }

  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);
  console.log('');

  // 2. Create Supabase client
  console.log('2️⃣ Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Client created\n');

  // 3. Test connection by fetching products
  console.log('3️⃣ Testing connection (fetching products)...');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      process.exit(1);
    }

    console.log('✅ Connection successful!');
    console.log(`   Found ${data?.length || 0} product(s)`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].name}`);
    }
    console.log('');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  // 4. Test auth by checking users
  console.log('4️⃣ Testing auth (checking if users exist)...');
  try {
    // Try to get session (should be null for this test)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth error:', error.message);
      process.exit(1);
    }

    console.log('✅ Auth is working');
    console.log(`   Current session: ${session ? 'Active' : 'None (expected)'}`);
    console.log('');
  } catch (err) {
    console.error('❌ Auth test failed:', err.message);
    process.exit(1);
  }

  // 5. Check if profiles table exists
  console.log('5️⃣ Checking if profiles table exists...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ profiles table does not exist!');
        console.log('   Run this SQL in Supabase to create it:');
        console.log('   See: supabase/migrations/create_profiles_table.sql');
      } else {
        console.error('❌ Error checking profiles:', error.message);
      }
      process.exit(1);
    }

    console.log('✅ profiles table exists');
    console.log(`   Found ${data?.length || 0} profile(s)`);
    console.log('');
  } catch (err) {
    console.error('❌ profiles check failed:', err.message);
    process.exit(1);
  }

  console.log('🎉 All tests passed! Supabase is configured correctly.\n');
}

testConnection().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
