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
import type { Product } from '@/src/entities/product/model/types';
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
    const specs = (extras.specs && typeof extras.specs === 'object') ? extras.specs : {};
    const quickSpecs = Array.isArray(row.quick_specs) ? row.quick_specs : [];
    const recursos = Array.isArray(row.recursos) ? row.recursos : [];

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
        sku: String(extras.sku ?? row.slug ?? ''),
        title: row.nombre ?? 'Producto Sin Nombre',
        categoryId: String(row.categoria_id ?? ''),
        category: row.categorias?.nombre ?? 'Sin Categoría',
        price: Number(row.precio ?? 0),
        unit: row.moneda ?? 'CLP',
        stock: (extras.stock as Product['stock']) ?? 'EN STOCK',
        description: row.descripcion ?? '',
        specs,
        fullSpecs: specs,
        images: images.length > 0 ? images : [DEFAULT_IMAGE],
        isPublished: row.activo ?? true,
        precioVisible: row.precio_visible ?? true,
        color: row.color ?? undefined,
        material: row.material ?? undefined,
        contenido: extras.contenido ?? undefined,
        unidadMedida: extras.unidadMedida ?? undefined,
        presentacion: extras.presentacion ?? undefined,
        pesoKg: toNumber(row.peso_kg),
        altoMm: toNumber(row.alto_mm),
        anchoMm: toNumber(row.ancho_mm),
        largoMm: toNumber(row.largo_mm),
        quickSpecs,
        notaTecnica: row.nota_tecnica ?? undefined,
        recursos,
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
                .select('*, categorias (nombre), producto_imagenes (path_storage, orden)')
                .order('creado_en', { ascending: false });

            clearTimeout(timeout);

            if (error) {
                console.error('[Products] Fetch error:', error.message);
                setState((s) => ({ ...s, loading: false, error: error.message }));
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

    const setProductImages = useCallback(
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
                return { success: false, error: normalizeSupabaseError(err, 'No se pudieron guardar las imágenes') };
            }
        },
        [sb, toWebpBlob, triggerRefetch],
    );

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addProduct = useCallback(
        async (data: Omit<Product, 'id'>, imageInputs?: ProductImageInput[]): Promise<ProductResult> => {
            try {
                const slugBase = data.sku?.trim() || data.title;
                const slug = toSlug(slugBase || `producto-${Date.now()}`);

                const payload = {
                    nombre: data.title,
                    slug,
                    precio: data.price ?? null,
                    moneda: data.unit ?? 'CLP',
                    descripcion: data.description ?? null,
                    unidad_venta: data.unidadMedida ?? null,
                    categoria_id: data.categoryId,
                    activo: data.isPublished ?? true,
                    precio_visible: data.precioVisible ?? true,
                    alto_mm: data.altoMm ?? null,
                    ancho_mm: data.anchoMm ?? null,
                    largo_mm: data.largoMm ?? null,
                    peso_kg: data.pesoKg ?? null,
                    material: data.material ?? null,
                    color: data.color ?? null,
                    especificacion_variada: {
                        specs: data.fullSpecs ?? data.specs ?? {},
                        sku: data.sku ?? null,
                        stock: data.stock ?? null,
                        contenido: data.contenido ?? null,
                        unidadMedida: data.unidadMedida ?? null,
                        presentacion: data.presentacion ?? null,
                    },
                    quick_specs: data.quickSpecs ?? [],
                    nota_tecnica: data.notaTecnica ?? null,
                    recursos: data.recursos ?? [],
                };

                const { data: inserted, error } = await sb.current
                    .from('productos')
                    .insert(payload)
                    .select('id')
                    .single();

                if (error || !inserted) {
                    console.error('[Products] Insert error:', error?.message);
                    return { success: false, error: error?.message ?? 'No se pudo crear el producto' };
                }

                const productId = String(inserted.id);

                const inputs = (imageInputs ?? data.images ?? []) as ProductImageInput[];
                if (Array.isArray(inputs) && inputs.filter(Boolean).length > 0) {
                    const imgRes = await setProductImages(productId, inputs);
                    if (!imgRes.success) return imgRes;
                } else {
                    triggerRefetch();
                }

                return { success: true, id: productId };
            } catch (err) {
                console.error('[Products] Insert crashed:', err);
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo crear el producto') };
            }
        },
        [setProductImages, triggerRefetch],
    );

    const updateProduct = useCallback(
        async (id: string, updates: Partial<Omit<Product, 'id'>>, options?: UpdateOptions): Promise<ProductResult> => {
            try {
                const current = _cache?.find((p) => p.id === id) ?? state.products.find((p) => p.id === id);

                const payload: Record<string, any> = {};
                if (updates.title !== undefined) payload.nombre = updates.title;
                if (updates.sku !== undefined || updates.title !== undefined) {
                    const base = updates.sku?.trim() || updates.title || current?.sku || current?.title || `producto-${Date.now()}`;
                    payload.slug = toSlug(base);
                }
                if (updates.price !== undefined) payload.precio = updates.price;
                if (updates.unit !== undefined) payload.moneda = updates.unit;
                if (updates.description !== undefined) payload.descripcion = updates.description;
                if (updates.categoryId !== undefined) payload.categoria_id = updates.categoryId;
                if (updates.isPublished !== undefined) payload.activo = updates.isPublished;
                if (updates.precioVisible !== undefined) payload.precio_visible = updates.precioVisible;
                if (updates.altoMm !== undefined) payload.alto_mm = updates.altoMm ?? null;
                if (updates.anchoMm !== undefined) payload.ancho_mm = updates.anchoMm ?? null;
                if (updates.largoMm !== undefined) payload.largo_mm = updates.largoMm ?? null;
                if (updates.pesoKg !== undefined) payload.peso_kg = updates.pesoKg ?? null;
                if (updates.material !== undefined) payload.material = updates.material ?? null;
                if (updates.color !== undefined) payload.color = updates.color ?? null;
                if (updates.unidadMedida !== undefined) payload.unidad_venta = updates.unidadMedida ?? null;
                if (updates.quickSpecs !== undefined) payload.quick_specs = updates.quickSpecs ?? [];
                if (updates.notaTecnica !== undefined) payload.nota_tecnica = updates.notaTecnica ?? null;
                if (updates.recursos !== undefined) payload.recursos = updates.recursos ?? [];

                const hasSpecsUpdate =
                    updates.specs !== undefined ||
                    updates.fullSpecs !== undefined ||
                    updates.sku !== undefined ||
                    updates.stock !== undefined ||
                    updates.contenido !== undefined ||
                    updates.unidadMedida !== undefined ||
                    updates.presentacion !== undefined;

                if (hasSpecsUpdate) {
                    payload.especificacion_variada = {
                        specs: updates.fullSpecs ?? updates.specs ?? current?.fullSpecs ?? current?.specs ?? {},
                        sku: updates.sku ?? current?.sku ?? null,
                        stock: updates.stock ?? current?.stock ?? null,
                        contenido: updates.contenido ?? current?.contenido ?? null,
                        unidadMedida: updates.unidadMedida ?? current?.unidadMedida ?? null,
                        presentacion: updates.presentacion ?? current?.presentacion ?? null,
                    };
                }

                if (Object.keys(payload).length > 0) {
                    const { data: updatedRows, error } = await sb.current
                        .from('productos')
                        .update(payload)
                        .eq('id', id)
                        .select('id');

                    if (error) {
                        console.error('[Products] Update error:', error.message);
                        return { success: false, error: error.message };
                    }

                    if (!updatedRows || updatedRows.length === 0) {
                        return { success: false, error: 'No se pudo actualizar: producto no encontrado.' };
                    }
                }

                if (updates.images) {
                    const imgRes = await setProductImages(id, updates.images as unknown as ProductImageInput[]);
                    if (!imgRes.success) return imgRes;
                }

                if (options?.refetch !== false) {
                    triggerRefetch();
                }
                return { success: true };
            } catch (err) {
                console.error('[Products] Update crashed:', err);
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo actualizar el producto') };
            }
        },
        [setProductImages, state.products, triggerRefetch],
    );

    const deleteProduct = useCallback(
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

                const { data: deletedRows, error } = await sb.current
                    .from('productos')
                    .delete()
                    .eq('id', id)
                    .select('id');

                if (error) {
                    console.error('[Products] Delete error:', error.message);
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
                return { success: false, error: normalizeSupabaseError(err, 'No se pudo eliminar el producto') };
            }
        },
        [triggerRefetch],
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
