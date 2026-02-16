import type { Product } from '@/src/entities/product/model/types';
import type { ProductImageInput, ProductRepository } from '@/src/features/product-management/domain/ProductRepository';

type ProductContextDeps = {
    saveImageToStorage: (item: ProductImageInput, productId: string, imageIndex: number) => Promise<string | null>;
    createProductRecord: (data: Omit<Product, 'id'> & { images: string[] }) => Promise<{ success: boolean; error?: string; id?: string }>;
    updateProductRecord: (
        id: string,
        updates: Partial<Omit<Product, 'id'>>,
        options?: { refetch?: boolean },
    ) => Promise<{ success: boolean; error?: string; id?: string }>;
};

export class SupabaseProductRepository implements ProductRepository {
    constructor(private readonly deps: ProductContextDeps) {}

    async createProduct(data: Omit<Product, 'id'>, imageInputs: ProductImageInput[] = []) {
        const provisionalId = crypto.randomUUID();
        const uploadedImages: string[] = [];

        for (let index = 0; index < imageInputs.length; index += 1) {
            const imagePath = await this.deps.saveImageToStorage(imageInputs[index], provisionalId, index);
            if (imagePath) uploadedImages.push(imagePath);
        }

        return this.deps.createProductRecord({ ...data, images: uploadedImages });
    }

    async updateProduct(
        id: string,
        updates: Partial<Omit<Product, 'id'>>,
        options?: { refetch?: boolean },
    ) {
        return this.deps.updateProductRecord(id, updates, options);
    }

    async setProductImages(id: string, imageInputs: ProductImageInput[]) {
        const uploadedImages: string[] = [];

        for (let index = 0; index < imageInputs.length; index += 1) {
            const imagePath = await this.deps.saveImageToStorage(imageInputs[index], id, index);
            if (imagePath) uploadedImages.push(imagePath);
        }

        return this.deps.updateProductRecord(id, { images: uploadedImages }, { refetch: true });
    }
}
