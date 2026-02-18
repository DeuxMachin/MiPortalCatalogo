import type { CategoryRepository } from '@/src/features/category-management/domain/CategoryRepository';
import { validateAdminCategoryInput, type AdminCategoryInputDTO } from './adminCategorySchemas';

function toSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function createCategoryUseCase(
    repository: CategoryRepository,
    dto: AdminCategoryInputDTO,
) {
    const validation = validateAdminCategoryInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    const nombre = dto.nombre.trim();
    const slug = (dto.slug?.trim() || toSlug(nombre));

    const result = await repository.createCategory({ nombre, slug });
    if (result.error || !result.data) {
        return { success: false, error: result.error ?? 'No se pudo crear la categoría.' };
    }

    return { success: true, data: result.data };
}
