-- ============================================================
-- Migration: Add especificacion_variada column to productos
-- Stores dynamic technical specs as JSONB key-value pairs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Column stores specs like: {"Diámetro": "12 mm", "Peso": "6.1 kg", ...}
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS especificacion_variada JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.productos.especificacion_variada IS
  'Especificaciones técnicas dinámicas del producto. Almacena pares clave-valor como JSONB, ej: {"Diámetro": "12 mm", "Peso": "6.1 kg/unidad"}';
