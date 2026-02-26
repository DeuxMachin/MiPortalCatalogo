-- Fix: es_admin() must also return true for 'owner' role
--
-- Previously, only 'admin' role was checked. This prevented owners from
-- performing INSERT/UPDATE/DELETE operations on products, categories, etc.
-- via RLS policies that call es_admin().
--
-- Owner should have full access to all admin operations including product CRUD.

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (
      SELECT (p.rol IN ('admin', 'owner'))
      FROM public.perfiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    false
  );
$$;
