-- Migration: Optimize RLS Policies - Payments
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for payments table

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_system_or_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "payments_insert_own"
  ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "payments_update_system_or_admin"
  ON public.payments
  FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );

CREATE POLICY "payments_delete_admin"
  ON public.payments
  FOR DELETE
  USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = (SELECT auth.uid())) = 'admin'
  );;
