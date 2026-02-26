import type { StockStatus } from '@/src/shared/types/common';
import {
    IMAGE_POLICY_MAX_COUNT,
    IMAGE_POLICY_MAX_BYTES,
    IMAGE_POLICY_MAX_BYTES_LABEL,
    IMAGE_POLICY_ALLOWED_MIME_TYPES,
    IMAGE_POLICY_ALLOWED_EXTENSIONS_LABEL,
    validateProductImagePolicy,
    type ImagePolicyResult,
} from '@/src/features/product-management/domain/imagePolicy';

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

/* ─────────────────────────────────────────────────────────────────────────────
   DTOs y validadores de IMÁGENES
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * DTO para una imagen que el administrador sube al crear/editar un producto.
 * `file` es opcional si la imagen ya está en storage (se pasa como URL o path).
 */
export interface AdminUploadImageDTO {
    /** Archivo seleccionado por el usuario desde disco. */
    file?: File;
    /** URL externa o ruta de storage existente (alternativa a `file`). */
    url?: string;
    /** Recorte y posicionamiento opcionales. */
    crop?: {
        zoom?: number;
        offsetX?: number;
        offsetY?: number;
    };
}

/**
 * Valida un único `AdminUploadImageDTO`.
 * Útil para feedback instantáneo al seleccionar un archivo en la UI.
 */
export function validateAdminUploadImage(dto: AdminUploadImageDTO): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!dto.file && !dto.url?.trim()) {
        errors.push('Debes proporcionar un archivo o una URL de imagen.');
        return { ok: false, errors };
    }

    if (dto.file) {
        const fileErrors = (() => {
            const violations: string[] = [];

            if (!(IMAGE_POLICY_ALLOWED_MIME_TYPES as readonly string[]).includes(dto.file.type)) {
                violations.push(
                    `Formato no permitido: ${dto.file.type || 'desconocido'}. Usa ${IMAGE_POLICY_ALLOWED_EXTENSIONS_LABEL}.`,
                );
            }

            if (dto.file.size > IMAGE_POLICY_MAX_BYTES) {
                const sizeMb = (dto.file.size / (1024 * 1024)).toFixed(1);
                violations.push(
                    `El archivo pesa ${sizeMb} MB. El límite es ${IMAGE_POLICY_MAX_BYTES_LABEL}.`,
                );
            }

            return violations;
        })();

        errors.push(...fileErrors);
    }

    return { ok: errors.length === 0, errors };
}

/**
 * Valida la lista completa de imágenes antes de enviar el formulario.
 * Aplica la política completa: cantidad máxima, tipos y pesos.
 */
export function validateAdminUploadImageList(dtos: AdminUploadImageDTO[]): ImagePolicyResult {
    const fileLike = dtos
        .filter((d) => !!d.file)
        .map((d) => ({
            name: d.file!.name,
            size: d.file!.size,
            type: d.file!.type,
        }));

    const countResult = validateProductImagePolicy(
        dtos.map((d) =>
            d.file
                ? { name: d.file.name, size: d.file.size, type: d.file.type }
                : { name: d.url, size: 0, type: 'image/webp' }, // URLs remotas se asumen válidas en tipo
        ),
    );

    // Para URLs remotas no se valida peso/tipo (ya están en storage).
    // Re-validamos sólo archivos locales pero respetamos el conteo total.
    const fileOnlyResult = validateProductImagePolicy(fileLike);
    const allErrors = [
        ...countResult.violations.filter((v) => v.index === -1).map((v) => v.message),
        ...fileOnlyResult.violations.filter((v) => v.index !== -1).map((v) => v.message),
    ];

    return {
        ok: allErrors.length === 0,
        violations: [
            ...countResult.violations.filter((v) => v.index === -1),
            ...fileOnlyResult.violations.filter((v) => v.index !== -1),
        ],
        errors: allErrors,
    };
}

/* ─── Re-exportar constantes de política para uso en la UI ─── */
export {
    IMAGE_POLICY_MAX_COUNT,
    IMAGE_POLICY_MAX_BYTES,
    IMAGE_POLICY_MAX_BYTES_LABEL,
    IMAGE_POLICY_ALLOWED_MIME_TYPES,
    IMAGE_POLICY_ALLOWED_EXTENSIONS_LABEL,
};
