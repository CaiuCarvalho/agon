-- Migration: Optimize RLS Policies - Addresses
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for addresses table

DROP POLICY IF EXISTS "Users can read own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

CREATE POLICY "addresses_select_own"
  ON public.addresses
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "addresses_insert_own"
  ON public.addresses
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "addresses_update_own"
  ON public.addresses
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "addresses_delete_own"
  ON public.addresses
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));;
