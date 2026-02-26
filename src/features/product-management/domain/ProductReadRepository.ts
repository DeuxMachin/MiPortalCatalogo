/**
 * ProductReadRepository.ts
 *
 * Contrato de Data Access para operaciones de LECTURA (queries).
 * Separar las consultas de las escrituras permite:
 *  - Aplicar cachés o réplicas de sólo lectura en el futuro.
 *  - Facilitar pruebas unitarias: un stub de lectura es independiente
 *    del stub de escritura.
 *  - Respetar el principio de segregación de interfaces (ISP).
 */

import type { Product } from '@/src/entities/product/model/types';

export interface ProductReadRepository {
    /**
     * Retorna todos los productos disponibles.
     * Implementaciones pueden aplicar caché TTL.
     */
    listProducts(): Promise<Product[]>;

    /**
     * Busca un producto por su ID.
     * Retorna `null` si no existe.
     */
    getProductById(id: string): Promise<Product | null>;

    /**
     * Retorna productos relacionados a un producto dado,
     * limitados por `limit`. Útil para el carrusel de relacionados.
     */
    getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;
}
