-- ============================================================
-- Migration: Create auditoria table
-- Tracks who created or deleted records in the system
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auditoria (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- What happened
    accion      TEXT NOT NULL CHECK (accion IN ('CREAR', 'ELIMINAR')),
    -- Which table was affected
    tabla       TEXT NOT NULL,
    -- ID of the affected record (stored as text for flexibility)
    registro_id TEXT NOT NULL,
    -- Brief description of what was created/deleted
    descripcion TEXT,
    -- Who did it (references auth.users)
    usuario_id  UUID NOT NULL REFERENCES auth.users(id),
    -- User email snapshot for easy querying
    usuario_email TEXT,
    -- When it happened
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries by table and action
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_accion
ON public.auditoria(tabla, accion);

-- Index for fast queries by user
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
ON public.auditoria(usuario_id);

-- Index for recent events
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
ON public.auditoria(creado_en DESC);

-- Comment
COMMENT ON TABLE public.auditoria IS
  'Tabla de auditoría: registra quién creó o eliminó registros en el sistema.';

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "auditoria_admin_read" ON public.auditoria
FOR SELECT USING (public.es_admin());

-- Only admins can insert audit records
CREATE POLICY "auditoria_admin_insert" ON public.auditoria
FOR INSERT WITH CHECK (public.es_admin());

-- Nobody can update or delete audit records (immutable log)
-- (No UPDATE/DELETE policies = denied by default with RLS enabled)
