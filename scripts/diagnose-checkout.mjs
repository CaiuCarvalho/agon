#!/usr/bin/env node

/**
 * Checkout Diagnostic Script
 * 
 * Validates environment configuration and Supabase connectivity
 * for the checkout flow.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/web/.env.local
const envPath = resolve(__dirname, '../apps/web/.env.local');
console.log(`📁 Loading environment from: ${envPath}\n`);
config({ path: envPath });

console.log('🔍 Starting Checkout Diagnostic...\n');

// ============================================
// 1. VALIDATE ENVIRONMENT VARIABLES
// ============================================
console.log('📋 Step 1: Validating Environment Variables');
console.log('='.repeat(50));

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'MERCADOPAGO_ACCESS_TOKEN': process.env.MERCADOPAGO_ACCESS_TOKEN,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
};

let missingVars = [];
let invalidVars = [];

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.log(`❌ ${key}: MISSING`);
    missingVars.push(key);
  } else {
    // Validate format
    if (key.includes('SUPABASE_URL')) {
      if (!value.startsWith('https://')) {
        console.log(`⚠️  ${key}: INVALID (must start with https://)`);
        invalidVars.push(key);
      } else {
        console.log(`✅ ${key}: ${value.substring(0, 30)}...`);
      }
    } else if (key.includes('ANON_KEY')) {
      if (!value.startsWith('eyJ')) {
        console.log(`⚠️  ${key}: INVALID (must be a JWT token starting with eyJ)`);
        invalidVars.push(key);
      } else {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
      }
    } else if (key === 'MERCADOPAGO_ACCESS_TOKEN') {
      if (!value.startsWith('APP_USR-')) {
        console.log(`⚠️  ${key}: INVALID (must start with APP_USR-)`);
        invalidVars.push(key);
      } else {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
      }
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  }
}

console.log('');

if (missingVars.length > 0) {
  console.log(`🚨 CRITICAL: ${missingVars.length} required environment variable(s) missing:`);
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Solution: Add these variables to apps/web/.env.local\n');
  process.exit(1);
}

if (invalidVars.length > 0) {
  console.log(`⚠️  WARNING: ${invalidVars.length} environment variable(s) have invalid format:`);
  invalidVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Solution: Check the format of these variables in apps/web/.env.local\n');
  process.exit(1);
}

console.log('✅ All required environment variables are present and valid\n');

// ============================================
// 2. TEST SUPABASE CONNECTION
// ============================================
console.log('📋 Step 2: Testing Supabase Connection');
console.log('='.repeat(50));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

try {
  console.log('🔌 Connecting to Supabase...');
  
  // Test 1: Check if we can query products table
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name')
    .limit(1);
  
  if (productsError) {
    console.log(`❌ Failed to query products table: ${productsError.message}`);
    console.log('💡 Solution: Check RLS policies on products table');
    process.exit(1);
  }
  
  console.log(`✅ Successfully queried products table (${products?.length || 0} rows)`);
  
  // Test 2: Check if we can query cart_items table (requires auth)
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    console.log('⚠️  No active session - skipping cart_items test');
    console.log('💡 This is normal for server-side diagnostic');
  } else {
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1);
    
    if (cartError) {
      console.log(`❌ Failed to query cart_items table: ${cartError.message}`);
      console.log('💡 Solution: Check RLS policies on cart_items table');
    } else {
      console.log(`✅ Successfully queried cart_items table (${cartItems?.length || 0} rows)`);
    }
  }
  
  console.log('✅ Supabase connection is working\n');
  
} catch (error) {
  console.log(`❌ Supabase connection failed: ${error.message}`);
  console.log('💡 Solution: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

// ============================================
// 3. VALIDATE MERCADO PAGO TOKEN
// ============================================
console.log('📋 Step 3: Validating Mercado Pago Token');
console.log('='.repeat(50));

try {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  console.log('🔌 Testing Mercado Pago API...');
  
  const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    console.log(`❌ Mercado Pago API returned status ${response.status}`);
    const errorText = await response.text();
    console.log(`   Error: ${errorText.substring(0, 200)}`);
    console.log('💡 Solution: Check if MERCADOPAGO_ACCESS_TOKEN is valid and not expired\n');
    process.exit(1);
  }
  
  const data = await response.json();
  console.log(`✅ Mercado Pago API is accessible (${data.length} payment methods available)`);
  console.log('✅ MERCADOPAGO_ACCESS_TOKEN is valid\n');
  
} catch (error) {
  console.log(`❌ Failed to connect to Mercado Pago API: ${error.message}`);
  console.log('💡 Solution: Check internet connection and MERCADOPAGO_ACCESS_TOKEN\n');
  process.exit(1);
}

// ============================================
// 4. SUMMARY
// ============================================
console.log('📋 Diagnostic Summary');
console.log('='.repeat(50));
console.log('✅ Environment variables: OK');
console.log('✅ Supabase connection: OK');
console.log('✅ Mercado Pago API: OK');
console.log('\n🎉 All checks passed! Checkout should be working.\n');
console.log('💡 If you still experience issues:');
console.log('   1. Check browser console for client-side errors');
console.log('   2. Check server logs for runtime errors');
console.log('   3. Verify user is authenticated before accessing checkout');
console.log('   4. Verify cart has items before accessing checkout\n');
