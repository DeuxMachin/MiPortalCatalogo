'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, Search, Trash2, Pencil, Package, Eye, EyeOff, AlertTriangle, X,
    DollarSign, Ban, ChevronLeft, ChevronRight, Layers,
} from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import type { Product } from '@/src/entities/product/model/types';

const PAGE_SIZE = 30;

function getCoverImage(product: Product) {
    return product.images?.[0] || '';
}

export default function AdminProductsPage() {
    const { products, deleteProduct, updateProduct, refetch } = useProducts();
    const { activeCategories } = useCategories();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [disableTarget, setDisableTarget] = useState<Product | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [bulkUpdatingPrices, setBulkUpdatingPrices] = useState(false);

    const queryToast = (() => {
        const t = searchParams.get('toast');
        if (t === 'updated') return { type: 'success' as const, message: 'Cambios guardados correctamente.' };
        if (t === 'created') return { type: 'success' as const, message: 'Producto creado correctamente.' };
        return null;
    })();
    const visibleToast = toast ?? queryToast;

    // Reset page when filters change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter]);

    const filtered = products.filter((p) => {
        const matchesText =
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !categoryFilter || p.category === categoryFilter || String(p.categoryId) === categoryFilter;

        return matchesText && matchesCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const published = products.filter((p) => p.isPublished).length;
    const draft = products.length - published;
    const allPricesVisible = products.every((p) => p.precioVisible !== false);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const result = await deleteProduct(deleteTarget.id);
        setDeleteTarget(null);

        if (result.success) {
            setToast({ type: 'success', message: 'Producto eliminado permanentemente.' });
        } else {
            setToast({ type: 'error', message: result.error ?? 'No se pudo eliminar el producto.' });
        }

        setTimeout(() => setToast(null), 2800);
    };

    const confirmDisable = async () => {
        if (!disableTarget) return;

        const result = await updateProduct(disableTarget.id, { isPublished: false });
        setDisableTarget(null);

        if (result.success) {
            setToast({ type: 'success', message: 'Producto deshabilitado correctamente.' });
        } else {
            setToast({ type: 'error', message: result.error ?? 'No se pudo deshabilitar el producto.' });
        }

        setTimeout(() => setToast(null), 2800);
    };

    const handleEnable = async (product: Product) => {
        const result = await updateProduct(product.id, { isPublished: true });
        if (result.success) {
            setToast({ type: 'success', message: 'Producto habilitado correctamente.' });
        } else {
            setToast({ type: 'error', message: result.error ?? 'No se pudo habilitar el producto.' });
        }
        setTimeout(() => setToast(null), 2800);
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

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel Admin</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestión de productos</p>
                </div>
                <button
                    onClick={() => router.push('/admin/products/new')}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
            </div>

            {visibleToast && (
                <div
                    className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${visibleToast.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                >
                    {visibleToast.message}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                    { label: 'Total', value: products.length, color: 'text-slate-900' },
                    { label: 'Activos', value: published, color: 'text-emerald-600' },
                    { label: 'Deshabilitados', value: draft, color: 'text-amber-600' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                        <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Price visibility */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${allPricesVisible ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
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
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all w-full sm:w-auto ${allPricesVisible
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

            {/* Search + Category filter */}
            <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-slate-700">
                        {filtered.length} de {products.length} producto{filtered.length === 1 ? '' : 's'}
                        {filtered.length > PAGE_SIZE && (
                            <span className="ml-2 text-xs text-slate-400 font-normal">· Página {safePage} de {totalPages}</span>
                        )}
                    </p>
                    <p className="text-xs text-slate-400">Busca por nombre, SKU o usa los filtros</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    {/* Category filter */}
                    <div className="relative sm:w-52">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                        >
                            <option value="">Todas las categorías</option>
                            {activeCategories.map((cat) => (
                                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron productos</p>
                    <p className="text-sm text-slate-400 mt-1">Intenta con otro término de búsqueda o categoría</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {paginated.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="w-full sm:w-36 md:w-40 aspect-video sm:aspect-square bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                                        {getCoverImage(product) ? (
                                            <img
                                                src={getCoverImage(product)}
                                                alt={product.title}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Package className="w-7 h-7" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-slate-400 font-semibold">{product.sku}</p>
                                                <h3 className="text-base font-bold text-slate-800 leading-snug">{product.title}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${product.isPublished
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {product.isPublished ? 'Activo' : 'Deshabilitado'}
                                                </span>
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${product.precioVisible !== false
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {product.precioVisible !== false ? 'Precio visible' : 'Precio oculto'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className={`font-semibold px-2 py-1 rounded-lg ${product.stock === 'EN STOCK'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : product.stock === 'A PEDIDO'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto flex-wrap">
                                                <button
                                                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                                </button>
                                                {product.isPublished ? (
                                                    <button
                                                        onClick={() => setDisableTarget(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                                        title="Deshabilitar"
                                                    >
                                                        <Ban className="w-3.5 h-3.5" /> Deshabilitar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { void handleEnable(product); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                                        title="Habilitar"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Habilitar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(product)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between gap-4">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={safePage <= 1}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>

                            <span className="text-sm font-semibold text-slate-500">
                                Página <span className="text-slate-900">{safePage}</span> de <span className="text-slate-900">{totalPages}</span>
                            </span>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage >= totalPages}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {disableTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDisableTarget(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <button
                            onClick={() => setDisableTarget(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-100 p-2.5 rounded-xl">
                                <Ban className="w-5 h-5 text-amber-700" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Deshabilitar Producto</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Esta acción desactiva el producto. Los clientes no podrán verlo en el catálogo público.
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mb-6 bg-slate-50 rounded-lg p-3">
                            {disableTarget.title}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDisableTarget(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDisable}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <h3 className="text-lg font-bold text-slate-900">Eliminar Producto</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Esta acción elimina el producto de forma permanente y no se puede deshacer.
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
                                Eliminar permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
