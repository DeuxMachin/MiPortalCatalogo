/**
 * ProductWriteRepository.ts
 *
 * Contrato de Data Access para operaciones de ESCRITURA (commands).
 * Separado de ProductReadRepository para respetar el principio ISP:
 * los use-cases que sólo eliminan o publican no necesitan
 * saber nada sobre queries.
 */

import type { Product } from '@/src/entities/product/model/types';
import type { ProductImageInput, ProductImageCrop } from './ProductRepository';

export type { ProductImageInput, ProductImageCrop };

export interface ProductWriteResult {
    success: boolean;
    error?: string;
    /** ID del producto creado o modificado, si aplica. */
    id?: string;
}

export interface ProductWriteRepository {
    /**
     * Crea un nuevo producto junto con sus imágenes.
     * Las imágenes se procesan y convierten a WebP antes del almacenamiento.
     */
    createProduct(
        data: Omit<Product, 'id'>,
        imageInputs?: ProductImageInput[],
    ): Promise<ProductWriteResult>;

    /**
     * Actualiza campos de un producto existente.
     * `options.refetch` fuerza revalidación del caché tras la escritura.
     */
    updateProduct(
        id: string,
        updates: Partial<Omit<Product, 'id'>>,
        options?: { refetch?: boolean },
    ): Promise<ProductWriteResult>;

    /**
     * Reemplaza el set completo de imágenes de un producto.
     * Los slots vacíos son eliminados del storage.
     * Máximo `IMAGE_POLICY_MAX_COUNT` imágenes por producto.
     */
    setProductImages(
        id: string,
        imageInputs: ProductImageInput[],
    ): Promise<ProductWriteResult>;

    /**
     * Elimina un producto y sus recursos asociados (imágenes en storage).
     */
    deleteProduct(id: string): Promise<ProductWriteResult>;
}
