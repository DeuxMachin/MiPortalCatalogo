import { describe, expect, it } from 'vitest';
import {
    validateAdminProductInput,
    validateAdminProductActionInput,
    validateAdminUploadImage,
    validateAdminUploadImageList,
    IMAGE_POLICY_MAX_COUNT,
    IMAGE_POLICY_MAX_BYTES,
} from './adminProductSchemas';
import type { AdminProductInputDTO, AdminUploadImageDTO } from './adminProductSchemas';

/* ─── helpers ─── */

const baseProductDTO = (): AdminProductInputDTO => ({
    title: 'Separador cono 20mm',
    sku: 'SEP-CONO-20',
    price: 1290,
    categoryId: 'cat-001',
    description: 'Descripción del producto',
    stock: 'EN STOCK',
    isPublished: true,
    precioVisible: true,
});

const validImageFile = (name = 'imagen.jpg', size = 400 * 1024): File => {
    const f = new File(['data'], name, { type: 'image/jpeg' });
    Object.defineProperty(f, 'size', { value: size });
    return f;
};

/* ─── validateAdminProductInput ─── */

describe('validateAdminProductInput', () => {
    it('acepta un DTO completo y válido', () => {
        expect(validateAdminProductInput(baseProductDTO()).ok).toBe(true);
    });

    it('requiere title no vacío', () => {
        const result = validateAdminProductInput({ ...baseProductDTO(), title: '' });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/nombre/i);
    });

    it('requiere categoryId no vacío', () => {
        const result = validateAdminProductInput({ ...baseProductDTO(), categoryId: ' ' });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/categor/i);
    });

    it('rechaza precio negativo', () => {
        const result = validateAdminProductInput({ ...baseProductDTO(), price: -100 });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/precio/i);
    });

    it('rechaza stock inválido', () => {
        const result = validateAdminProductInput({ ...baseProductDTO(), stock: 'DESCONOCIDO' as any });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/stock/i);
    });

    it('rechaza pesoKg negativo', () => {
        const result = validateAdminProductInput({ ...baseProductDTO(), pesoKg: -1 });
        expect(result.ok).toBe(false);
    });

    it('acepta precio igual a 0 (producto sin precio visible)', () => {
        expect(validateAdminProductInput({ ...baseProductDTO(), price: 0 }).ok).toBe(true);
    });

    it('acumula múltiples errores', () => {
        const result = validateAdminProductInput({ title: '', categoryId: '', stock: 'MAL' as any });
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
});

/* ─── validateAdminProductActionInput ─── */

describe('validateAdminProductActionInput', () => {
    it('acepta id válido', () => {
        expect(validateAdminProductActionInput({ id: 'prod-123' }).ok).toBe(true);
    });

    it('rechaza id vacío', () => {
        const result = validateAdminProductActionInput({ id: '' });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/identificador/i);
    });

    it('rechaza id undefined', () => {
        expect(validateAdminProductActionInput({}).ok).toBe(false);
    });
});

/* ─── validateAdminUploadImage ─── */

describe('validateAdminUploadImage', () => {
    it('acepta DTO con archivo válido', () => {
        const dto: AdminUploadImageDTO = { file: validImageFile() };
        expect(validateAdminUploadImage(dto).ok).toBe(true);
    });

    it('acepta DTO con URL no vacía', () => {
        const dto: AdminUploadImageDTO = { url: 'https://cdn.example.com/img.jpg' };
        expect(validateAdminUploadImage(dto).ok).toBe(true);
    });

    it('rechaza DTO sin file ni url', () => {
        expect(validateAdminUploadImage({}).ok).toBe(false);
    });

    it('rechaza archivo con tipo no permitido', () => {
        const badFile = new File(['data'], 'foto.gif', { type: 'image/gif' });
        const result = validateAdminUploadImage({ file: badFile });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/formato/i);
    });

    it('rechaza archivo que supera el límite de peso', () => {
        const bigFile = new File(['x'.repeat(10)], 'grande.jpg', { type: 'image/jpeg' });
        Object.defineProperty(bigFile, 'size', { value: IMAGE_POLICY_MAX_BYTES + 1 });
        const result = validateAdminUploadImage({ file: bigFile });
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(/MB/);
    });
});

/* ─── validateAdminUploadImageList ─── */

describe('validateAdminUploadImageList', () => {
    it('acepta lista vacía', () => {
        expect(validateAdminUploadImageList([]).ok).toBe(true);
    });

    it(`acepta hasta ${IMAGE_POLICY_MAX_COUNT} DTOs válidos`, () => {
        const list: AdminUploadImageDTO[] = Array.from({ length: IMAGE_POLICY_MAX_COUNT }, () => ({
            url: 'https://cdn.example.com/img.jpg',
        }));
        expect(validateAdminUploadImageList(list).ok).toBe(true);
    });

    it(`rechaza más de ${IMAGE_POLICY_MAX_COUNT} DTOs`, () => {
        const list: AdminUploadImageDTO[] = Array.from({ length: IMAGE_POLICY_MAX_COUNT + 1 }, () => ({
            url: 'https://cdn.example.com/img.jpg',
        }));
        const result = validateAdminUploadImageList(list);
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toMatch(String(IMAGE_POLICY_MAX_COUNT));
    });

    it('propaga errores de archivos locales inválidos', () => {
        const badFile = new File(['data'], 'mala.bmp', { type: 'image/bmp' });
        const result = validateAdminUploadImageList([{ file: badFile }]);
        expect(result.ok).toBe(false);
    });
});
