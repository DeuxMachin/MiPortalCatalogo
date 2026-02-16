import type { ProductRepository, ProductImageInput } from '@/src/features/product-management/domain/ProductRepository';
import type { AdminProductInputDTO } from './adminProductSchemas';
import { validateAdminProductInput } from './adminProductSchemas';

export async function createProductUseCase(
    repository: ProductRepository,
    dto: AdminProductInputDTO,
    imageInputs: ProductImageInput[],
) {
    const validation = validateAdminProductInput(dto);
    if (!validation.ok) {
        return { success: false, error: validation.errors.join(' ') };
    }

    return repository.createProduct(
        {
            ...dto,
            unit: dto.unit ?? 'CLP',
            specs: dto.specs ?? {},
            fullSpecs: dto.fullSpecs ?? dto.specs ?? {},
            quickSpecs: dto.quickSpecs ?? [],
            recursos: dto.recursos ?? [],
            images: [],
            category: '',
        },
        imageInputs,
    );
}
