-- Public read policies for catalog views (anon users)
-- Allows the public catalog to list categories/products while keeping writes restricted.

-- Enable RLS (safe if already enabled)
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.producto_imagenes enable row level security;

-- 1) Categorías: lectura pública solo activas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'categorias'
      AND policyname = 'categorias_public_read'
  ) THEN
    CREATE POLICY categorias_public_read
    ON public.categorias
    FOR SELECT
    TO anon, authenticated
    USING (activo = true);
  END IF;
END $$;

-- 2) Productos: lectura pública solo publicados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'productos'
      AND policyname = 'productos_public_read'
  ) THEN
    CREATE POLICY productos_public_read
    ON public.productos
    FOR SELECT
    TO anon, authenticated
    USING (activo = true);
  END IF;
END $$;

-- 3) Imágenes: lectura pública solo si el producto está publicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'producto_imagenes'
      AND policyname = 'producto_imagenes_public_read'
  ) THEN
    CREATE POLICY producto_imagenes_public_read
    ON public.producto_imagenes
    FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.productos p
        WHERE p.id = producto_imagenes.producto_id
          AND p.activo = true
      )
    );
  END IF;
END $$;
