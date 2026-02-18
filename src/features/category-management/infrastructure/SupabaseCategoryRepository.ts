import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/src/entities/category/model/types';
import type { CategoryRepository } from '@/src/features/category-management/domain/CategoryRepository';
import { logAdminAudit } from '@/src/shared/lib/adminAudit';

export class SupabaseCategoryRepository implements CategoryRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async listCategories() {
        const { data, error } = await this.supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });

        return {
            data: (data as Category[]) ?? [],
            error: error?.message ?? null,
        };
    }

    async createCategory(input: { nombre: string; slug: string }) {
        const { data, error } = await this.supabase
            .from('categorias')
            .insert(input)
            .select('*')
            .single();

        if (!error && data) {
            await logAdminAudit(this.supabase, {
                action: 'CREAR',
                table: 'categorias',
                recordId: String(data.id),
                description: `CREAR categoría "${input.nombre}"`,
            });
        }

        return {
            data: (data as Category | null) ?? null,
            error: error?.message ?? null,
        };
    }

    async updateCategory(
        id: string,
        updates: Partial<Pick<Category, 'nombre' | 'slug' | 'activo'>>,
    ) {
        const { error } = await this.supabase
            .from('categorias')
            .update(updates)
            .eq('id', id);

        if (!error) {
            const detail = updates.nombre
                ? `EDITAR categoría "${updates.nombre}"`
                : 'EDITAR categoría';

            await logAdminAudit(this.supabase, {
                action: 'CREAR',
                table: 'categorias',
                recordId: id,
                description: detail,
            });
        }

        return {
            success: !error,
            error: error?.message ?? null,
        };
    }

    async deleteCategory(id: string) {
        const { error } = await this.supabase
            .from('categorias')
            .delete()
            .eq('id', id);

        if (!error) {
            await logAdminAudit(this.supabase, {
                action: 'ELIMINAR',
                table: 'categorias',
                recordId: id,
                description: 'ELIMINAR categoría',
            });
        }

        return {
            success: !error,
            error: error?.message ?? null,
        };
    }

    async listProductIdsByCategory(categoryId: string) {
        const { data, error } = await this.supabase
            .from('productos')
            .select('id')
            .eq('categoria_id', categoryId);

        return {
            data: (data ?? []).map((row: { id: string }) => String(row.id)),
            error: error?.message ?? null,
        };
    }
}
