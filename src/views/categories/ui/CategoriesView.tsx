'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Package, Loader2 } from 'lucide-react';
import { useCategories } from '@/src/features/category-management';

export default function CategoriesView() {
    const router = useRouter();
    const { activeCategories, loading } = useCategories();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

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
            {activeCategories.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay categorías disponibles.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCategories.map((cat) => (
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
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-600/10 rounded-full" />
                                <h2 className="text-lg font-bold text-white leading-snug">{cat.nombre}</h2>
                                <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5">
                                    <Package className="w-3 h-3" /> {cat.slug}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="p-5 flex items-center justify-between mt-auto">
                                <span className="text-xs font-semibold text-orange-600 group-hover:underline flex items-center gap-1">
                                    Ver productos <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
