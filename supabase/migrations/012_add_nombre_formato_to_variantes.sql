-- Migración para agregar el nombre personalizado del formato a las variantes
ALTER TABLE public.producto_variantes 
ADD COLUMN nombre_formato text;

COMMENT ON COLUMN public.producto_variantes.nombre_formato IS 'Nombre personalizado del formato definido por el administrador (ej: Bolsa 25kg, Bidón 20L)';
