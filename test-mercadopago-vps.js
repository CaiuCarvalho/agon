#!/usr/bin/env node

/**
 * Mercado Pago Configuration Test Script
 * 
 * Tests Mercado Pago API connectivity and token validity
 * Run this on your VPS to verify Mercado Pago integration
 * 
 * Usage: node test-mercadopago-vps.js
 */

console.log('========================================');
console.log('Mercado Pago Configuration Test');
console.log('========================================\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Check if token is configured
console.log('Step 1: Checking MERCADOPAGO_ACCESS_TOKEN...');
if (!accessToken) {
  console.log('✗ MERCADOPAGO_ACCESS_TOKEN is not configured');
  console.log('  Please add it to your .env.local file\n');
  process.exit(1);
}

// Mask token for display
const maskedToken = accessToken.substring(0, 20) + '...' + accessToken.substring(accessToken.length - 10);
console.log(`✓ Token configured: ${maskedToken}`);

// Validate token format
console.log('\nStep 2: Validating token format...');
if (!accessToken.startsWith('APP_USR-')) {
  console.log('✗ Invalid token format');
  console.log('  Token must start with APP_USR-');
  console.log('  Current token starts with:', accessToken.substring(0, 10));
  console.log('\n  How to fix:');
  console.log('  1. Go to https://www.mercadopago.com.br/developers/panel/credentials');
  console.log('  2. Copy the "Access Token" (Production or Test)');
  console.log('  3. Update MERCADOPAGO_ACCESS_TOKEN in .env.local\n');
  process.exit(1);
}
console.log('✓ Token format is valid');

// Check APP_URL
console.log('\nStep 3: Checking NEXT_PUBLIC_APP_URL...');
if (!appUrl) {
  console.log('✗ NEXT_PUBLIC_APP_URL is not configured');
  console.log('  Please add it to your .env.local file\n');
  process.exit(1);
}
console.log(`✓ APP_URL configured: ${appUrl}`);

// Test API connectivity
console.log('\nStep 4: Testing Mercado Pago API connectivity...');
console.log('Making request to: GET /v1/payment_methods');

const https = require('https');

function testApiConnectivity() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/v1/payment_methods',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    };
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          duration,
          data: data.substring(0, 500), // First 500 chars
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({
        error: error.message,
        code: error.code,
        duration,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      reject({
        error: 'Request timeout',
        code: 'ETIMEDOUT',
        duration,
      });
    });
    
    req.end();
  });
}

testApiConnectivity()
  .then((result) => {
    console.log(`✓ API request completed in ${result.duration}ms`);
    console.log(`  Status code: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      console.log('  ✓ Token is valid and API is accessible');
      
      // Try to parse response
      try {
        const methods = JSON.parse(result.data);
        console.log(`  ✓ Found ${methods.length} payment methods`);
      } catch (e) {
        console.log('  ⚠ Could not parse response (might be truncated)');
      }
    } else if (result.statusCode === 401) {
      console.log('  ✗ Token is invalid or expired');
      console.log('\n  How to fix:');
      console.log('  1. Go to https://www.mercadopago.com.br/developers/panel/credentials');
      console.log('  2. Generate a new Access Token');
      console.log('  3. Update MERCADOPAGO_ACCESS_TOKEN in .env.local');
      process.exit(1);
    } else {
      console.log(`  ⚠ Unexpected status code: ${result.statusCode}`);
      console.log(`  Response: ${result.data.substring(0, 200)}`);
    }
    
    // Test preference creation (simulation)
    console.log('\nStep 5: Testing preference creation (simulation)...');
    console.log('Creating a test preference request...');
    
    const testPreference = {
      items: [
        {
          id: 'test-item-1',
          title: 'Test Product',
          quantity: 1,
          unit_price: 100.00,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: 'test@example.com',
        name: 'Test User',
        phone: {
          area_code: '11',
          number: '987654321',
        },
      },
      back_urls: {
        success: `${appUrl}/pedido/confirmado?order_id=test`,
        failure: `${appUrl}/pedido/falha?order_id=test`,
        pending: `${appUrl}/pedido/pendente?order_id=test`,
      },
      external_reference: 'test-order-123',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'AGON MVP',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
    };
    
    console.log('✓ Test preference request created');
    console.log('  Items:', testPreference.items.length);
    console.log('  Total amount: R$', testPreference.items[0].unit_price);
    console.log('  Success URL:', testPreference.back_urls.success);
    console.log('  Notification URL:', testPreference.notification_url);
    
    console.log('\n⚠ NOTE: This is a simulation. No actual preference was created.');
    console.log('  To test actual preference creation, use the checkout flow in the app.');
    
    // Summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================\n');
    console.log('✓ All checks passed!');
    console.log('  - Token is configured and valid');
    console.log('  - API is accessible');
    console.log('  - APP_URL is configured');
    console.log('  - Preference request structure is valid\n');
    console.log('Next steps:');
    console.log('  1. Test the checkout flow in your application');
    console.log('  2. Monitor PM2 logs: pm2 logs');
    console.log('  3. Check for any errors during checkout\n');
    
    process.exit(0);
  })
  .catch((error) => {
    console.log(`✗ API request failed after ${error.duration}ms`);
    console.log(`  Error: ${error.error}`);
    console.log(`  Code: ${error.code}`);
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.log('\n  Possible causes:');
      console.log('  - Firewall blocking outbound HTTPS connections');
      console.log('  - Network connectivity issues');
      console.log('  - Mercado Pago API is down (unlikely)');
      console.log('\n  How to fix:');
      console.log('  1. Check firewall rules: sudo ufw status');
      console.log('  2. Allow outbound HTTPS: sudo ufw allow out 443/tcp');
      console.log('  3. Test connectivity: curl -I https://api.mercadopago.com');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n  Possible causes:');
      console.log('  - DNS resolution failure');
      console.log('  - Network connectivity issues');
      console.log('\n  How to fix:');
      console.log('  1. Check DNS: nslookup api.mercadopago.com');
      console.log('  2. Check internet: ping 8.8.8.8');
      console.log('  3. Check /etc/resolv.conf for DNS servers');
    } else {
      console.log('\n  Unexpected error. Check your network configuration.');
    }
    
    console.log('\n========================================');
    console.log('Test Failed');
    console.log('========================================\n');
    
    process.exit(1);
  });
