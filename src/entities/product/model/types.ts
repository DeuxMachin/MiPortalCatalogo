import type { StockStatus } from '@/src/shared/types/common';

/** Especificaciones técnicas de un producto. */
export interface ProductSpecs {
    [key: string]: string;
}

export interface ProductQuickSpec {
    label: string;
    value: string;
}

export interface ProductResource {
    label: string;
    url: string;
}

/** Producto del catálogo de construcción. */
export interface Product {
    id: string;
    sku: string;
    title: string;
    categoryId: string;
    category: string;
    price: number;
    unit: string;
    stock: StockStatus;
    description: string;
    specs: ProductSpecs;
    fullSpecs?: ProductSpecs;
    images: string[];
    grade?: string;
    isPublished: boolean;
    /** Si es false el precio se oculta en vistas públicas. Default true. */
    precioVisible: boolean;
    /* ---- Ficha Técnica (opcionales) ---- */
    color?: string;
    material?: string;
    contenido?: string;       // e.g. "300", "25"
    unidadMedida?: string;    // e.g. "ml", "kg", "gl", "lt"
    presentacion?: string;    // e.g. "Caja 12x1/4gl", "Rollo 25ml"
    pesoKg?: number;
    altoMm?: number;
    anchoMm?: number;
    largoMm?: number;
    /** Resumen editable por el admin (label + value) */
    quickSpecs?: ProductQuickSpec[];
    /** Nota técnica destacada */
    notaTecnica?: string;
    /** Recursos descargables */
    recursos?: ProductResource[];
    createdAt?: string;
    views30d?: number;
    clicks30d?: number;
    favs30d?: number;
    popularityScore?: number;
}

/** Producto relacionado (vista reducida). */
export interface RelatedProduct {
    id: string;
    title: string;
    price: number;
    category: string;
    image: string;
}
