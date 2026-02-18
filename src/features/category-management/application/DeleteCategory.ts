import type { CategoryRepository } from '@/src/features/category-management/domain/CategoryRepository';
import { validateAdminCategoryDeleteInput, type AdminCategoryDeleteDTO } from './adminCategorySchemas';

export async function deleteCategoryUseCase(
    repository: CategoryRepository,
    dto: AdminCategoryDeleteDTO,
) {
    const validation = validateAdminCategoryDeleteInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    const result = await repository.deleteCategory(dto.id);
    if (!result.success) {
        return { success: false, error: result.error ?? 'No se pudo eliminar la categoría.' };
    }

    return { success: true };
}

export async function deleteCategoryWithProductsUseCase(
    repository: CategoryRepository,
    dto: AdminCategoryDeleteDTO,
    deleteProductById: (productId: string) => Promise<{ success: boolean; error?: string }>,
) {
    const validation = validateAdminCategoryDeleteInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    const products = await repository.listProductIdsByCategory(dto.id);
    if (products.error) {
        return { success: false, error: products.error };
    }

    for (const productId of products.data) {
        const deleted = await deleteProductById(productId);
        if (!deleted.success) {
            return {
                success: false,
                error: deleted.error ?? 'No se pudieron eliminar los productos de la categoría.',
            };
        }
    }

    return deleteCategoryUseCase(repository, dto);
}
