-- Migration: Optimize RLS Policies - Cart and Wishlist
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for cart_items and wishlist_items tables

-- Cart Items
DROP POLICY IF EXISTS "cart_items_select_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;

CREATE POLICY "cart_items_select_own"
  ON public.cart_items
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "cart_items_insert_own"
  ON public.cart_items
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "cart_items_update_own"
  ON public.cart_items
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "cart_items_delete_own"
  ON public.cart_items
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Wishlist Items
DROP POLICY IF EXISTS "wishlist_items_select_own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_insert_own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist_items_delete_own" ON public.wishlist_items;

CREATE POLICY "wishlist_items_select_own"
  ON public.wishlist_items
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "wishlist_items_insert_own"
  ON public.wishlist_items
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "wishlist_items_delete_own"
  ON public.wishlist_items
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));;
