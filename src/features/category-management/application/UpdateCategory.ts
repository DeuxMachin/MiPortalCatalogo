import type { CategoryRepository } from '@/src/features/category-management/domain/CategoryRepository';
import { validateAdminCategoryUpdateInput, type AdminCategoryUpdateDTO } from './adminCategorySchemas';

function toSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function updateCategoryUseCase(
    repository: CategoryRepository,
    dto: AdminCategoryUpdateDTO,
) {
    const validation = validateAdminCategoryUpdateInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    const payload: Partial<AdminCategoryUpdateDTO> = { ...dto };
    if (payload.nombre && !payload.slug) {
        payload.slug = toSlug(payload.nombre);
    }

    const result = await repository.updateCategory(dto.id, {
        nombre: payload.nombre,
        slug: payload.slug,
        activo: payload.activo,
    });

    if (!result.success) {
        return { success: false, error: result.error ?? 'No se pudo actualizar la categoría.' };
    }

    return { success: true };
}
