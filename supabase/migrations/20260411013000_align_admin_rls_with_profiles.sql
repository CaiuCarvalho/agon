-- Migration: Align admin RLS checks with profiles.role and metadata role
-- Date: 2026-04-11
-- Description: Prevent admin-panel regressions by supporting both role sources

-- Orders
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

CREATE POLICY "orders_update_own_or_admin"
  ON public.orders
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "orders_delete_admin"
  ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Order Items
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

CREATE POLICY "order_items_update_admin"
  ON public.order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "order_items_delete_admin"
  ON public.order_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Payments
DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

CREATE POLICY "payments_update_system_or_admin"
  ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "payments_delete_admin"
  ON public.payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    ) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

