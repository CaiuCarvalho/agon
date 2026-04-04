-- Script para criar usuário de teste completo no Supabase
-- Execute este script no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new

-- IMPORTANTE: Este script cria um usuário com senha "teste123"
-- Você pode alterar o email e senha conforme necessário

-- 1. Deletar usuário existente se houver (opcional - comente se não quiser deletar)
DELETE FROM auth.users WHERE email = 'teste@agon.com'; -- ALTERE AQUI: seu email de teste

-- 2. Criar usuário na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teste@agon.com', -- ALTERE AQUI: seu email de teste
  crypt('teste123', gen_salt('bf')), -- ALTERE AQUI: sua senha de teste
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Usuário Teste"}', -- ALTERE AQUI: nome do usuário
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Criar profile correspondente na tabela profiles
INSERT INTO profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  'customer' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'teste@agon.com'; -- ALTERE AQUI: mesmo email acima

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'name' as user_name,
  p.name as profile_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'teste@agon.com'; -- ALTERE AQUI: mesmo email acima
