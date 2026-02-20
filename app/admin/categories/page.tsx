'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Pencil, Trash2, AlertTriangle, X, Package } from 'lucide-react';
import { useCategories } from '@/src/features/category-management';
import { useProducts } from '@/src/features/product-management';
import type { Category } from '@/src/entities/category/model/types';

export default function AdminCategoriesPage() {
    const {
        categories,
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategoryWithProducts,
    } = useCategories();
    const { products, deleteProduct } = useProducts();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryQuery, setCategoryQuery] = useState('');
    const [editingName, setEditingName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const productCountByCategory = useMemo(() => {
        const map = new Map<string, number>();
        products.forEach((product) => {
            const key = String(product.categoryId);
            map.set(key, (map.get(key) ?? 0) + 1);
        });
        return map;
    }, [products]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id);
            setEditingName(categories[0].nombre);
            return;
        }

        if (selectedCategoryId && !categories.some((category) => category.id === selectedCategoryId)) {
            const fallback = categories[0] ?? null;
            setSelectedCategoryId(fallback?.id ?? null);
            setEditingName(fallback?.nombre ?? '');
        }
    }, [categories, selectedCategoryId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
    const selectedCategoryProducts = selectedCategory
        ? (productCountByCategory.get(selectedCategory.id) ?? 0)
        : 0;

    const filteredCategories = useMemo(() => {
        const query = categoryQuery.trim().toLowerCase();
        if (!query) return categories;
        return categories.filter((category) => (
            category.nombre.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query)
        ));
    }, [categories, categoryQuery]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 2600);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            showToast('error', 'Debes escribir un nombre para la categoría.');
            return;
        }

        setIsSaving(true);
        const created = await addCategory(newCategoryName.trim());
        setIsSaving(false);

        if (!created) {
            showToast('error', 'No se pudo crear la categoría.');
            return;
        }

        setNewCategoryName('');
        setSelectedCategoryId(created.id);
        setEditingName(created.nombre);
        showToast('success', 'Categoría creada correctamente.');
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory) return;
        if (!editingName.trim()) {
            showToast('error', 'El nombre de la categoría no puede quedar vacío.');
            return;
        }

        setIsSaving(true);
        const ok = await updateCategory(selectedCategory.id, { nombre: editingName.trim() });
        setIsSaving(false);

        if (!ok) {
            showToast('error', 'No se pudo actualizar la categoría.');
            return;
        }

        showToast('success', 'Categoría actualizada correctamente.');
    };

    const confirmDeleteCategory = async () => {
        if (!deleteTarget) return;

        setIsSaving(true);
        const result = await deleteCategoryWithProducts(deleteTarget.id, deleteProduct);
        setIsSaving(false);
        setDeleteTarget(null);

        if (!result.success) {
            showToast('error', result.error ?? 'No se pudo eliminar la categoría.');
            return;
        }

        showToast('success', 'Categoría y productos asociados eliminados correctamente.');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categorías</h1>
                    <p className="text-sm text-slate-500 mt-1">Crear, editar y eliminar categorías del catálogo</p>
                </div>
            </div>

            {toast && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${toast.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {toast.message}
                </div>
            )}

            {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 border border-red-200 text-red-700">
                    {error}
                </div>
            )}

            <div className="grid lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-4 lg:gap-6">
                <section className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Lista de categorías
                    </h2>

                    <div className="mb-3">
                        <input
                            value={categoryQuery}
                            onChange={(e) => setCategoryQuery(e.target.value)}
                            placeholder="Buscar categoría..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {loading && categories.length === 0 ? (
                            <p className="text-sm text-slate-400">Cargando categorías...</p>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-slate-400">Aún no hay categorías.</p>
                        ) : filteredCategories.length === 0 ? (
                            <p className="text-sm text-slate-400">No se encontraron categorías para tu búsqueda.</p>
                        ) : (
                            filteredCategories.map((category) => {
                                const count = productCountByCategory.get(category.id) ?? 0;
                                const isActive = category.id === selectedCategoryId;

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategoryId(category.id);
                                            setEditingName(category.nombre);
                                        }}
                                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${isActive
                                            ? 'border-orange-300 bg-orange-50'
                                            : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{category.nombre}</p>
                                            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
                                                {count} prod.
                                            </span>
                                        </div>

                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Nueva categoría</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Ej: Morteros"
                                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                type="button"
                                onClick={handleCreateCategory}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" /> Crear
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    {!selectedCategory ? (
                        <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
                            <Layers className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Selecciona una categoría para administrarla.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Editar categoría</h2>
                                <p className="text-sm text-slate-500">Administra nombre y eliminación de la categoría.</p>
                            </div>

                            {selectedCategoryProducts === 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                    Categoría sin productos.
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre</label>
                                <input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Escribe el nuevo nombre y haz clic en &quot;Guardar cambios&quot;.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={handleUpdateCategory}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60"
                                >
                                    <Pencil className="w-4 h-4" /> Guardar cambios
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(selectedCategory)}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-60"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar categoría
                                </button>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Productos asociados: {selectedCategoryProducts}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Si eliminas esta categoría, se eliminarán también todos sus productos.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2.5 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Confirmar eliminación</h3>
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                            Se eliminará la categoría <span className="font-semibold">{deleteTarget.nombre}</span> y también
                            <span className="font-semibold"> todos sus productos asociados</span>.
                        </p>
                        <p className="text-sm text-slate-500 mb-2">Esta acción es permanente y no se puede deshacer.</p>
                        <p className="text-sm font-semibold text-slate-800 mb-6 bg-slate-50 rounded-lg p-3">
                            Productos afectados: {productCountByCategory.get(deleteTarget.id) ?? 0}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteCategory}
                                disabled={isSaving}
                                className="py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                Confirmar eliminación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
