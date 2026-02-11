'use client';

import { useState } from 'react';
import { Filter, ArrowRight, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { MOCK_CATEGORIES } from '@/src/entities/category/model/mock-data';

interface FilterPanelProps {
    activeCategoryId: number | null;
    onCategoryChange: (id: number | null) => void;
    activeSubcategoryId: number | null;
    onSubcategoryChange: (id: number | null) => void;
}

export default function FilterPanel({
    activeCategoryId,
    onCategoryChange,
    activeSubcategoryId,
    onSubcategoryChange,
}: FilterPanelProps) {
    const [expandedCat, setExpandedCat] = useState<number | null>(activeCategoryId);

    const handleCategoryClick = (catId: number) => {
        const isActive = catId === activeCategoryId;
        onCategoryChange(isActive ? null : catId);
        onSubcategoryChange(null);
        setExpandedCat(isActive ? null : catId);
    };

    return (
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
            {/* Categorías */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" /> Categorías
                    </h3>
                    {activeCategoryId && (
                        <button
                            onClick={() => { onCategoryChange(null); onSubcategoryChange(null); setExpandedCat(null); }}
                            className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
                <ul className="space-y-0.5">
                    {MOCK_CATEGORIES.map((cat) => {
                        const isActive = cat.id === activeCategoryId;
                        const isExpanded = cat.id === expandedCat;
                        return (
                            <li key={cat.id}>
                                <div
                                    className={`flex justify-between items-center font-semibold cursor-pointer transition-all px-3 py-2.5 rounded-lg text-sm
                    ${isActive
                                            ? 'text-orange-600 bg-orange-50'
                                            : 'text-slate-600 hover:text-orange-600 hover:bg-slate-50'}`}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(cat.id)}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-base">{cat.icon}</span>
                                        {cat.name}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-normal">{cat.productCount}</span>
                                        {cat.subcategories.length > 0 && (
                                            isExpanded
                                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                    </span>
                                </div>

                                {/* Subcategorías */}
                                {isExpanded && cat.subcategories.length > 0 && (
                                    <ul className="ml-8 mt-1 mb-2 space-y-0.5">
                                        {cat.subcategories.map((sub) => (
                                            <li
                                                key={sub.id}
                                                className={`text-[13px] cursor-pointer px-3 py-1.5 rounded-md transition-all
                          ${activeSubcategoryId === sub.id
                                                        ? 'text-orange-600 bg-orange-50 font-semibold'
                                                        : 'text-slate-500 hover:text-orange-600 hover:bg-slate-50 font-medium'}`}
                                                onClick={() => onSubcategoryChange(activeSubcategoryId === sub.id ? null : sub.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && onSubcategoryChange(activeSubcategoryId === sub.id ? null : sub.id)}
                                            >
                                                {sub.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* CTA */}
            <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden group shadow-lg">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-600/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <div className="bg-orange-600 w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-600/30">
                    <Clock className="text-white w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1.5">¿Cotización a Medida?</h4>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Pedidos industriales por volumen y fabricaciones especiales bajo norma.
                </p>
                <button className="text-orange-500 text-xs font-semibold hover:text-orange-400 transition-colors flex items-center gap-1.5">
                    Solicitar Soporte <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </aside>
    );
}
