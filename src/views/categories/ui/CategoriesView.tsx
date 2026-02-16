'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package, Loader2, Search, ArrowRight, Layers3 } from 'lucide-react';
import { useCategories } from '@/src/features/category-management';
import { useProducts } from '@/src/features/product-management';

export default function CategoriesView() {
    const router = useRouter();
    const { products } = useProducts();
    const { activeCategories, loading } = useCategories();
    const [searchQuery, setSearchQuery] = useState('');

    const categoryCards = useMemo(() => {
        return activeCategories.map((cat) => {
            const productCount = products.filter(
                (product) => product.isPublished && String(product.categoryId) === String(cat.id),
            ).length;

            return {
                ...cat,
                productCount,
            };
        });
    }, [activeCategories, products]);

    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return categoryCards;

        return categoryCards.filter((cat) => (
            cat.nombre.toLowerCase().includes(query)
            || cat.slug.toLowerCase().includes(query)
        ));
    }, [categoryCards, searchQuery]);

    const totalPublishedProducts = useMemo(
        () => products.filter((product) => product.isPublished).length,
        [products],
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }
    return (
        <section className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 mb-6">
                <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-3 font-medium">
                    <span
                        className="hover:text-orange-600 cursor-pointer"
                        onClick={() => router.push('/catalog')}
                    >
                        Catálogo
                    </span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 font-semibold">Categorías</span>
                </nav>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Ver todas las categorías
                        </h1>
                        <p className="text-slate-500 text-sm md:text-base mt-1 max-w-2xl">
                            Encuentra productos por tipo, con acceso directo al listado filtrado.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                            <Layers3 className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-slate-700">
                                {activeCategories.length} categorías
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                            <Package className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-slate-700">
                                {totalPublishedProducts} productos
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative mt-4 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar categoría por nombre o slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-300"
                    />
                </div>
            </div>

            {filteredCategories.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-semibold">No encontramos categorías para tu búsqueda.</p>
                    <p className="text-slate-400 text-sm mt-1">Prueba con otro término o limpia el buscador.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                    {filteredCategories.map((cat) => (
                        <article
                            key={cat.id}
                            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-orange-900/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                            onClick={() => router.push(`/catalog?cat=${cat.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && router.push(`/catalog?cat=${cat.id}`)}
                        >
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-5">
                                <h2 className="text-white text-lg md:text-xl font-bold leading-tight line-clamp-2">
                                    {cat.nombre}
                                </h2>
                                <p className="text-slate-300 text-xs mt-1.5">/{cat.slug}</p>
                            </div>

                            <div className="px-5 py-4">
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                                    <Package className="w-3.5 h-3.5" />
                                    {cat.productCount} producto{cat.productCount === 1 ? '' : 's'}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-orange-700 transition-colors">
                                        Ver productos de esta categoría
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
