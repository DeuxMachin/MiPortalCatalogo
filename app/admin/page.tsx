
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, Search, Trash2, Pencil, Package, Eye, EyeOff, AlertTriangle, X,
    Loader2, Check, ToggleLeft, ToggleRight, Layers, DollarSign,
} from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import type { Product } from '@/src/entities/product/model/types';

type AdminTab = 'products' | 'categories';

function buildProductSpecChips(product: Product): string[] {
    const chips: string[] = [];

    if (product.color?.trim()) chips.push(`Color: ${product.color}`);
    if (product.material?.trim()) chips.push(`Material: ${product.material}`);
    if (product.contenido?.trim()) {
        const unidad = product.unidadMedida?.trim() ? ` ${product.unidadMedida}` : '';
        chips.push(`Contenido: ${product.contenido}${unidad}`);
    }
    if (product.presentacion?.trim()) chips.push(`Presentación: ${product.presentacion}`);

    return chips;
}

export default function AdminPage() {
    const { products, deleteProduct, updateProduct, refetch } = useProducts();
    const {
        categories, loading: catsLoading, addCategory, updateCategory, deleteCategory,
    } = useCategories();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<AdminTab>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [bulkUpdatingPrices, setBulkUpdatingPrices] = useState(false);

    useEffect(() => {
        const t = searchParams.get('toast');
        if (!t) return;

        if (t === 'updated') {
            setToast({ type: 'success', message: 'Cambios guardados correctamente.' });
        } else if (t === 'created') {
            setToast({ type: 'success', message: 'Producto creado correctamente.' });
        }

        router.replace('/admin');
        setTimeout(() => setToast(null), 2500);
    }, [router, searchParams]);

    /* ── Category management state ── */
    const [newCatName, setNewCatName] = useState('');
    const [addingCat, setAddingCat] = useState(false);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingCatName, setEditingCatName] = useState('');
    const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

    /* ── Products ── */
    const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const published = products.filter((p) => p.isPublished).length;
    const draft = products.length - published;
    const allPricesVisible = products.every((p) => p.precioVisible !== false);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const result = await deleteProduct(deleteTarget.id);
        setDeleteTarget(null);

        if (result.success) {
            setToast({ type: 'success', message: 'Producto eliminado correctamente.' });
        } else {
            setToast({ type: 'error', message: result.error ?? 'No se pudo eliminar el producto.' });
        }

        setTimeout(() => setToast(null), 2500);
    };

    const handleToggleAllPricesVisible = async () => {
        if (bulkUpdatingPrices) return;
        const newValue = !allPricesVisible;

        setBulkUpdatingPrices(true);
        const results = await Promise.all(
            products.map((p) => updateProduct(p.id, { precioVisible: newValue }, { refetch: false })),
        );

        await refetch();

        const failed = results.find((r) => !r.success);
        if (failed) {
            setToast({ type: 'error', message: failed.error ?? 'No se pudo actualizar la visibilidad de precios.' });
        } else {
            setToast({ type: 'success', message: newValue ? 'Precios visibles para todos.' : 'Precios ocultos para todos.' });
        }

        setTimeout(() => setToast(null), 2500);
        setBulkUpdatingPrices(false);
    };

    /* ── Category actions ── */
    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setAddingCat(true);
        await addCategory(newCatName.trim());
        setNewCatName('');
        setAddingCat(false);
    };

    const handleSaveEdit = async (id: string) => {
        if (editingCatName.trim()) {
            await updateCategory(id, { nombre: editingCatName.trim() });
        }
        setEditingCatId(null);
        setEditingCatName('');
    };

    const handleToggleActive = async (id: string, current: boolean) => {
        await updateCategory(id, { activo: !current });
    };

    const handleDeleteCat = async () => {
        if (deleteCatId) {
            await deleteCategory(deleteCatId);
            setDeleteCatId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel Admin</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona productos y categorías</p>
                </div>
                {activeTab === 'products' && (
                    <button
                        onClick={() => router.push('/admin/products/new')}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </button>
                )}
            </div>

            {toast && (
                <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${toast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Productos ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'categories'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Layers className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Categorías ({categories.length})
                </button>
            </div>

            {/* ═══════════════════════ TAB: PRODUCTS ═══════════════════════ */}
            {activeTab === 'products' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total', value: products.length, color: 'text-slate-900' },
                            { label: 'Publicados', value: published, color: 'text-emerald-600' },
                            { label: 'Borradores', value: draft, color: 'text-amber-600' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Global price toggle */}
                    <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${allPricesVisible ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Visibilidad de precios</p>
                                <p className="text-xs text-slate-400">
                                    {allPricesVisible ? 'Todos los precios son visibles' : 'Algunos precios están ocultos'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleAllPricesVisible}
                            disabled={bulkUpdatingPrices || products.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${allPricesVisible
                                    ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                        >
                            {allPricesVisible ? (
                                <><EyeOff className="w-3.5 h-3.5" /> Ocultar todos</>
                            ) : (
                                <><Eye className="w-3.5 h-3.5" /> Mostrar todos</>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    {/* Product grid */}
                    {filtered.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No se encontraron productos</p>
                            <p className="text-sm text-slate-400 mt-1">Intenta con otro término de búsqueda</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:shadow-md transition-all relative"
                                >
                                    <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                                className="bg-white text-slate-700 p-2.5 rounded-xl shadow-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(product)}
                                                className="bg-white text-slate-700 p-2.5 rounded-xl shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            {product.isPublished ? (
                                                <div className="bg-emerald-500 text-white p-1 rounded-lg" title="Publicado">
                                                    <Eye className="w-3 h-3" />
                                                </div>
                                            ) : (
                                                <div className="bg-slate-400 text-white p-1 rounded-lg" title="Borrador">
                                                    <EyeOff className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs text-slate-400 font-medium mb-0.5">{product.sku}</p>
                                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                                            {product.title}
                                        </h3>

                                        {(() => {
                                            const chips = buildProductSpecChips(product);
                                            if (chips.length === 0) return null;
                                            return (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {chips.slice(0, 3).map((label) => (
                                                        <span
                                                            key={label}
                                                            className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200"
                                                            title={label}
                                                        >
                                                            <span className="truncate max-w-[140px] inline-block align-bottom">
                                                                {label}
                                                            </span>
                                                        </span>
                                                    ))}
                                                    {chips.length > 3 && (
                                                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                                            +{chips.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════ TAB: CATEGORIES ═══════════════════════ */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    {/* Add new category */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-orange-500" /> Nueva Categoría
                        </h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="Nombre de la categoría..."
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={addingCat || !newCatName.trim()}
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
                            >
                                {addingCat ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Crear
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            El slug se genera automáticamente a partir del nombre.
                        </p>
                    </div>

                    {/* Categories list */}
                    {catsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No hay categorías</p>
                            <p className="text-sm text-slate-400 mt-1">Crea tu primera categoría arriba</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-3 bg-slate-50 border-b border-gray-100 grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span className="col-span-4">Nombre</span>
                                <span className="col-span-3">Slug</span>
                                <span className="col-span-2 text-center">Estado</span>
                                <span className="col-span-3 text-right">Acciones</span>
                            </div>
                            <div className="max-h-[520px] overflow-y-auto">
                                {categories.map((cat, idx) => (
                                    <div
                                        key={cat.id}
                                        className={`px-6 py-4 grid grid-cols-12 gap-4 items-center text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                            } hover:bg-orange-50/30 transition-colors`}
                                    >
                                        {/* Name */}
                                        <div className="col-span-4">
                                            {editingCatId === cat.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingCatName}
                                                        onChange={(e) => setEditingCatName(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(cat.id)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSaveEdit(cat.id)}
                                                        className="text-emerald-600 hover:text-emerald-700 p-1"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingCatId(null); setEditingCatName(''); }}
                                                        className="text-slate-400 hover:text-slate-600 p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="font-semibold text-slate-800">{cat.nombre}</span>
                                            )}
                                        </div>

                                        {/* Slug */}
                                        <div className="col-span-3">
                                            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                                                {cat.slug}
                                            </span>
                                        </div>

                                        {/* Active toggle */}
                                        <div className="col-span-2 flex justify-center">
                                            <button
                                                onClick={() => handleToggleActive(cat.id, cat.activo)}
                                                className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-full transition-all ${cat.activo
                                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                                    : 'text-slate-400 bg-slate-100 border border-slate-200'
                                                    }`}
                                            >
                                                {cat.activo ? (
                                                    <><ToggleRight className="w-4 h-4" /> Activa</>
                                                ) : (
                                                    <><ToggleLeft className="w-4 h-4" /> Inactiva</>
                                                )}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-3 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.nombre); }}
                                                className="text-slate-400 hover:text-orange-600 transition-colors p-1.5 rounded-lg hover:bg-orange-50"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteCatId(cat.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}\r\n                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════ Delete product modal ═══════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
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
                            <h3 className="text-lg font-bold text-slate-900">Eliminar Producto</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                            ¿Estás seguro de que quieres eliminar este producto?
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mb-6 bg-slate-50 rounded-lg p-3">
                            {deleteTarget.title}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ Delete category modal ═══════════════ */}
            {deleteCatId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteCatId(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <button
                            onClick={() => setDeleteCatId(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2.5 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Eliminar Categoría</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                            ¿Estás seguro de que quieres eliminar esta categoría? Los productos asociados perderán su categoría.
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mb-6 bg-slate-50 rounded-lg p-3">
                            {categories.find((c) => c.id === deleteCatId)?.nombre}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteCatId(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCat}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
