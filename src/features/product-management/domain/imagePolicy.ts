/**
 * imagePolicy.ts
 *
 * Política oficial de imágenes de productos.
 * Centraliza todos los límites y restricciones para que sean
 * referenciables tanto desde los use-cases (servidor) como
 * desde la UI del administrador (cliente).
 *
 * Reglas:
 *  - Máximo 2 imágenes por producto.
 *  - Peso máximo por archivo: 2 MB.
 *  - Tipos MIME permitidos: JPEG, PNG y WebP.
 *  - Dimensiones mínimas recomendadas: 400 × 400 px.
 *  - Relación de aspecto objetivo: 4:3 (1200 × 900 px).
 */

/* ─── Constantes exportadas ─── */

/** Número máximo de imágenes por producto. */
export const IMAGE_POLICY_MAX_COUNT = 2;

/** Tamaño máximo por archivo en bytes (2 MB). */
export const IMAGE_POLICY_MAX_BYTES = 2 * 1024 * 1024;

/** Etiqueta legible del límite de tamaño. */
export const IMAGE_POLICY_MAX_BYTES_LABEL = '2 MB';

/** MIME types aceptados. */
export const IMAGE_POLICY_ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

export type AllowedImageMime = (typeof IMAGE_POLICY_ALLOWED_MIME_TYPES)[number];

/** Extensiones legibles para mostrar en mensajes de error. */
export const IMAGE_POLICY_ALLOWED_EXTENSIONS_LABEL = 'JPG, PNG o WebP';

/** Dimensión mínima (ancho y alto) en píxeles — orientativa en cliente. */
export const IMAGE_POLICY_MIN_DIMENSION_PX = 400;

/** Relación de aspecto objetivo procesada por el backend (4:3). */
export const IMAGE_POLICY_TARGET_WIDTH = 1200;
export const IMAGE_POLICY_TARGET_HEIGHT = 900;

/** Calidad WebP aplicada durante la conversión en servidor. */
export const IMAGE_POLICY_WEBP_QUALITY = 0.85;

/* ─── Tipos ─── */

export interface ImagePolicyViolation {
    /** Índice del archivo que violó la política (0-based). */
    index: number;
    /** Nombre del archivo, si está disponible. */
    fileName?: string;
    /** Mensaje de error legible. */
    message: string;
}

export interface ImagePolicyResult {
    ok: boolean;
    violations: ImagePolicyViolation[];
    /** Errores consolidados listos para mostrar. */
    errors: string[];
}

/* ─── Validador de política ─── */

/**
 * Valida una lista de archivos de imagen contra la política del producto.
 * Puede usarse tanto en client-side como en server-side (sin acceso al DOM).
 */
export function validateProductImagePolicy(
    files: Array<{ name?: string; size: number; type: string }>,
): ImagePolicyResult {
    const violations: ImagePolicyViolation[] = [];

    if (files.length > IMAGE_POLICY_MAX_COUNT) {
        violations.push({
            index: -1,
            message: `Solo se permiten hasta ${IMAGE_POLICY_MAX_COUNT} imágenes por producto.`,
        });
    }

    files.forEach((file, index) => {
        if (!(IMAGE_POLICY_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
            violations.push({
                index,
                fileName: file.name,
                message: `La imagen "${file.name ?? `#${index + 1}`}" tiene un formato no permitido. Usa ${IMAGE_POLICY_ALLOWED_EXTENSIONS_LABEL}.`,
            });
        }

        if (file.size > IMAGE_POLICY_MAX_BYTES) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            violations.push({
                index,
                fileName: file.name,
                message: `La imagen "${file.name ?? `#${index + 1}`}" pesa ${sizeMb} MB. El límite es ${IMAGE_POLICY_MAX_BYTES_LABEL}.`,
            });
        }
    });

    return {
        ok: violations.length === 0,
        violations,
        errors: violations.map((v) => v.message),
    };
}

/**
 * Valida un único archivo de imagen.
 * Devuelve el array de mensajes de error (vacío = válido).
 */
export function validateSingleImageFile(file: {
    name?: string;
    size: number;
    type: string;
}): string[] {
    const result = validateProductImagePolicy([file]);
    return result.errors.filter((e) => !e.includes('Solo se permiten hasta'));
}
