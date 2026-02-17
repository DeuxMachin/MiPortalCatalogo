'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { Product, ProductVariant } from '@/src/entities/product/model/types';
import { createProductUseCase } from '@/src/features/product-management/application/CreateProduct';
import { deleteProductUseCase } from '@/src/features/product-management/application/DeleteProduct';
import { publishProductUseCase } from '@/src/features/product-management/application/PublishProduct';
import { reorderImagesUseCase } from '@/src/features/product-management/application/ReorderImages';
import { reportError } from '@/src/shared/lib/errorTracking';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

const DEFAULT_IMAGE =
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;
}

interface ProductResult {
    success: boolean;
    error?: string;
    id?: string;
}

type ImageCrop = {
    /** 1 = sin zoom, >1 acerca */
    zoom?: number;
    /** -1..1 (izq..der) */
    offsetX?: number;
    /** -1..1 (arriba..abajo) */
    offsetY?: number;
};

type ProductImageInput = string | File | { source: string | File; crop?: ImageCrop };

interface UpdateOptions {
    refetch?: boolean;
}

interface ProductContextValue extends ProductState {
    addProduct: (data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]) => Promise<ProductResult>;
    updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>, options?: UpdateOptions) => Promise<ProductResult>;
    setProductImages: (id: string, imageInputs: ProductImageInput[]) => Promise<ProductResult>;
    deleteProduct: (id: string) => Promise<ProductResult>;
    getProduct: (id: string) => Product | undefined;
    getRelatedProducts: (productId: string, limit?: number) => Product[];
    refetch: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toSlug(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

function normalizeVariantStock(value: unknown): Product['stock'] {
    const raw = String(value ?? '').toUpperCase().trim();
    if (raw === 'EN STOCK' || raw === 'SIN STOCK' || raw === 'A PEDIDO' || raw === 'BAJO STOCK') {
        return raw as Product['stock'];
    }
    return 'EN STOCK';
}

/* ─── In-memory cache shared across all hook instances ─── */
let _cache: Product[] | null = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 1 minute

const STORAGE_BUCKET = 'catalogo-productos';
const STORAGE_PREFIX = 'productos';

function isCacheValid(): boolean {
    return _cache !== null && Date.now() - _cacheTs < CACHE_TTL;
}

function mapRowToProduct(row: any, resolveImageUrl: (pathOrUrl: string) => string): Product {
    const extras = (row.especificacion_variada ?? {}) as Record<string, any>;
    const masterSpecs = (extras.specs && typeof extras.specs === 'object') ? extras.specs : {};
    const masterQuickSpecs = Array.isArray(row.quick_specs) ? row.quick_specs : [];
    const recursos = Array.isArray(row.recursos) ? row.recursos : [];

    const variantRows = Array.isArray(row.producto_variantes) ? row.producto_variantes : [];
    const variants: ProductVariant[] = variantRows.map((variant: any): ProductVariant => {
        const variantExtras = (variant.especificacion_variada ?? {}) as Record<string, any>;
        const variantSpecs = (variantExtras.specs && typeof variantExtras.specs === 'object') ? variantExtras.specs : {};
        const variantQuickSpecs = Array.isArray(variant.quick_specs) ? variant.quick_specs : [];

        return {
            id: String(variant.id),
            sku: String(variant.sku ?? ''),
            price: Number(variant.precio ?? 0),
            unit: String(variant.moneda ?? 'CLP'),
            stock: normalizeVariantStock(variant.estado_stock),
            medida: variant.medida ?? undefined,
            presentacion: variant.presentacion ?? undefined,
            unidadVenta: variant.unidad_venta ?? undefined,
            altoMm: toNumber(variant.alto_mm),
            anchoMm: toNumber(variant.ancho_mm),
            largoMm: toNumber(variant.largo_mm),
            pesoKg: toNumber(variant.peso_kg),
            material: variant.material ?? undefined,
            color: variant.color ?? undefined,
            contenido: variant.contenido ?? undefined,
            specs: variantSpecs,
            quickSpecs: variantQuickSpecs,
            isActive: Boolean(variant.activo ?? true),
        };
    });

    const primaryVariant = variants.find((variant) => variant.isActive) ?? variants[0];
    const specs = primaryVariant?.specs ?? masterSpecs;
    const quickSpecs = primaryVariant?.quickSpecs ?? masterQuickSpecs;

    const imagePaths = Array.isArray(row.producto_imagenes)
        ? row.producto_imagenes
            .slice()
            .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((img: any) => img.path_storage)
            .filter(Boolean)
        : [];

    const images = imagePaths.map(resolveImageUrl).filter(Boolean);

    return {
        id: String(row.id),
        sku: String(primaryVariant?.sku ?? extras.sku ?? row.slug ?? ''),
        title: row.nombre ?? 'Producto Sin Nombre',
        categoryId: String(row.categoria_id ?? ''),
        category: row.categorias?.nombre ?? 'Sin Categoría',
        price: Number(primaryVariant?.price ?? row.precio ?? 0),
        unit: primaryVariant?.unit ?? row.moneda ?? 'CLP',
        stock: primaryVariant?.stock ?? normalizeVariantStock(extras.stock),
        description: row.descripcion ?? '',
        specs,
        fullSpecs: specs,
        images: images.length > 0 ? images : [DEFAULT_IMAGE],
        isPublished: row.activo ?? true,
        precioVisible: row.precio_visible ?? true,
        color: primaryVariant?.color ?? row.color ?? undefined,
        material: primaryVariant?.material ?? row.material ?? undefined,
        contenido: primaryVariant?.contenido ?? extras.contenido ?? undefined,
        unidadMedida: primaryVariant?.unidadVenta ?? extras.unidadMedida ?? undefined,
        presentacion: primaryVariant?.presentacion ?? extras.presentacion ?? undefined,
        pesoKg: primaryVariant?.pesoKg ?? toNumber(row.peso_kg),
        altoMm: primaryVariant?.altoMm ?? toNumber(row.alto_mm),
        anchoMm: primaryVariant?.anchoMm ?? toNumber(row.ancho_mm),
        largoMm: primaryVariant?.largoMm ?? toNumber(row.largo_mm),
        quickSpecs,
        notaTecnica: row.nota_tecnica ?? undefined,
        recursos,
        createdAt: row.creado_en ?? undefined,
        variants,
    };
}

function normalizeSupabaseError(err: unknown, fallback: string): string {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err instanceof Error) {
        // fetch abort (we add AbortController timeout in browser)
        if (err.name === 'AbortError') return 'Tiempo de espera agotado al conectar con la base de datos.';
        return err.message || fallback;
    }
    return fallback;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ProductContext = createContext<ProductContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ProductProvider({ children }: { children: ReactNode }) {
    const sb = useRef(getSupabaseBrowserClient());
    const [state, setState] = useState<ProductState>({
        products: _cache ?? [],
        loading: !isCacheValid(),
        error: null,
    });

    const fetchProducts = useCallback(async (force = false) => {
        if (!force && isCacheValid()) {
            setState((s) => ({ ...s, products: _cache ?? [], loading: false }));
            return;
        }

        setState((s) => ({ ...s, loading: true, error: null }));

        const timeout = setTimeout(() => {
            setState((s) => ({ ...s, loading: false, error: s.error ?? 'Tiempo de espera agotado' }));
        }, 4000);

        try {
            const { data, error } = await sb.current
                .from('productos')
                .select('*, categorias (nombre), producto_imagenes (path_storage, orden), producto_variantes (*)')
                .order('creado_en', { ascending: false });

            clearTimeout(timeout);

            if (error) {
                console.error('[Products] Fetch error:', error.message);
                setState((s) => ({ ...s, loading: false, error: error.message }));
                void reportError({
                    error: error.message,
                    severity: 'error',
                    source: 'client',
                    route: '/catalog',
                    action: 'fetch_products',
                    context: { module: 'ProductContext' },
                });
                return;
            }

            const resolveImageUrl = (pathOrUrl: string) => {
                if (!pathOrUrl) return '';
                if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
                const { data: publicData } = sb.current.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(pathOrUrl);
                return publicData.publicUrl;
            };

            const products = (data ?? []).map((row: any) => mapRowToProduct(row, resolveImageUrl));
            _cache = products;
            _cacheTs = Date.now();
            setState({ products, loading: false, error: null });
        } catch (err) {
            clearTimeout(timeout);
            console.error('[Products] Unexpected error:', err);
            setState((s) => ({ ...s, loading: false, error: 'Error al cargar productos' }));
            void reportError({
                error: err,
                severity: 'error',
                source: 'client',
                route: '/catalog',
                action: 'fetch_products_unexpected',
                context: { module: 'ProductContext' },
            });
        }
    }, []);

    const triggerRefetch = useCallback(() => {
        // Invalidate cache and refetch in background.
        _cacheTs = 0;
        void fetchProducts(true);
    }, [fetchProducts]);

    const toWebpBlob = useCallback(async (blob: Blob, crop?: ImageCrop): Promise<Blob> => {
        // Convert to WebP and (optionally) apply a crop/zoom to a fixed aspect ratio.
        // If conversion fails, upload original blob.
        try {
            const bitmap: ImageBitmap = await createImageBitmap(blob);

            // Target aspect: 4:3 (matches product gallery)
            const targetW = 1200;
            const targetH = 900;

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return blob;

            const zoom = Math.max(1, Math.min(3, crop?.zoom ?? 1));
            const offsetX = Math.max(-1, Math.min(1, crop?.offsetX ?? 0));
            const offsetY = Math.max(-1, Math.min(1, crop?.offsetY ?? 0));

            // Cover scale, then apply extra zoom.
            const coverScale = Math.max(targetW / bitmap.width, targetH / bitmap.height);
            const scale = coverScale * zoom;
            const drawW = bitmap.width * scale;
            const drawH = bitmap.height * scale;

            const maxPanX = Math.max(0, (drawW - targetW) / 2);
            const maxPanY = Math.max(0, (drawH - targetH) / 2);
            const panX = offsetX * maxPanX;
            const panY = offsetY * maxPanY;

            const dx = (targetW - drawW) / 2 + panX;
            const dy = (targetH - drawH) / 2 + panY;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(bitmap, dx, dy, drawW, drawH);
            bitmap.close();

            const webp = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/webp', 0.85);
            });

            return webp ?? blob;
        } catch {
            return blob;
        }
    }, []);

    const setProductImagesCore = useCallback(
        async (productId: string, imageInputs: ProductImageInput[]): Promise<ProductResult> => {
            try {
                const inputs = (imageInputs ?? []).filter(Boolean).slice(0, 4);

                // Get existing image rows so we can delete objects.
                const { data: existing, error: existingErr } = await sb.current
                    .from('producto_imagenes')
                    .select('path_storage')
                    .eq('producto_id', productId);

                if (existingErr) {
                    console.warn('[Products] Existing images fetch error:', existingErr.message);
                }

                const existingPaths = (existing ?? [])
                    .map((r: any) => String(r.path_storage ?? ''))
                    .filter((p) => p && !/^https?:\/\//i.test(p));

                // Delete DB rows first (keeps ordering clean)
                const { error: delRowsErr } = await sb.current
                    .from('producto_imagenes')
                    .delete()
                    .eq('producto_id', productId);

                if (delRowsErr) {
                    return { success: false, error: delRowsErr.message };
                }

                // Delete storage objects (best-effort)
                if (existingPaths.length > 0) {
                    const { error: removeErr } = await sb.current.storage
                        .from(STORAGE_BUCKET)
                        .remove(existingPaths);
                    if (removeErr) {
                        console.warn('[Products] Storage remove error:', removeErr.message);
                    }
                }

                if (inputs.length === 0) {
                    triggerRefetch();
                    return { success: true };
                }

                const rowsToInsert: Array<{ producto_id: string; path_storage: string; orden: number }> = [];

                for (let i = 0; i < inputs.length; i += 1) {
                    const order = i + 1;
                    const input = inputs[i];

                    const source = (typeof input === 'object' && input && 'source' in input)
                        ? (input as { source: string | File; crop?: ImageCrop }).source
                        : input;
                    const crop = (typeof input === 'object' && input && 'source' in input)
                        ? (input as { source: string | File; crop?: ImageCrop }).crop
                        : undefined;

                    let sourceBlob: Blob;
                    if (typeof source === 'string') {
                        const res = await fetch(source);
                        if (!res.ok) {
                            return { success: false, error: `No se pudo descargar la imagen ${order} (URL).` };
                        }
                        sourceBlob = await res.blob();
                    } else {
                        sourceBlob = source;
                    }

                    const webpBlob = await toWebpBlob(sourceBlob, crop);
                    const path = `${STORAGE_PREFIX}/${productId}/${order}.webp`;

                    const { error: upErr } = await sb.current.storage
                        .from(STORAGE_BUCKET)
                        .upload(path, webpBlob, {
                            upsert: true,
                            contentType: 'image/webp',
                        });

                    if (upErr) {
                        return { success: false, error: upErr.message };
                    }

                    rowsToInsert.push({ producto_id: productId, path_storage: path, orden: order });
                }

                const { error: insRowsErr } = await sb.current
                    .from('producto_imagenes')
                    .insert(rowsToInsert);

                if (insRowsErr) {
                    return { success: false, error: insRowsErr.message };
                }

                triggerRefetch();
                return { success: true };
            } catch (err) {
                console.error('[Products] setProductImages crashed:', err);
                void reportError({
                    error: err,
                    severity: 'error',
                    source: 'client',
                    route: '/admin/products',
                    action: 'set_product_images',
                    critical: true,
                });
                return { success: false, error: normalizeSupabaseError(err, 'No se pudieron guardar las imágenes') };
            }
        },
        [sb, toWebpBlob, triggerRefetch],
    );

    const setProductVariantsCore = useCallback(
        async (productId: string, variants: Product['variants'] = []): Promise<ProductResult> => {
            try {
                // Filtrar solo variantes con datos válidos
                const normalized = (variants ?? [])
                    .filter((variant) => variant && (variant?.sku?.trim() || variant?.price || variant?.stock))
                    .map((variant) => {
                        // Auto-generar SKU si falta
                        const finalSku = variant.sku?.trim() || `SKU-${productId}-${Date.now()}`;
                        return {
                            producto_id: productId,
                            sku: finalSku,
                            precio: Number(variant.price ?? 0),
                            moneda: variant.unit ?? 'CLP',
                            estado_stock: variant.stock ?? 'EN STOCK',
                            medida: variant.medida ?? null,
                            presentacion: variant.presentacion ?? null,
                            unidad_venta: variant.unidadVenta ?? null,
                            alto_mm: variant.altoMm ?? null,
                            ancho_mm: variant.anchoMm ?? null,
                            largo_mm: variant.largoMm ?? null,
                            peso_kg: variant.pesoKg ?? null,
                            material: variant.material ?? null,
                            color: variant.color ?? null,
                            contenido: variant.contenido ?? null,
                            especificacion_variada: { specs: variant.specs ?? {} },
                            quick_specs: variant.quickSpecs ?? [],
                            activo: variant.isActive ?? true,
                        };
                    });

                console.log(`[setProductVariantsCore] Guardando ${normalized.length} variantes para producto ${productId}`);

                const { error: deleteErr } = await sb.current
                    .from('producto_variantes')
                    .delete()
                    .eq('producto_id', productId);

                if (deleteErr) {
                    console.error('[setProductVariantsCore] Error eliminando variantes:', deleteErr.message);
                    return { success: false, error: deleteErr.message };
                }

                if (normalized.length > 0) {
                    const { error: insertErr } = await sb.current
                        .from('producto_variantes')
                        .insert(normalized);
                    if (insertErr) {
                        console.error('[setProductVariantsCore] Error insertando variantes:', insertErr.message);
                        return { success: false, error: insertErr.message };
                    }
                }

                return { success: true };
            } catch (err) {
                console.error('[setProductVariantsCore] Exception:', err);
                return { success: false, error: normalizeSupabaseError(err, 'No se pudieron guardar las variantes') };
            }
        },
        [],
    );

    useEffect(() => {
        queueMicrotask(() => {
            void fetchProducts();
        });
    }, [fetchProducts]);

    const addProductCore = useCallback(
        async (data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]): Promise<ProductResult> => {
            try {
                const slugBase = data.sku?.trim() || data.title;
                const slug = toSlug(slugBase || `producto-${Date.now()}`);

                const payload = {
                    nombre: data.title,
                    slug,
                    descripcion: data.description ?? null,
                    categoria_id: data.categoryId,
                    activo: data.isPublished ?? true,
                    precio_visible: data.precioVisible ?? true,
                    nota_tecnica: data.notaTecnica ?? null,
                    recursos: data.recursos ?? [],
                    tabs: {},
                };

                const { data: inserted, error } = await sb.current
                    .from('productos')
                    .insert(payload)
                    .select('id')
                    .single();

                if (error || !inserted) {
                    console.error('[Products] Insert error:', error?.message);
                    void reportError({
                        error: error?.message ?? 'Insert error',
                        severity: 'error',
                        source: 'client',
                        route: '/admin/products/new',
                        action: 'create_product',
                        context: { categoryId: data.categoryId, sku: data.sku },
                        critical: true,
                    });
                    return { success: false, error: error?.message ?? 'No se pudo crear el producto' };
                }

                const productId = String(inserted.id);

                const variants = (data.variants ?? []).filter((variant) => variant.sku?.trim());
                if (variants.length > 0) {
                    const variantsRes = await setProductVariantsCore(productId, variants);
                    if (!variantsRes.success) return variantsRes;
                } else {
                    const fallbackVariant = {
                        id: `new-${productId}`,
                        sku: data.sku ?? `SKU-${Date.now()}`,
                        price: data.price ?? 0,
                        unit: data.unit ?? 'CLP',
                        stock: data.stock ?? 'EN STOCK',
                        presentacion: data.presentacion,
                        medida: data.contenido,
                        unidadVenta: data.unidadMedida,
                        altoMm: data.altoMm,
                        anchoMm: data.anchoMm,
                        largoMm: data.largoMm,
                        pesoKg: data.pesoKg,
                        material: data.material,
                        color: data.color,
                        contenido: data.contenido,
                        specs: data.fullSpecs ?? data.specs,
                        quickSpecs: data.quickSpecs,
                        isActive: true,
                    };
                    const variantsRes = await setProductVariantsCore(productId, [fallbackVariant]);
                    if (!variantsRes.success) return variantsRes;
                }

                const inputs = (imageInputs ?? data.images ?? []) as ProductImageInput[];
                if (Array.isArray(inputs) && inputs.filter(Boolean).length > 0) {
                    const imgRes = await setProductImagesCore(productId, inputs);
                    if (!imgRes.success) return imgRes;
                } else {
                    triggerRefetch();
                }

                return { success: true, id: productId };
            } catch (err) {
                console.error('[Products] Insert crashed:', err);
                void reportError({
                    error: err,
                    severity: 'fatal',
                    source: 'client',
                    route: '/admin/products/new',
                    action: 'create_product_crash',
                    context: { categoryId: data.categoryId, sku: data.sku },
                    critical: true,
                });
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo crear el producto') };
            }
        },
        [setProductImagesCore, setProductVariantsCore, triggerRefetch],
    );

    const updateProductCore = useCallback(
        async (id: string, updates: Partial<Omit<Product, 'id'>>, options?: UpdateOptions): Promise<ProductResult> => {
            try {
                const current = _cache?.find((p) => p.id === id) ?? state.products.find((p) => p.id === id);

                const payload: Record<string, any> = {};
                if (updates.title !== undefined) payload.nombre = updates.title;
                if (updates.sku !== undefined || updates.title !== undefined) {
                    const base = updates.sku?.trim() || updates.title || current?.sku || current?.title || `producto-${Date.now()}`;
                    payload.slug = toSlug(base);
                }
                if (updates.description !== undefined) payload.descripcion = updates.description;
                if (updates.categoryId !== undefined) payload.categoria_id = updates.categoryId;
                if (updates.isPublished !== undefined) payload.activo = updates.isPublished;
                if (updates.precioVisible !== undefined) payload.precio_visible = updates.precioVisible;
                if (updates.notaTecnica !== undefined) payload.nota_tecnica = updates.notaTecnica ?? null;
                if (updates.recursos !== undefined) payload.recursos = updates.recursos ?? [];

                if (Object.keys(payload).length > 0) {
                    const { data: updatedRows, error } = await sb.current
                        .from('productos')
                        .update(payload)
                        .eq('id', id)
                        .select('id');

                    if (error) {
                        console.error('[Products] Update error:', error.message);
                        void reportError({
                            error: error.message,
                            severity: 'error',
                            source: 'client',
                            route: `/admin/products/${id}/edit`,
                            action: 'update_product',
                            context: { id },
                            critical: true,
                        });
                        return { success: false, error: error.message };
                    }

                    if (!updatedRows || updatedRows.length === 0) {
                        return { success: false, error: 'No se pudo actualizar: producto no encontrado.' };
                    }
                }

                if (updates.images) {
                    const imgRes = await setProductImagesCore(id, updates.images as unknown as ProductImageInput[]);
                    if (!imgRes.success) return imgRes;
                }

                if (updates.variants !== undefined) {
                    const variantRes = await setProductVariantsCore(id, updates.variants);
                    if (!variantRes.success) return variantRes;
                }

                if (options?.refetch !== false) {
                    triggerRefetch();
                }
                return { success: true };
            } catch (err) {
                console.error('[Products] Update crashed:', err);
                void reportError({
                    error: err,
                    severity: 'fatal',
                    source: 'client',
                    route: `/admin/products/${id}/edit`,
                    action: 'update_product_crash',
                    context: { id },
                    critical: true,
                });
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo actualizar el producto') };
            }
        },
        [setProductImagesCore, setProductVariantsCore, state.products, triggerRefetch],
    );

    const deleteProductCore = useCallback(
        async (id: string): Promise<ProductResult> => {
            try {
                let imagesDeleteError: string | null = null;

                const { data: existing, error: existingErr } = await sb.current
                    .from('producto_imagenes')
                    .select('path_storage')
                    .eq('producto_id', id);
                if (existingErr) {
                    console.warn('[Products] Existing images fetch error:', existingErr.message);
                }
                const existingPaths = (existing ?? [])
                    .map((r: any) => String(r.path_storage ?? ''))
                    .filter((p) => p && !/^https?:\/\//i.test(p));

                const { error: imgErr } = await sb.current
                    .from('producto_imagenes')
                    .delete()
                    .eq('producto_id', id);

                if (imgErr) {
                    console.error('[Products] Image rows delete error:', imgErr.message);
                    imagesDeleteError = imgErr.message;
                }

                if (existingPaths.length > 0) {
                    const { error: removeErr } = await sb.current.storage
                        .from(STORAGE_BUCKET)
                        .remove(existingPaths);
                    if (removeErr) {
                        console.warn('[Products] Storage remove error:', removeErr.message);
                    }
                }

                const { error: variantsErr } = await sb.current
                    .from('producto_variantes')
                    .delete()
                    .eq('producto_id', id);
                if (variantsErr) {
                    console.error('[Products] Variants delete error:', variantsErr.message);
                    return { success: false, error: variantsErr.message };
                }

                const { data: deletedRows, error } = await sb.current
                    .from('productos')
                    .delete()
                    .eq('id', id)
                    .select('id');

                if (error) {
                    console.error('[Products] Delete error:', error.message);
                    void reportError({
                        error: error.message,
                        severity: 'error',
                        source: 'client',
                        route: '/admin/products',
                        action: 'delete_product',
                        context: { id },
                        critical: true,
                    });
                    return {
                        success: false,
                        error: imagesDeleteError
                            ? `${error.message} (además falló borrar imágenes: ${imagesDeleteError})`
                            : error.message,
                    };
                }

                if (!deletedRows || deletedRows.length === 0) {
                    return { success: false, error: 'No se pudo eliminar: producto no encontrado.' };
                }

                triggerRefetch();
                return { success: true };
            } catch (err) {
                console.error('[Products] Delete crashed:', err);
                void reportError({
                    error: err,
                    severity: 'fatal',
                    source: 'client',
                    route: '/admin/products',
                    action: 'delete_product_crash',
                    context: { id },
                    critical: true,
                });
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo eliminar el producto') };
            }
        },
        [triggerRefetch],
    );

    const productRepository = useMemo(
        () => ({
            createProduct: addProductCore,
            updateProduct: updateProductCore,
            setProductImages: setProductImagesCore,
            deleteProduct: deleteProductCore,
        }),
        [addProductCore, updateProductCore, setProductImagesCore, deleteProductCore],
    );

    const setProductImages = useCallback(
        async (id: string, imageInputs: ProductImageInput[]): Promise<ProductResult> => {
            return reorderImagesUseCase(productRepository, id, imageInputs);
        },
        [productRepository],
    );

    const addProduct = useCallback(
        async (data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]): Promise<ProductResult> => {
            return createProductUseCase(
                productRepository,
                {
                    title: data.title,
                    sku: data.sku,
                    price: data.price,
                    categoryId: data.categoryId,
                    description: data.description,
                    stock: data.stock,
                    isPublished: data.isPublished,
                    precioVisible: data.precioVisible,
                    unit: data.unit,
                    color: data.color,
                    material: data.material,
                    contenido: data.contenido,
                    unidadMedida: data.unidadMedida,
                    presentacion: data.presentacion,
                    pesoKg: data.pesoKg,
                    altoMm: data.altoMm,
                    anchoMm: data.anchoMm,
                    largoMm: data.largoMm,
                    specs: data.specs,
                    fullSpecs: data.fullSpecs,
                    quickSpecs: data.quickSpecs,
                    notaTecnica: data.notaTecnica,
                    recursos: data.recursos,
                },
                (imageInputs ?? data.images ?? []) as ProductImageInput[],
            );
        },
        [productRepository],
    );

    const updateProduct = useCallback(
        async (id: string, updates: Partial<Omit<Product, 'id'>>, options?: UpdateOptions): Promise<ProductResult> => {
            const { images, ...updatesWithoutImages } = updates as Partial<Omit<Product, 'id'>> & {
                images?: ProductImageInput[];
            };
            const imageInputs = images as ProductImageInput[] | undefined;

            const updateKeys = Object.keys(updatesWithoutImages);
            const onlyPublishToggle =
                updateKeys.length === 1 &&
                updateKeys[0] === 'isPublished' &&
                typeof updatesWithoutImages.isPublished === 'boolean';

            const baseResult = onlyPublishToggle
                ? await publishProductUseCase(productRepository, id, updatesWithoutImages.isPublished as boolean)
                : await productRepository.updateProduct(id, updatesWithoutImages, options);

            if (!baseResult.success) return baseResult;

            if (imageInputs !== undefined) {
                const imageResult = await reorderImagesUseCase(productRepository, id, imageInputs);
                if (!imageResult.success) return imageResult;
            }

            return baseResult;
        },
        [productRepository],
    );

    const deleteProduct = useCallback(
        async (id: string): Promise<ProductResult> => {
            return deleteProductUseCase(productRepository, id);
        },
        [productRepository],
    );

    const getProduct = useCallback(
        (id: string) => state.products.find((p) => p.id === id),
        [state.products],
    );

    const getRelatedProducts = useCallback(
        (productId: string, limit = 20) => {
            const currentProduct = state.products.find((p) => p.id === productId);
            if (!currentProduct) return [];

            // Filtrar productos de la misma categoría que estén publicados, excluyendo el producto actual
            const related = state.products.filter(
                (p) => p.categoryId === currentProduct.categoryId 
                    && p.id !== productId 
                    && p.isPublished
            );

            // Limitar a la cantidad especificada (máximo 20)
            return related.slice(0, Math.min(limit, 20));
        },
        [state.products],
    );

    const value = useMemo<ProductContextValue>(() => ({
        ...state,
        addProduct,
        updateProduct,
        setProductImages,
        deleteProduct,
        getProduct,
        getRelatedProducts,
        refetch: () => fetchProducts(true),
    }), [state, addProduct, updateProduct, setProductImages, deleteProduct, getProduct, getRelatedProducts, fetchProducts]);

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useProducts(): ProductContextValue {
    const ctx = useContext(ProductContext);
    if (!ctx) throw new Error('useProducts debe usarse dentro de un ProductProvider');
    return ctx;
}
