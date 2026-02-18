'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';
import { reportError } from '@/src/shared/lib/errorTracking';
import type { Category } from '@/src/entities/category/model/types';
import { SupabaseCategoryRepository } from '@/src/features/category-management/infrastructure/SupabaseCategoryRepository';
import { createCategoryUseCase } from '@/src/features/category-management/application/CreateCategory';
import { updateCategoryUseCase } from '@/src/features/category-management/application/UpdateCategory';
import { deleteCategoryUseCase, deleteCategoryWithProductsUseCase } from '@/src/features/category-management/application/DeleteCategory';
import { compareByPopularityCategoryName } from '@/src/shared/lib/categoryPopularityOrder';

/** Genera un slug URL-safe a partir de un nombre. */
function toSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/* ─── In-memory cache shared across all hook instances ─── */
let _cache: Category[] | null = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000; // 1 minute

function isCacheValid(): boolean {
    return _cache !== null && Date.now() - _cacheTs < CACHE_TTL;
}

function sortCategoriesByBusinessOrder(items: Category[]): Category[] {
    return [...items].sort((a, b) => compareByPopularityCategoryName(a.nombre, b.nombre));
}

export function useCategories() {
    const sb = useRef(getSupabaseBrowserClient());
    const repository = useRef(new SupabaseCategoryRepository(sb.current));
    const [categories, setCategories] = useState<Category[]>(_cache ?? []);
    const [loading, setLoading] = useState(!isCacheValid());
    const [error, setError] = useState<string | null>(null);

    /* ---------- Fetch ---------- */
    const fetchCategories = useCallback(async (force = false) => {
        if (!force && isCacheValid()) {
            setCategories(sortCategoriesByBusinessOrder(_cache!));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Safety timeout: stop loading after 3s even if Supabase doesn't respond
        const timeout = setTimeout(() => {
            setLoading(false);
            if (!_cache) setError('Tiempo de espera agotado');
        }, 3000);

        try {
            const { data, error: fetchErr } = await repository.current.listCategories();

            clearTimeout(timeout);

            if (fetchErr) {
                console.error('[Categories] Fetch error:', fetchErr);
                setError(fetchErr);
                void reportError({
                    error: fetchErr,
                    severity: 'error',
                    source: 'client',
                    route: '/catalog',
                    action: 'fetch_categories',
                    context: { module: 'useCategories' },
                });
            } else {
                const cats = sortCategoriesByBusinessOrder(data ?? []);
                _cache = cats;
                _cacheTs = Date.now();
                setCategories(cats);
            }
        } catch (err) {
            clearTimeout(timeout);
            console.error('[Categories] Unexpected error:', err);
            setError('Error al cargar categorías');
            void reportError({
                error: err,
                severity: 'error',
                source: 'client',
                route: '/catalog',
                action: 'fetch_categories_unexpected',
                context: { module: 'useCategories' },
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    /* ---------- Create ---------- */
    const addCategory = useCallback(
        async (nombre: string) => {
            const result = await createCategoryUseCase(repository.current, {
                nombre,
                slug: toSlug(nombre),
            });

            if (!result.success || !result.data) {
                console.error('[Categories] Insert error:', result.error);
                setError(result.error ?? 'No se pudo crear la categoría.');
                void reportError({
                    error: result.error ?? 'Insert error',
                    severity: 'error',
                    source: 'client',
                    route: '/admin/categories',
                    action: 'create_category',
                    context: { nombre },
                    critical: true,
                });
                return null;
            }

            const updated = sortCategoriesByBusinessOrder([...(categories), result.data as Category]);
            _cache = updated;
            _cacheTs = Date.now();
            setCategories(updated);
            return result.data as Category;
        },
        [categories],
    );

    /* ---------- Update ---------- */
    const updateCategory = useCallback(
        async (id: string, updates: Partial<Pick<Category, 'nombre' | 'slug' | 'activo'>>) => {
            const payload = { ...updates };
            if (updates.nombre && !updates.slug) {
                payload.slug = toSlug(updates.nombre);
            }

            const result = await updateCategoryUseCase(repository.current, { id, ...payload });

            if (!result.success) {
                console.error('[Categories] Update error:', result.error);
                setError(result.error ?? 'No se pudo actualizar la categoría.');
                void reportError({
                    error: result.error ?? 'Update error',
                    severity: 'error',
                    source: 'client',
                    route: '/admin/categories',
                    action: 'update_category',
                    context: { id },
                    critical: true,
                });
                return false;
            }
            const updated = sortCategoriesByBusinessOrder(
                categories.map((c) => (c.id === id ? { ...c, ...payload } : c)),
            );
            _cache = updated;
            _cacheTs = Date.now();
            setCategories(updated);
            return true;
        },
        [categories],
    );

    /* ---------- Delete ---------- */
    const deleteCategory = useCallback(
        async (id: string) => {
            const result = await deleteCategoryUseCase(repository.current, { id });

            if (!result.success) {
                console.error('[Categories] Delete error:', result.error);
                setError(result.error ?? 'No se pudo eliminar la categoría.');
                void reportError({
                    error: result.error ?? 'Delete error',
                    severity: 'error',
                    source: 'client',
                    route: '/admin/categories',
                    action: 'delete_category',
                    context: { id },
                    critical: true,
                });
                return false;
            }
            const updated = categories.filter((c) => c.id !== id);
            _cache = updated;
            _cacheTs = Date.now();
            setCategories(updated);
            return true;
        },
        [categories],
    );

    const deleteCategoryWithProducts = useCallback(
        async (
            id: string,
            deleteProductById: (productId: string) => Promise<{ success: boolean; error?: string }>,
        ) => {
            const result = await deleteCategoryWithProductsUseCase(repository.current, { id }, deleteProductById);

            if (!result.success) {
                setError(result.error ?? 'No se pudo eliminar la categoría con sus productos.');
                return { success: false, error: result.error ?? 'No se pudo eliminar la categoría con sus productos.' };
            }

            const updated = categories.filter((c) => c.id !== id);
            _cache = updated;
            _cacheTs = Date.now();
            setCategories(updated);

            return { success: true };
        },
        [categories],
    );

    return {
        categories,
        /** Solo categorías activas — para vistas públicas. */
        activeCategories: categories.filter((c) => c.activo),
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        deleteCategoryWithProducts,
        refetch: () => fetchCategories(true),
    };
}
