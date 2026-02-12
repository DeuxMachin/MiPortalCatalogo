-- Add advanced detail content for productos
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS quick_specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS nota_tecnica text,
  ADD COLUMN IF NOT EXISTS recursos jsonb NOT NULL DEFAULT '[]'::jsonb;
