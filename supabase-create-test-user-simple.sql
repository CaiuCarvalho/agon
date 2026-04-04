-- Script SIMPLIFICADO para criar usuário de teste no Supabase
-- Execute este script no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/yyhpqecnxkvtnjdqhwhk/sql/new

-- PASSO 1: Deletar usuário existente (se houver)
-- Comente esta linha se for a primeira vez
DELETE FROM auth.users WHERE email = 'teste@agon.com';

-- PASSO 2: Criar novo usuário
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Inserir usuário
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
    'teste@agon.com',
    crypt('teste123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Usuário Teste"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Inserir profile
  INSERT INTO profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    new_user_id,
    'teste@agon.com',
    'Usuário Teste',
    'customer',
    NOW(),
    NOW()
  );

  -- Mostrar resultado
  RAISE NOTICE 'Usuário criado com sucesso! ID: %', new_user_id;
END $$;

-- PASSO 3: Verificar se foi criado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at as confirmado_em,
  u.raw_user_meta_data->>'name' as nome_metadata,
  p.name as nome_profile,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'teste@agon.com';
