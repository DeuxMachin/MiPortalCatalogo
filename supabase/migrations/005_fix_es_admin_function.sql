-- Fix: es_admin() must not recurse through RLS policies
--
-- Symptom: inserts/updates hang or fail with "stack depth limit exceeded"
-- Cause: policies call public.es_admin(), and es_admin() queries a table that
--        is also protected by policies calling es_admin() (infinite recursion).
--
-- This SECURITY DEFINER function runs as the table owner (typically postgres)
-- and bypasses RLS so policy checks remain fast and non-recursive.

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT (p.rol = 'admin')
      FROM public.perfiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    false
  );
$$;

-- Allow policies to call the function
GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;
