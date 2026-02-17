import type { ProductRepository } from '@/src/features/product-management/domain/ProductRepository';
import { validateAdminProductActionInput } from './adminProductSchemas';

export async function deleteProductUseCase(
    repository: ProductRepository,
    id: string,
) {
    const validation = validateAdminProductActionInput({ id });
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    return repository.deleteProduct(id);
}
