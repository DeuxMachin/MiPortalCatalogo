-- ============================================================
-- Migration 011: Auditoría TTL — limpieza automática
-- Elimina registros de auditoría con más de 1 año y 3 meses
-- (15 meses) de antigüedad para cumplir normativas internas.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Extensión pg_cron
--    pg_cron siempre crea su propio schema "cron"; no usar SCHEMA.
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ------------------------------------------------------------
-- 1. Función de limpieza
--    SECURITY DEFINER: bypasea la RLS de auditoria
--    (la policy bloquea DELETE desde roles de aplicación).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.limpiar_auditoria_expirada()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limite   TIMESTAMPTZ;
    v_borrados INTEGER;
BEGIN
    -- Umbral: 15 meses (1 año 3 meses) atrás
    v_limite := now() - INTERVAL '15 months';

    DELETE FROM public.auditoria
    WHERE creado_en < v_limite;

    GET DIAGNOSTICS v_borrados = ROW_COUNT;

    RAISE NOTICE '[auditoria_ttl] % registro(s) eliminado(s) con creado_en < %',
        v_borrados, v_limite;
END;
$$;

COMMENT ON FUNCTION public.limpiar_auditoria_expirada() IS
  'Elimina registros de auditoría con más de 15 meses de antigüedad. '
  'Ejecutada diariamente via pg_cron. SECURITY DEFINER para bypasear RLS.';

-- ------------------------------------------------------------
-- 2. Job pg_cron — 03:00 UTC diario
--    EXCEPTION handler: si el job no existe aún no falla.
-- ------------------------------------------------------------
DO $$
BEGIN
    PERFORM cron.unschedule('auditoria_ttl_daily_cleanup');
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$;

SELECT cron.schedule(
    'auditoria_ttl_daily_cleanup',
    '0 3 * * *',
    $$SELECT public.limpiar_auditoria_expirada();$$
);

-- ------------------------------------------------------------
-- Verificar job:    SELECT * FROM cron.job WHERE jobname = 'auditoria_ttl_daily_cleanup';
-- Ejecutar manual: SELECT public.limpiar_auditoria_expirada();
-- ------------------------------------------------------------
