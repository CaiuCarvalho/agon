/**
 * Script de teste para validar configuração do Mercado Pago
 * Execute na VPS: node test-mercadopago-config.js
 */

const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config({ path: './apps/web/.env.local' });

async function testMercadoPagoConfig() {
  console.log('========================================');
  console.log('Teste de Configuração Mercado Pago');
  console.log('========================================\n');

  // 1. Verificar variáveis de ambiente
  console.log('1. Verificando variáveis de ambiente...');
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!accessToken) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN não encontrado');
    process.exit(1);
  }
  console.log('✓ MERCADOPAGO_ACCESS_TOKEN:', accessToken.substring(0, 15) + '...');

  if (!appUrl) {
    console.error('❌ NEXT_PUBLIC_APP_URL não encontrado');
    process.exit(1);
  }
  console.log('✓ NEXT_PUBLIC_APP_URL:', appUrl);

  if (!webhookSecret) {
    console.warn('⚠ MERCADOPAGO_WEBHOOK_SECRET não encontrado (opcional)');
  } else {
    console.log('✓ MERCADOPAGO_WEBHOOK_SECRET:', webhookSecret.substring(0, 10) + '...');
  }

  // 2. Verificar formato do token
  console.log('\n2. Verificando formato do token...');
  if (!accessToken.startsWith('APP_USR-')) {
    console.error('❌ Token deve começar com APP_USR-');
    console.error('   Token atual:', accessToken.substring(0, 20) + '...');
    process.exit(1);
  }
  console.log('✓ Token tem formato correto (APP_USR-...)');
  console.log('  Comprimento:', accessToken.length, 'caracteres');

  // 3. Testar inicialização do SDK
  console.log('\n3. Testando inicialização do SDK...');
  let client;
  try {
    client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 30000 },
    });
    console.log('✓ SDK inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar SDK:', error.message);
    process.exit(1);
  }

  // 4. Testar criação de preferência (teste real)
  console.log('\n4. Testando criação de preferência...');
  const preference = new Preference(client);
  
  const testPreferenceRequest = {
    items: [
      {
        id: 'test-item-1',
        title: 'Produto de Teste',
        quantity: 1,
        unit_price: 10.00,
        currency_id: 'BRL',
      },
    ],
    payer: {
      email: 'test@example.com',
      name: 'Teste Usuario',
      phone: {
        area_code: '11',
        number: '999999999',
      },
    },
    back_urls: {
      success: `${appUrl}/pedido/confirmado?order_id=test-123`,
      failure: `${appUrl}/pedido/falha?order_id=test-123`,
      pending: `${appUrl}/pedido/pendente?order_id=test-123`,
    },
    external_reference: 'test-order-123',
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'AGON MVP',
    payment_methods: {
      excluded_payment_types: [],
      installments: 12,
    },
  };

  try {
    console.log('  Enviando requisição para Mercado Pago...');
    const startTime = Date.now();
    
    const response = await preference.create({ body: testPreferenceRequest });
    
    const duration = Date.now() - startTime;
    
    console.log('✓ Preferência criada com sucesso!');
    console.log('  Preference ID:', response.id);
    console.log('  Init Point:', response.init_point);
    console.log('  Duração:', duration + 'ms');
    console.log('\n✅ CONFIGURAÇÃO DO MERCADO PAGO ESTÁ CORRETA!');
    console.log('\nVocê pode testar o checkout em:', response.init_point);
    
  } catch (error) {
    console.error('❌ Erro ao criar preferência:');
    console.error('  Mensagem:', error.message);
    console.error('  Status:', error.status);
    console.error('  Code:', error.code);
    
    if (error.cause) {
      console.error('  Causa:', error.cause);
    }
    
    if (error.response?.data) {
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n❌ CONFIGURAÇÃO DO MERCADO PAGO TEM PROBLEMAS');
    console.log('\nPossíveis causas:');
    console.log('1. Token inválido ou expirado');
    console.log('2. Token de teste sendo usado em produção (ou vice-versa)');
    console.log('3. Aplicação do Mercado Pago não ativada');
    console.log('4. Problemas de rede/firewall');
    console.log('\nVerifique suas credenciais em:');
    console.log('https://www.mercadopago.com.br/developers/panel/app');
    
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('Teste concluído com sucesso!');
  console.log('========================================');
}

// Executar teste
testMercadoPagoConfig().catch((error) => {
  console.error('\n❌ Erro inesperado:', error);
  process.exit(1);
});
