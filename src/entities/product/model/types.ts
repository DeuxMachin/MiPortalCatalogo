import type { StockStatus } from '@/src/shared/types/common';

/** Especificaciones técnicas de un producto. */
export interface ProductSpecs {
    [key: string]: string;
}

/** Producto del catálogo de construcción. */
export interface Product {
    id: number;
    sku: string;
    title: string;
    categoryId: number;
    category: string;
    price: number;
    unit: string;
    stock: StockStatus;
    description: string;
    specs: ProductSpecs;
    fullSpecs?: ProductSpecs;
    images: string[];
    grade?: string;
    rating?: number;
    reviews?: number;
    isPublished: boolean;
}

/** Producto relacionado (vista reducida). */
export interface RelatedProduct {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
}
