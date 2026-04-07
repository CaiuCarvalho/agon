/**
 * Quick test script for Mercado Pago SDK v2.12.0
 * 
 * Run with: node test-mercadopago.js
 */

require('dotenv').config({ path: '.env.local' });
const { MercadoPagoConfig, Preference } = require('mercadopago');

async function testMercadoPago() {
  console.log('🧪 Testing Mercado Pago SDK...\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables:');
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!token) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ Token found');
  console.log(`   Starts with APP_USR-: ${token.startsWith('APP_USR-') ? 'YES' : 'NO'}`);
  console.log(`   Length: ${token.length} characters\n`);
  
  if (!token.startsWith('APP_USR-')) {
    console.error('❌ Invalid token format. Must start with APP_USR-');
    process.exit(1);
  }
  
  // 2. Initialize SDK
  console.log('2️⃣ Initializing Mercado Pago SDK...');
  try {
    const client = new MercadoPagoConfig({ 
      accessToken: token,
      options: { timeout: 5000 }
    });
    console.log('✅ SDK initialized\n');
    
    // 3. Create test preference
    console.log('3️⃣ Creating test preference...');
    const preference = new Preference(client);
    
    const response = await preference.create({
      body: {
        items: [
          {
            title: 'Produto Teste',
            quantity: 1,
            unit_price: 100,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: 'test@example.com',
          name: 'Test User',
          phone: {
            area_code: '11',
            number: '999999999',
          },
        },
        back_urls: {
          success: 'http://localhost:3000/pedido/confirmado',
          failure: 'http://localhost:3000/pedido/falha',
          pending: 'http://localhost:3000/pedido/pendente',
        },
        external_reference: 'test-order-123',
        notification_url: 'http://localhost:3000/webhook',
        statement_descriptor: 'TEST',
      },
    });
    
    console.log('✅ Preference created successfully!\n');
    console.log('📋 Response:');
    console.log(`   Preference ID: ${response.id}`);
    console.log(`   Init Point: ${response.init_point}`);
    console.log(`   Sandbox Init Point: ${response.sandbox_init_point}\n`);
    
    console.log('🎉 All tests passed!');
    console.log('\n💡 Your Mercado Pago integration is working correctly.');
    console.log('   You can now use the checkout flow in your app.\n');
    
  } catch (error) {
    console.error('❌ Error creating preference:\n');
    console.error('   Message:', error.message);
    console.error('   Status:', error.status);
    
    if (error.cause) {
      console.error('   Cause:', JSON.stringify(error.cause, null, 2));
    }
    
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response, null, 2));
    }
    
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check if your Access Token is correct');
    console.log('   2. Make sure you are using TEST credentials');
    console.log('   3. Verify your Mercado Pago account is active');
    console.log('   4. Check https://www.mercadopago.com.br/developers/panel/app\n');
    
    process.exit(1);
  }
}

testMercadoPago();
