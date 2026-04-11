-- Migration: Optimize RLS Policies - Orders and Order Items
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for orders and order_items tables

-- Orders
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

CREATE POLICY "orders_select_own"
  ON public.orders
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "orders_insert_own"
  ON public.orders
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "orders_update_own_or_admin"
  ON public.orders
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid()) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "orders_delete_admin"
  ON public.orders
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

-- Order Items
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

CREATE POLICY "order_items_select_own"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "order_items_insert_own"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "order_items_update_admin"
  ON public.order_items
  FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "order_items_delete_admin"
  ON public.order_items
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );;
