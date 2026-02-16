import type { ProductRepository, ProductImageInput } from '@/src/features/product-management/domain/ProductRepository';

export async function reorderImagesUseCase(
    repository: ProductRepository,
    productId: string,
    orderedImages: ProductImageInput[],
) {
    return repository.setProductImages(productId, orderedImages);
}
