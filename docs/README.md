# Docs — MiPortalCatalogo

Este folder documenta decisiones y cambios recientes del proyecto.

## Cambios implementados (Feb 2026)

### 1) Catálogo: descripción corta en cards
- En la vista principal (cards del catálogo) la descripción se **trunca a 100 palabras**.
- En la vista detalle del producto se muestra la **descripción completa**.

### 2) Imágenes: usar `<img>` (HTML) en vez de `next/image`
Se reemplazó `next/image` por `<img>` en componentes clave para evitar costos/recursos del optimizador de imágenes de Next en hosting (ej. Vercel), y simplificar el render.

Archivos relevantes (ejemplos):
- src/widgets/product-card/ui/ProductCard.tsx
- src/widgets/product-gallery/ui/ProductGallery.tsx
- src/views/admin/ui/ProductFormView.tsx
- app/admin/page.tsx

### 3) Supabase Storage para imágenes de productos (bucket + paths)

**Objetivo:** almacenar archivos binarios en Storage y mantener la base de datos solo con paths relativos.

#### Reglas
- Máximo **4 imágenes** por producto.
- Bucket: **catalogo-productos** (lectura pública).
- Estructura de path:
  - `productos/<producto_id>/<orden>.webp`
  - Ejemplo: `productos/8617b6a3-9171-4460-8b94-f1c35d498adf/1.webp`
- En la tabla `producto_imagenes` se guarda **solo** `path_storage` relativo (no URL completa).

#### Flujo correcto
1) Crear producto en `public.productos`.
2) Obtener `producto_id`.
3) Subir cada imagen a Storage con el path `productos/<producto_id>/<orden>.webp`.
4) Insertar filas en `public.producto_imagenes` con:
   - `producto_id`
   - `path_storage` (relativo)
   - `orden`
5) En frontend, al listar/mostrar productos:
   - Generar URL pública dinámicamente con `storage.from('catalogo-productos').getPublicUrl(path_storage)`.

#### Migración de Storage
Ejecutar en Supabase SQL Editor:
- supabase/migrations/006_storage_catalogo_productos.sql

Políticas incluidas:
- **SELECT** público (lectura sin auth)
- **INSERT/UPDATE/DELETE** solo `authenticated` y `public.es_admin()`

### 4) Fix de recursión RLS (stack depth)
Se agregó un fix para evitar recursión infinita en políticas que llamaban `public.es_admin()`.

Ejecutar en Supabase SQL Editor:
- supabase/migrations/005_fix_es_admin_function.sql

### 5) Frontend: integración de imágenes con Storage

Implementación principal:
- src/features/product-management/model/ProductContext.tsx

Incluye:
- Resolución `path_storage` → URL pública con `getPublicUrl()`.
- Método `setProductImages(productId, inputs)` para:
  - reemplazar imágenes
  - subir a Storage en WebP
  - mantener orden 1..4

Admin form:
- src/views/admin/ui/ProductFormView.tsx

Permite:
- Pegar link de imagen
- Subir archivo local
- Previsualizar
- Guardar (sube a Storage, inserta paths)

## Checklist de despliegue (Vercel)
- Bucket `catalogo-productos` creado y público.
- Policies de `storage.objects` aplicadas.
- `public.es_admin()` corregida (SECURITY DEFINER) para evitar recursión.
- Validar que el usuario admin tenga `perfiles.rol = 'admin'`.

## Notas
- Recomendación: subir imágenes en WebP (el frontend intenta convertir a WebP antes de subir).
- Evitar base64 en DB.
- Mantener DB para datos estructurados y Storage para binarios.
