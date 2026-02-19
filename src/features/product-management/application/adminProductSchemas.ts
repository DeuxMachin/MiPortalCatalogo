import type { StockStatus } from '@/src/shared/types/common';

export interface AdminProductInputDTO {
    title: string;
    sku: string;
    price: number;
    categoryId: string;
    description: string;
    stock: StockStatus;
    isPublished: boolean;
    precioVisible: boolean;
    unit?: string;
    color?: string;
    material?: string;
    contenido?: string;
    unidadMedida?: string;
    presentacion?: string;
    pesoKg?: number;
    altoMm?: number;
    anchoMm?: number;
    largoMm?: number;
    specs?: Record<string, string>;
    fullSpecs?: Record<string, string>;
    quickSpecs?: Array<{ label: string; value: string }>;
    notaTecnica?: string;
    recursos?: Array<{ label: string; url: string }>;
    variants?: any[];
}

export interface AdminProductActionDTO {
    id: string;
}

export function validateAdminProductInput(input: Partial<AdminProductInputDTO>): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.title?.trim()) errors.push('El nombre del producto es obligatorio.');
    if (!input.categoryId?.trim()) errors.push('La categoría es obligatoria.');

    if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
        errors.push('El precio debe ser un número válido mayor o igual a 0.');
    }

    if (!input.stock || !['EN STOCK', 'BAJO STOCK', 'SIN STOCK', 'A PEDIDO'].includes(input.stock)) {
        errors.push('El estado de stock no es válido.');
    }

    const numericFields: Array<[string, number | undefined]> = [
        ['pesoKg', input.pesoKg],
        ['altoMm', input.altoMm],
        ['anchoMm', input.anchoMm],
        ['largoMm', input.largoMm],
    ];

    numericFields.forEach(([field, value]) => {
        if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
            errors.push(`El campo ${field} debe ser un número válido mayor o igual a 0.`);
        }
    });

    return { ok: errors.length === 0, errors };
}

export function validateAdminProductActionInput(input: Partial<AdminProductActionDTO>): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.id?.trim()) {
        errors.push('El identificador del producto es obligatorio.');
    }

    return { ok: errors.length === 0, errors };
}
