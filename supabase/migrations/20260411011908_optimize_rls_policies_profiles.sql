-- Migration: Optimize RLS Policies - Profiles
-- Date: 2026-04-11
-- Description: Optimizes RLS policies for profiles table and consolidates duplicate policies

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update" ON public.profiles;

-- Create optimized consolidated policies
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));;
