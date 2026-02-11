'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { MOCK_CATEGORIES } from '@/src/entities/category/model/mock-data';

export default function CategoriesView() {
    const router = useRouter();

    return (
        <div>
            {/* Encabezado */}
            <div className="mb-10">
                <nav className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
                    <span
                        className="hover:text-orange-600 cursor-pointer"
                        onClick={() => router.push('/catalog')}
                    >
                        Catálogo
                    </span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 font-semibold">Categorías</span>
                </nav>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    Categorías de Productos
                </h1>
                <p className="text-slate-500 max-w-xl text-sm">
                    Explora nuestro catálogo organizado por categorías. Cada sección agrupa productos con
                    especificaciones similares para facilitar tu búsqueda.
                </p>
            </div>

            {/* Grid de categorías */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_CATEGORIES.map((cat) => (
                    <div
                        key={cat.id}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden group
              hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer flex flex-col"
                        onClick={() => router.push(`/catalog?cat=${cat.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/catalog?cat=${cat.id}`)}
                    >
                        {/* Header de categoría */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 text-6xl opacity-10 select-none">
                                {cat.icon}
                            </div>
                            <div className="text-4xl mb-3">{cat.icon}</div>
                            <h2 className="text-lg font-bold text-white leading-snug">{cat.name}</h2>
                            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
                                <Package className="w-3 h-3" /> {cat.productCount} productos
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col flex-1">
                            <p className="text-sm text-slate-500 mb-4 leading-relaxed flex-1">
                                {cat.description}
                            </p>

                            {/* Subcategorías */}
                            {cat.subcategories.length > 0 && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                        Subcategorías
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cat.subcategories.map((sub) => (
                                            <span
                                                key={sub.id}
                                                className="text-xs font-medium bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg
                          hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/catalog?cat=${cat.id}&sub=${sub.id}`);
                                                }}
                                            >
                                                {sub.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs font-semibold text-orange-600 group-hover:underline flex items-center gap-1">
                                    Ver productos <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
