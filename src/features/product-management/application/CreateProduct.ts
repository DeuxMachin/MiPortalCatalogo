import type { ProductRepository, ProductImageInput } from '@/src/features/product-management/domain/ProductRepository';
import type { AdminProductInputDTO } from './adminProductSchemas';
import { validateAdminProductInput } from './adminProductSchemas';
import { validateProductImagePolicy, IMAGE_POLICY_MAX_COUNT } from '@/src/features/product-management/domain/imagePolicy';

export async function createProductUseCase(
    repository: ProductRepository,
    dto: AdminProductInputDTO,
    imageInputs: ProductImageInput[],
) {
    // 1. Validar campos del producto.
    const validation = validateAdminProductInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    // 2. Validar política de imágenes (cantidad, tipo y peso).
    const safeImages = (imageInputs ?? []).filter(Boolean).slice(0, IMAGE_POLICY_MAX_COUNT);

    const imageFiles = safeImages
        .map((input) => {
            const source =
                typeof input === 'object' && input !== null && 'source' in input
                    ? (input as { source: File | string }).source
                    : input;
            return source instanceof File ? source : null;
        })
        .filter((f): f is File => f !== null);

    if (imageFiles.length > 0) {
        const imageValidation = validateProductImagePolicy(
            imageFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        );
        if (!imageValidation.ok) {
            return { success: false, error: imageValidation.errors.join(' ') };
        }
    }

    if (imageInputs.length > IMAGE_POLICY_MAX_COUNT) {
        return {
            success: false,
            error: `Solo se permiten hasta ${IMAGE_POLICY_MAX_COUNT} imágenes por producto.`,
        };
    }

    // 3. Persistir.
    return repository.createProduct(
        {
            ...dto,
            unit: dto.unit ?? 'CLP',
            specs: dto.specs ?? {},
            fullSpecs: dto.fullSpecs ?? dto.specs ?? {},
            quickSpecs: dto.quickSpecs ?? [],
            recursos: dto.recursos ?? [],
            variants: dto.variants ?? [],
            images: [],
            category: '',
        },
        safeImages,
    );
}
