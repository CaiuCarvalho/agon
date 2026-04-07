/**
 * Script para verificar o estado do banco de dados Supabase
 * 
 * Verifica:
 * - Conexão com Supabase
 * - Existência das tabelas necessárias
 * - Dados de produtos
 * - RLS policies
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from apps/web/.env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Verificando banco de dados Supabase...\n');
  
  // 1. Verificar conexão
  console.log('1️⃣ Testando conexão...');
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      console.log('\n💡 Possíveis causas:');
      console.log('   - Tabela "products" não existe');
      console.log('   - RLS policies bloqueando acesso');
      console.log('   - Credenciais inválidas\n');
    } else {
      console.log('✅ Conexão OK\n');
    }
  } catch (err) {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  }

  // 2. Verificar tabelas
  console.log('2️⃣ Verificando tabelas...');
  const tables = ['products', 'categories', 'cart_items', 'wishlist_items', 'orders', 'order_items'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count ?? 0} registros`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: Erro ao verificar`);
    }
  }
  console.log('');

  // 3. Verificar produtos
  console.log('3️⃣ Verificando produtos...');
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .limit(5);
    
    if (error) {
      console.log('   ❌ Erro ao buscar produtos:', error.message);
    } else if (!products || products.length === 0) {
      console.log('   ⚠️  Nenhum produto encontrado no banco');
      console.log('   💡 Execute o script de seed para popular o banco\n');
    } else {
      console.log(`   ✅ ${products.length} produtos encontrados (mostrando primeiros 5):`);
      products.forEach(p => {
        console.log(`      - ${p.name} (R$ ${p.price}) - Estoque: ${p.stock}`);
      });
      console.log('');
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar produtos');
  }

  // 4. Verificar categorias
  console.log('4️⃣ Verificando categorias...');
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug');
    
    if (error) {
      console.log('   ❌ Erro ao buscar categorias:', error.message);
    } else if (!categories || categories.length === 0) {
      console.log('   ⚠️  Nenhuma categoria encontrada');
    } else {
      console.log(`   ✅ ${categories.length} categorias encontradas:`);
      categories.forEach(c => {
        console.log(`      - ${c.name} (${c.slug})`);
      });
      console.log('');
    }
  } catch (err) {
    console.log('   ❌ Erro ao verificar categorias');
  }

  // 5. Verificar RLS
  console.log('5️⃣ Verificando RLS (Row Level Security)...');
  console.log('   💡 Se você não consegue ver dados, pode ser RLS bloqueando');
  console.log('   💡 Verifique no Supabase Dashboard > Authentication > Policies\n');

  // 6. Resumo
  console.log('📋 RESUMO:');
  console.log('   - URL:', supabaseUrl);
  console.log('   - Anon Key:', supabaseKey.substring(0, 20) + '...');
  console.log('\n✅ Verificação concluída!\n');
}

checkDatabase().catch(console.error);
