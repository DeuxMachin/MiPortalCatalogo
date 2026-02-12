-- ============================================================
-- Migration: Add precio_visible column to productos table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add the boolean column with a default of true (visible)
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS precio_visible BOOLEAN NOT NULL DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN public.productos.precio_visible IS
  'Controla si el precio es visible para usuarios públicos. Default: true.';
