import { describe, expect, it, vi } from 'vitest';
import type { ProductRepository } from '../domain/ProductRepository';
import { createProductUseCase } from './CreateProduct';
import type { AdminProductInputDTO } from './adminProductSchemas';
import { IMAGE_POLICY_MAX_COUNT, IMAGE_POLICY_MAX_BYTES } from '../domain/imagePolicy';

/* ─── helpers ─── */

const baseDTO = (): AdminProductInputDTO => ({
    title: 'Separador cono 20mm',
    sku: 'SEP-20',
    price: 1290,
    categoryId: 'cat-001',
    description: 'Descripción',
    stock: 'EN STOCK',
    isPublished: true,
    precioVisible: true,
});

const makeRepo = (overrides?: Partial<ProductRepository>): ProductRepository => ({
    createProduct: vi.fn().mockResolvedValue({ success: true, id: 'prod-abc' }),
    updateProduct: vi.fn().mockResolvedValue({ success: true }),
    setProductImages: vi.fn().mockResolvedValue({ success: true }),
    deleteProduct: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
});

const fakeJpeg = (name = 'img.jpg', size = 400 * 1024): File => {
    const f = new File(['data'], name, { type: 'image/jpeg' });
    Object.defineProperty(f, 'size', { value: size });
    return f;
};

/* ─── tests ─── */

describe('createProductUseCase', () => {
    it('llama a repository.createProduct con DTO válido y sin imágenes', async () => {
        const repo = makeRepo();
        const result = await createProductUseCase(repo, baseDTO(), []);
        expect(result.success).toBe(true);
        expect(repo.createProduct).toHaveBeenCalledOnce();
    });

    it('retorna error cuando el DTO es inválido (sin title)', async () => {
        const repo = makeRepo();
        const result = await createProductUseCase(repo, { ...baseDTO(), title: '' }, []);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(repo.createProduct).not.toHaveBeenCalled();
    });

    it('retorna error cuando la categoría está vacía', async () => {
        const repo = makeRepo();
        const result = await createProductUseCase(repo, { ...baseDTO(), categoryId: '' }, []);
        expect(result.success).toBe(false);
        expect(repo.createProduct).not.toHaveBeenCalled();
    });

    it('retorna error cuando el stock no es válido', async () => {
        const repo = makeRepo();
        const result = await createProductUseCase(repo, { ...baseDTO(), stock: 'MALO' as any }, []);
        expect(result.success).toBe(false);
    });

    it('acepta imágenes válidas y las pasa al repositorio', async () => {
        const repo = makeRepo();
        const images = [{ source: fakeJpeg(), crop: { zoom: 1, offsetX: 0, offsetY: 0 } }];
        const result = await createProductUseCase(repo, baseDTO(), images);
        expect(result.success).toBe(true);
        expect(repo.createProduct).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Separador cono 20mm' }),
            expect.arrayContaining([images[0]]),
        );
    });

    it(`rechaza más de ${IMAGE_POLICY_MAX_COUNT} imágenes`, async () => {
        const repo = makeRepo();
        const images = Array.from({ length: IMAGE_POLICY_MAX_COUNT + 1 }, (_, i) => ({
            source: fakeJpeg(`img${i}.jpg`),
        }));
        const result = await createProductUseCase(repo, baseDTO(), images);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(String(IMAGE_POLICY_MAX_COUNT));
        expect(repo.createProduct).not.toHaveBeenCalled();
    });

    it('rechaza imagen File con tamaño superior al límite', async () => {
        const repo = makeRepo();
        const oversized = fakeJpeg('grande.jpg', IMAGE_POLICY_MAX_BYTES + 1);
        const images = [{ source: oversized }];
        const result = await createProductUseCase(repo, baseDTO(), images);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/MB/);
        expect(repo.createProduct).not.toHaveBeenCalled();
    });

    it('rechaza imagen File con MIME no permitido', async () => {
        const repo = makeRepo();
        const badFile = new File(['data'], 'foto.gif', { type: 'image/gif' });
        Object.defineProperty(badFile, 'size', { value: 100 * 1024 });
        const images = [{ source: badFile }];
        const result = await createProductUseCase(repo, baseDTO(), images);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/formato/i);
    });

    it('omite silenciosamente inputs de imagen que sean strings (URLs de storage)', async () => {
        // URLs de storage no se validan de tipo/peso — se pasan directo al repo
        const repo = makeRepo();
        const images: any[] = ['https://cdn.supabase.com/storage/v1/object/public/catalogo-productos/prod/1.webp'];
        const result = await createProductUseCase(repo, baseDTO(), images);
        expect(result.success).toBe(true);
    });

    it('propaga el error del repositorio al llamador', async () => {
        const repo = makeRepo({
            createProduct: vi.fn().mockResolvedValue({ success: false, error: 'DB constraint violation' }),
        });
        const result = await createProductUseCase(repo, baseDTO(), []);
        expect(result.success).toBe(false);
        expect(result.error).toContain('DB constraint violation');
    });

    it('pasa los campos opcionales normalizados al repositorio', async () => {
        const repo = makeRepo();
        await createProductUseCase(repo, baseDTO(), []);
        const callArg = (repo.createProduct as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArg.specs).toEqual({});
        expect(callArg.quickSpecs).toEqual([]);
        expect(callArg.recursos).toEqual([]);
        expect(callArg.variants).toEqual([]);
    });
});
