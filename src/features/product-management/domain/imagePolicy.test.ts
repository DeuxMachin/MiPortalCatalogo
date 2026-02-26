import { describe, expect, it } from 'vitest';
import {
    IMAGE_POLICY_MAX_COUNT,
    IMAGE_POLICY_MAX_BYTES,
    IMAGE_POLICY_ALLOWED_MIME_TYPES,
    validateProductImagePolicy,
    validateSingleImageFile,
} from './imagePolicy';

/* ─── helpers ─── */

const validFile = (overrides?: Partial<{ name: string; size: number; type: string }>) => ({
    name: 'producto.jpg',
    size: 500 * 1024, // 500 KB
    type: 'image/jpeg',
    ...overrides,
});

/* ─── validateProductImagePolicy ─── */

describe('validateProductImagePolicy', () => {
    it('acepta una lista vacía', () => {
        const result = validateProductImagePolicy([]);
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('acepta hasta IMAGE_POLICY_MAX_COUNT archivos válidos', () => {
        const files = Array.from({ length: IMAGE_POLICY_MAX_COUNT }, (_, i) =>
            validFile({ name: `img${i}.jpg` }),
        );
        const result = validateProductImagePolicy(files);
        expect(result.ok).toBe(true);
    });

    it(`rechaza más de ${IMAGE_POLICY_MAX_COUNT} imágenes`, () => {
        const files = Array.from({ length: IMAGE_POLICY_MAX_COUNT + 1 }, (_, i) =>
            validFile({ name: `img${i}.jpg` }),
        );
        const result = validateProductImagePolicy(files);
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(String(IMAGE_POLICY_MAX_COUNT));
    });

    it('rechaza archivo que excede el límite de peso', () => {
        const result = validateProductImagePolicy([
            validFile({ size: IMAGE_POLICY_MAX_BYTES + 1 }),
        ]);
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/MB/);
    });

    it('rechaza MIME type no permitido (image/gif)', () => {
        const result = validateProductImagePolicy([
            validFile({ type: 'image/gif', name: 'animado.gif' }),
        ]);
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/formato/i);
    });

    it('acepta todos los MIME types de la política', () => {
        IMAGE_POLICY_ALLOWED_MIME_TYPES.forEach((mime) => {
            const result = validateProductImagePolicy([validFile({ type: mime })]);
            expect(result.ok).toBe(true);
        });
    });

    it('acumula violaciones múltiples en una sola lista', () => {
        const result = validateProductImagePolicy([
            validFile({ type: 'image/gif', size: IMAGE_POLICY_MAX_BYTES + 100 }),
        ]);
        // tipo incorrecto + peso excedido = 2 violaciones
        expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });

    it('incluye el nombre del archivo en el mensaje de error', () => {
        const result = validateProductImagePolicy([
            validFile({ name: 'mi-imagen.gif', type: 'image/gif' }),
        ]);
        expect(result.errors[0]).toContain('mi-imagen.gif');
    });
});

/* ─── validateSingleImageFile ─── */

describe('validateSingleImageFile', () => {
    it('retorna array vacío para archivo válido', () => {
        expect(validateSingleImageFile(validFile())).toHaveLength(0);
    });

    it('retorna errores para archivo no válido', () => {
        const errors = validateSingleImageFile(validFile({ type: 'application/pdf' }));
        expect(errors.length).toBeGreaterThan(0);
    });

    it('no incluye el error de conteo máximo', () => {
        // validateSingleImageFile sólo valida un archivo, no debería mencionar el límite de cuántas fotos
        const errors = validateSingleImageFile(validFile({ type: 'image/gif' }));
        const countError = errors.find((e) => e.includes('Solo se permiten'));
        expect(countError).toBeUndefined();
    });
});
