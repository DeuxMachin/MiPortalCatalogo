'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, Layers } from 'lucide-react';
import type { Category } from '@/src/entities/category/model/types';
import { compareByPopularityCategoryName } from '@/src/shared/lib/categoryPopularityOrder';

interface FilterPanelProps {
    categories: Category[];
    activeCategoryId: string | null;
    onCategoryChange: (id: string | null) => void;
}

export default function FilterPanel({
    categories,
    activeCategoryId,
    onCategoryChange,
}: FilterPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    const filtered = [...categories]
        .filter((c) => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => compareByPopularityCategoryName(a.nombre, b.nombre));

    const activeCategory = activeCategoryId
        ? categories.find((c) => c.id === activeCategoryId)
        : null;

    return (
        <aside className="w-full md:w-64 flex-shrink-0 space-y-5">
            {/* ── Categorías Card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white"
                >
                    <span className="flex items-center gap-2.5">
                        <div className="bg-orange-500/20 p-1.5 rounded-lg">
                            <Layers className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Categorías</span>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-medium">
                            {categories.length}
                        </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
                </button>

                {!collapsed && (
                    <div>
                        {/* Active filter chip */}
                        {activeCategory && (
                            <div className="px-4 pt-3 pb-1">
                                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-3 py-2 text-xs font-semibold">
                                    <span className="truncate flex-1">{activeCategory.nombre}</span>
                                    <button
                                        onClick={() => onCategoryChange(null)}
                                        className="text-orange-400 hover:text-orange-600 transition-colors flex-shrink-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Search */}
                        <div className="px-4 pt-3 pb-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar categoría..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Category list with scroll */}
                        <div className="max-h-[340px] overflow-y-auto px-2 pb-3 scrollbar-thin">
                            {filtered.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-6">Sin resultados</p>
                            ) : (
                                <ul className="space-y-0.5">
                                    {filtered.map((cat) => {
                                        const isActive = cat.id === activeCategoryId;
                                        return (
                                            <li key={cat.id}>
                                                <button
                                                    onClick={() =>
                                                        onCategoryChange(isActive ? null : cat.id)
                                                    }
                                                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                                                        ${isActive
                                                            ? 'bg-orange-50 text-orange-700 font-semibold shadow-sm shadow-orange-100'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-orange-500' : 'bg-slate-300'
                                                            }`}
                                                    />
                                                    <span className="truncate">{cat.nombre}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── CTA — Cotización WhatsApp ── */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 relative overflow-hidden group shadow-lg border border-slate-700/50 hover:border-orange-500/40 transition-all duration-500">
                {/* Animated background orbs */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-600/15 rounded-full group-hover:scale-[2] transition-transform duration-700" />
                <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 delay-100" />

                {/* WhatsApp icon */}
                <div className="relative z-10 bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </div>

                <h4 className="relative z-10 font-bold text-sm text-white mb-1.5">¿Cotización a Medida?</h4>
                <p className="relative z-10 text-xs text-slate-400 mb-4 leading-relaxed">
                    Pedidos industriales por volumen y fabricaciones especiales bajo norma.
                </p>

                {/* WhatsApp CTA button */}
                <a
                    href="https://wa.me/56XXXXXXXXX?text=Hola%2C%20necesito%20una%20cotización%20a%20medida"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400
                        text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-300
                        shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40
                        active:scale-95 group/btn"
                >
                    <svg className="w-3.5 h-3.5 group-hover/btn:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Contactar por WhatsApp
                </a>
            </div>
        </aside>
    );
}
