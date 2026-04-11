-- Migration: Add admin SELECT policy for orders
-- Date: 2026-04-11
-- Description: Allow admins to view ALL orders, not just their own

-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- ============================================================================
-- A política "orders_select_own" limita a leitura de pedidos apenas aos
-- pedidos do próprio usuário. Isso faz com que o painel admin mostre apenas
-- os pedidos do admin logado, ao invés de TODOS os pedidos do sistema.
--
-- SOLUÇÃO:
-- Adicionar política de SELECT para admins que permite visualizar todos os pedidos.
-- ============================================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;

-- Create new SELECT policy that allows:
-- 1. Users to see their own orders
-- 2. Admins to see ALL orders
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  USING (
    -- User can see their own orders
    user_id = (SELECT auth.uid())
    OR
    -- Admin can see ALL orders (check profiles.role)
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Admin can see ALL orders (check auth.users metadata)
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Para verificar se a política está funcionando, execute:
--
-- 1. Como usuário normal (deve ver apenas seus pedidos):
-- SELECT * FROM orders WHERE user_id = auth.uid();
--
-- 2. Como admin (deve ver TODOS os pedidos):
-- SELECT * FROM orders;
--
-- 3. Verificar políticas ativas:
-- SELECT * FROM pg_policies WHERE tablename = 'orders' AND policyname LIKE '%select%';
-- ============================================================================

-- ============================================================================
-- POLÍTICAS RELACIONADAS (order_items e payments)
-- ============================================================================
-- Também precisamos garantir que admins possam ver order_items e payments

-- Order Items - SELECT policy for admin
DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;

CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  USING (
    -- User can see items from their own orders
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin can see ALL order items
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Payments - SELECT policy for admin
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;

CREATE POLICY "payments_select_own_or_admin"
  ON public.payments
  FOR SELECT
  USING (
    -- User can see payments from their own orders
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
    OR
    -- Admin can see ALL payments
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- ============================================================================
-- RESUMO DAS MUDANÇAS
-- ============================================================================
-- ✅ orders: Admin pode ver TODOS os pedidos
-- ✅ order_items: Admin pode ver TODOS os itens de pedidos
-- ✅ payments: Admin pode ver TODOS os pagamentos
--
-- Usuários normais continuam vendo apenas seus próprios dados.
-- ============================================================================
