/**
 * ProductRepository.ts
 *
 * Punto de entrada unificado del contrato de repositorio.
 * Las operaciones están divididas en:
 *
 *  - ProductReadRepository  → consultas (listProducts, getProductById…)
 *  - ProductWriteRepository → comandos (createProduct, updateProduct…)
 *
 * `ProductRepository` compone ambos como una interfaz completa,
 * manteniendo compatibilidad con todo el código existente.
 */

import type { Product } from '@/src/entities/product/model/types';
import type { ProductReadRepository } from './ProductReadRepository';
import type { ProductWriteRepository } from './ProductWriteRepository';

/* ─── Tipos de imágenes compartidos ─── */

export type ProductImageCrop = {
    zoom?: number;
    offsetX?: number;
    offsetY?: number;
};

export type ProductImageInput = string | File | { source: string | File; crop?: ProductImageCrop };

/* ─── Repositorio completo (lectura + escritura) ─── */

/**
 * Interfaz completa del repositorio de productos.
 * Las implementaciones concretas (ej. SupabaseProductRepository)
 * implementan esta interfaz.
 *
 * Para use-cases que sólo necesitan escritura, prefiere tipar
 * el parámetro como `ProductWriteRepository`.
 * Para use-cases de sólo lectura, usa `ProductReadRepository`.
 */
export interface ProductRepository
    extends Omit<ProductWriteRepository, 'createProduct' | 'updateProduct' | 'setProductImages' | 'deleteProduct'> {
    createProduct(data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]): Promise<{ success: boolean; error?: string; id?: string }>;
    updateProduct(
        id: string,
        updates: Partial<Omit<Product, 'id'>>,
        options?: { refetch?: boolean },
    ): Promise<{ success: boolean; error?: string; id?: string }>;
    setProductImages(id: string, imageInputs: ProductImageInput[]): Promise<{ success: boolean; error?: string }>;
    deleteProduct(id: string): Promise<{ success: boolean; error?: string }>;
}

/* ─── Re-exports para uso conveniente ─── */
export type { ProductReadRepository, ProductWriteRepository };
