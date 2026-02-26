import type { ProductRepository, ProductImageInput } from '@/src/features/product-management/domain/ProductRepository';
import { IMAGE_POLICY_MAX_COUNT } from '@/src/features/product-management/domain/imagePolicy';

export async function reorderImagesUseCase(
    repository: ProductRepository,
    productId: string,
    orderedImages: ProductImageInput[],
) {
    if (!productId?.trim()) {
        return { success: false, error: 'El identificador del producto es obligatorio.' };
    }

    // Aplicar límite de imágenes definido por la política.
    const safeImages = (orderedImages ?? []).filter(Boolean).slice(0, IMAGE_POLICY_MAX_COUNT);

    if (orderedImages.length > IMAGE_POLICY_MAX_COUNT) {
        // Advertencia no bloqueante: se procesan sólo las primeras N imágenes.
        console.warn(
            `[ReorderImages] Se recibieron ${orderedImages.length} imágenes, ` +
            `se truncan a ${IMAGE_POLICY_MAX_COUNT} según la política.`,
        );
    }

    return repository.setProductImages(productId, safeImages);
}
