/**
 * Test Mercado Pago API connectivity and response time
 * 
 * Run: node test-mercadopago-timeout.js
 */

const https = require('https');

const MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-854979957979936-040618-8c13ee19d91e882016b9585b019b5072-3319595850';
const TIMEOUT_MS = 25000; // Same as configured in mercadoPagoService.ts

console.log('========================================');
console.log('Testing Mercado Pago API connectivity');
console.log('========================================\n');

// Test 1: Simple GET request to check API availability
function testApiAvailability() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log('[TEST 1] Checking API availability...');
    
    const options = {
      hostname: 'api.mercadopago.com',
      path: '/v1/payment_methods',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT_MS,
    };
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✓ API is reachable (${duration}ms)`);
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response size: ${data.length} bytes\n`);
        resolve({ success: true, duration, status: res.statusCode });
      });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`✗ Request timed out after ${duration}ms\n`);
      req.destroy();
      resolve({ success: false, duration, error: 'TIMEOUT' });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`✗ Request failed after ${duration}ms`);
      console.log(`  Error: ${error.message}`);
      console.log(`  Code: ${error.code}\n`);
      resolve({ success: false, duration, error: error.code || error.message });
    });
    
    req.end();
  });
}

// Test 2: Create a minimal preference (similar to actual checkout)
function testCreatePreference() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log('[TEST 2] Creating test preference...');
    
    const preferenceData = JSON.stringify({
      items: [
        {
          id: 'test-item-1',
          title: 'Produto Teste',
          quantity: 1,
          unit_price: 4.00,
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: 'test@example.com',
        name: 'Test User',
      },
      back_urls: {
        success: 'http://localhost:3000/pedido/confirmado',
        failure: 'http://localhost:3000/pedido/falha',
        pending: 'http://localhost:3000/pedido/pendente',
      },
      external_reference: `test-${Date.now()}`,
      statement_descriptor: 'AGON MVP TEST',
    });
    
    const options = {
      hostname: 'api.mercadopago.com',
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(preferenceData),
      },
      timeout: TIMEOUT_MS,
    };
    
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 201) {
            console.log(`✓ Preference created successfully (${duration}ms)`);
            console.log(`  Preference ID: ${response.id}`);
            console.log(`  Init Point: ${response.init_point}\n`);
            resolve({ success: true, duration, preferenceId: response.id });
          } else {
            console.log(`✗ Failed to create preference (${duration}ms)`);
            console.log(`  Status: ${res.statusCode}`);
            console.log(`  Response: ${data.substring(0, 200)}\n`);
            resolve({ success: false, duration, status: res.statusCode, error: data });
          }
        } catch (error) {
          console.log(`✗ Failed to parse response (${duration}ms)`);
          console.log(`  Error: ${error.message}\n`);
          resolve({ success: false, duration, error: error.message });
        }
      });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`✗ Request timed out after ${duration}ms`);
      console.log(`  This is the same timeout your checkout is experiencing!\n`);
      req.destroy();
      resolve({ success: false, duration, error: 'TIMEOUT' });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`✗ Request failed after ${duration}ms`);
      console.log(`  Error: ${error.message}`);
      console.log(`  Code: ${error.code}\n`);
      resolve({ success: false, duration, error: error.code || error.message });
    });
    
    req.write(preferenceData);
    req.end();
  });
}

// Run tests
async function runTests() {
  const results = {
    apiAvailability: await testApiAvailability(),
    createPreference: await testCreatePreference(),
  };
  
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`API Availability: ${results.apiAvailability.success ? '✓ PASS' : '✗ FAIL'} (${results.apiAvailability.duration}ms)`);
  console.log(`Create Preference: ${results.createPreference.success ? '✓ PASS' : '✗ FAIL'} (${results.createPreference.duration}ms)`);
  console.log('');
  
  if (!results.apiAvailability.success || !results.createPreference.success) {
    console.log('⚠️  DIAGNOSIS:');
    
    if (results.apiAvailability.error === 'TIMEOUT' || results.createPreference.error === 'TIMEOUT') {
      console.log('   - Mercado Pago API is timing out');
      console.log('   - This could be due to:');
      console.log('     1. Network connectivity issues');
      console.log('     2. Firewall blocking outbound HTTPS requests');
      console.log('     3. Mercado Pago API experiencing high latency');
      console.log('     4. DNS resolution issues');
      console.log('');
      console.log('   RECOMMENDED ACTIONS:');
      console.log('   1. Check your internet connection');
      console.log('   2. Try again in a few minutes (API might be slow)');
      console.log('   3. Check if you can access https://api.mercadopago.com in browser');
      console.log('   4. Consider increasing timeout to 30-40 seconds');
    } else if (results.apiAvailability.error === 'ENOTFOUND' || results.createPreference.error === 'ENOTFOUND') {
      console.log('   - DNS resolution failed');
      console.log('   - Cannot resolve api.mercadopago.com');
      console.log('   - Check your DNS settings or internet connection');
    } else if (results.apiAvailability.error === 'ECONNREFUSED' || results.createPreference.error === 'ECONNREFUSED') {
      console.log('   - Connection refused by Mercado Pago API');
      console.log('   - This is unusual and might indicate API maintenance');
    } else {
      console.log(`   - Unexpected error: ${results.apiAvailability.error || results.createPreference.error}`);
    }
  } else {
    console.log('✓ All tests passed!');
    console.log('  Mercado Pago API is working correctly.');
    console.log('  If checkout still fails, the issue is likely in your application code.');
  }
  
  console.log('');
}

runTests().catch(console.error);
