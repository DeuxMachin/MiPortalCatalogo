'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import type { Category } from '@/src/entities/category/model/types';
import type { Product } from '@/src/entities/product/model/types';
import { compareByPopularityCategoryName } from '@/src/shared/lib/categoryPopularityOrder';

interface FilterPanelProps {
    categories: Category[];
    activeCategoryId: string | null;
    onCategoryChange: (id: string | null) => void;
    products: Product[];
    isOpen?: boolean;
}

export default function FilterPanelEnhanced({
    categories,
    activeCategoryId,
    onCategoryChange,
    products,
    isOpen = true,
}: FilterPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState(false);
    const [showAllWhenSelected, setShowAllWhenSelected] = useState(false);

    useEffect(() => {
        if (activeCategoryId) {
            setShowAllWhenSelected(false);
        }
    }, [activeCategoryId]);

    const categoriesWithCount = useMemo(() => {
        return categories.map((cat) => ({
            ...cat,
            count: products.filter((p) => p.isPublished && String(p.categoryId) === cat.id).length,
        }));
    }, [categories, products]);

    const filteredCategories = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const base = term
            ? categoriesWithCount.filter((c) => c.nombre.toLowerCase().includes(term))
            : categoriesWithCount;
        return [...base].sort((a, b) => compareByPopularityCategoryName(a.nombre, b.nombre));
    }, [categoriesWithCount, searchTerm]);

    const visibleCategories = useMemo(() => {
        if (!activeCategoryId || showAllWhenSelected) return filteredCategories;
        return filteredCategories.filter((cat) => cat.id === activeCategoryId);
    }, [activeCategoryId, filteredCategories, showAllWhenSelected]);

    const panelClassName = `bg-white border-b md:border-b-0 md:border-r border-slate-200 transition-all overflow-hidden md:overflow-y-auto md:sticky md:top-16 md:h-[calc(100vh-64px)] ${
        isOpen ? 'w-full md:w-72 opacity-100 max-h-[70vh] md:max-h-none' : 'w-0 md:w-0 opacity-0 pointer-events-none max-h-0 md:max-h-none'
    }`;

    return (
        <aside className={panelClassName}>
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                            <Filter className="w-4 h-4 text-orange-300" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categorias</p>
                            <p className="text-sm font-bold text-slate-800">Explora por tipo</p>
                        </div>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-slate-50"
                    />
                </div>

                <button
                    onClick={() => setCollapsedCategories(!collapsedCategories)}
                    className="w-full flex items-center justify-between mb-3"
                >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categorias</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${collapsedCategories ? '-rotate-90' : ''}`} />
                </button>

                {!collapsedCategories && (
                    <nav className="space-y-1">
                        <button
                            onClick={() => onCategoryChange(null)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${
                                !activeCategoryId
                                    ? 'bg-orange-50 text-orange-700 font-bold'
                                    : 'hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <ChevronRight className="w-4 h-4 opacity-50" />
                                Todas
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                !activeCategoryId ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-400 font-medium'
                            }`}>
                                {products.filter((p) => p.isPublished).length}
                            </span>
                        </button>

                        {visibleCategories.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-6">Sin resultados</p>
                        ) : (
                            visibleCategories.map((cat) => {
                                const isActive = activeCategoryId === cat.id;
                                const isContracted = Boolean(activeCategoryId) && !isActive;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            onCategoryChange(isActive ? null : cat.id);
                                            if (!isActive) setShowAllWhenSelected(false);
                                        }}
                                        className={`w-full flex items-center justify-between rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-orange-50 text-orange-700 font-bold p-2.5 text-sm'
                                                : isContracted
                                                    ? 'hover:bg-slate-50 text-slate-500 p-1.5 text-xs opacity-70'
                                                    : 'hover:bg-slate-50 text-slate-600 p-2.5 text-sm'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            {isActive ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 opacity-50" />
                                            )}
                                            {cat.nombre}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isActive ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-400 font-medium'
                                        }`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                );
                            })
                        )}

                        {activeCategoryId && !showAllWhenSelected && filteredCategories.length > 1 && (
                            <button
                                onClick={() => setShowAllWhenSelected(true)}
                                className="w-full mt-2 text-xs font-bold text-orange-700 hover:text-orange-600 text-left px-2"
                            >
                                Ver otras categorías
                            </button>
                        )}
                    </nav>
                )}

                <div className="mt-6 md:mt-10 p-4 bg-slate-900 rounded-xl text-white">
                    <p className="text-xs font-bold opacity-75 uppercase mb-2">Ayuda Tecnica</p>
                    <p className="text-sm font-medium mb-4 italic text-slate-200">
                        "Necesitas asesoria? Te ayudamos a elegir el producto correcto."
                    </p>
                    <button className="w-full bg-orange-600 hover:bg-orange-500 py-2 rounded-lg text-xs font-bold transition-colors">
                        Contactar Ventas
                    </button>
                </div>
            </div>
        </aside>
    );
}
