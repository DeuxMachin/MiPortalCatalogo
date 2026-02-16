import type { ProductRepository } from '@/src/features/product-management/domain/ProductRepository';

export async function publishProductUseCase(
    repository: ProductRepository,
    id: string,
    isPublished: boolean,
) {
    return repository.updateProduct(id, { isPublished });
}
