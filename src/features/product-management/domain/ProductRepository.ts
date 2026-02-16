import type { Product } from '@/src/entities/product/model/types';

export type ProductImageCrop = {
    zoom?: number;
    offsetX?: number;
    offsetY?: number;
};

export type ProductImageInput = string | File | { source: string | File; crop?: ProductImageCrop };

export interface ProductRepository {
    createProduct(data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]): Promise<{ success: boolean; error?: string; id?: string }>;
    updateProduct(
        id: string,
        updates: Partial<Omit<Product, 'id'>>,
        options?: { refetch?: boolean },
    ): Promise<{ success: boolean; error?: string; id?: string }>;
    setProductImages(id: string, imageInputs: ProductImageInput[]): Promise<{ success: boolean; error?: string }>;
}
