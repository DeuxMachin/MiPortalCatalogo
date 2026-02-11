'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Search, Trash2, Pencil, Package, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import type { Product } from '@/src/entities/product/model/types';

export default function AdminPage() {
    const { products, deleteProduct } = useProducts();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

    const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const published = products.filter((p) => p.isPublished).length;
    const draft = products.length - published;

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteProduct(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Productos</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona tu catálogo de productos</p>
                </div>
                <button
                    onClick={() => router.push('/admin/products/new')}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nuevo Producto
                </button>
            </div>

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
                            {/* Image */}
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 25vw"
                                />
                                {/* Overlay on hover */}
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
                                {/* Published badge */}
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

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-xs text-slate-400 font-medium mb-0.5">{product.sku}</p>
                                <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                                    {product.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirmation modal */}
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
        </div>
    );
}
