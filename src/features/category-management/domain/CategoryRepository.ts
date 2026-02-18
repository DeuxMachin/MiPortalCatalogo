import type { Category } from '@/src/entities/category/model/types';

export interface CategoryRepository {
    listCategories(): Promise<{ data: Category[]; error: string | null }>;
    createCategory(input: { nombre: string; slug: string }): Promise<{ data: Category | null; error: string | null }>;
    updateCategory(
        id: string,
        updates: Partial<Pick<Category, 'nombre' | 'slug' | 'activo'>>,
    ): Promise<{ success: boolean; error: string | null }>;
    deleteCategory(id: string): Promise<{ success: boolean; error: string | null }>;
    listProductIdsByCategory(categoryId: string): Promise<{ data: string[]; error: string | null }>;
}
