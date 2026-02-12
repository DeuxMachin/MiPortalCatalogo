'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';
import type { Category } from '@/src/entities/category/model/types';

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

export function useCategories() {
    const sb = useRef(getSupabaseBrowserClient());
    const [categories, setCategories] = useState<Category[]>(_cache ?? []);
    const [loading, setLoading] = useState(!isCacheValid());
    const [error, setError] = useState<string | null>(null);

    /* ---------- Fetch ---------- */
    const fetchCategories = useCallback(async (force = false) => {
        if (!force && isCacheValid()) {
            setCategories(_cache!);
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
            const { data, error: fetchErr } = await sb.current
                .from('categorias')
                .select('*')
                .order('nombre', { ascending: true });

            clearTimeout(timeout);

            if (fetchErr) {
                console.error('[Categories] Fetch error:', fetchErr.message);
                setError(fetchErr.message);
            } else {
                const cats = (data as Category[]) ?? [];
                _cache = cats;
                _cacheTs = Date.now();
                setCategories(cats);
            }
        } catch (err) {
            clearTimeout(timeout);
            console.error('[Categories] Unexpected error:', err);
            setError('Error al cargar categorías');
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
            const slug = toSlug(nombre);
            const { data, error: insertErr } = await sb.current
                .from('categorias')
                .insert({ nombre, slug })
                .select()
                .single();

            if (insertErr) {
                console.error('[Categories] Insert error:', insertErr.message);
                setError(insertErr.message);
                return null;
            }
            const updated = [...(categories), data as Category].sort((a, b) =>
                a.nombre.localeCompare(b.nombre),
            );
            _cache = updated;
            _cacheTs = Date.now();
            setCategories(updated);
            return data as Category;
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

            const { error: updateErr } = await sb.current
                .from('categorias')
                .update(payload)
                .eq('id', id);

            if (updateErr) {
                console.error('[Categories] Update error:', updateErr.message);
                setError(updateErr.message);
                return false;
            }
            const updated = categories
                .map((c) => (c.id === id ? { ...c, ...payload } : c))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
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
            const { error: delErr } = await sb.current
                .from('categorias')
                .delete()
                .eq('id', id);

            if (delErr) {
                console.error('[Categories] Delete error:', delErr.message);
                setError(delErr.message);
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

    return {
        categories,
        /** Solo categorías activas — para vistas públicas. */
        activeCategories: categories.filter((c) => c.activo),
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        refetch: () => fetchCategories(true),
    };
}
