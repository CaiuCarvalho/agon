-- Script para criar profile para usuário criado manualmente
-- Execute este script no SQL Editor do Supabase

-- Substitua 'seu-email@exemplo.com' pelo email do usuário que você criou
INSERT INTO profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  'customer' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (id) DO UPDATE
SET 
  name = COALESCE(EXCLUDED.name, profiles.name),
  email = EXCLUDED.email,
  updated_at = NOW();
