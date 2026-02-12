/** Categoría sincronizada con la tabla public.categorias de Supabase. */
export interface Category {
    id: string;              // uuid
    nombre: string;
    slug: string;
    activo: boolean;
    creado_en: string;       // ISO timestamp
    actualizado_en: string;  // ISO timestamp
}
