-- Migration: Promove caiu.lfc@gmail.com a admin (idempotente)
-- Date: 2026-04-21
-- Description: Backfill de profile (caso o trigger on_auth_user_created não
-- estivesse ativo quando o usuário se cadastrou) + promoção a admin.
-- Segurança: usa SELECT em auth.users; só faz efeito se o email já existir.
-- Se o usuário ainda não se cadastrou, a migration vira no-op e pode ser
-- re-executada após o signup sem problemas (ON CONFLICT / WHERE).

-- ============================================================================
-- 1. Backfill do profile (se já havia usuário mas não havia profile)
-- ============================================================================

INSERT INTO public.profiles (id, email, name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE u.email = 'caiu.lfc@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Promoção a admin em profiles.role
-- ============================================================================

UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'caiu.lfc@gmail.com'
  AND role <> 'admin';

-- ============================================================================
-- 3. Também sincroniza em auth.users.raw_user_meta_data.role
-- ============================================================================
-- O middleware checa tanto profiles.role quanto user_metadata.role
-- (lib/auth/roles.ts). Manter os dois em sincronia evita confusão.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'caiu.lfc@gmail.com'
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'admin';
