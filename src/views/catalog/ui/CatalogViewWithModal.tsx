'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Grid, List as ListIcon } from 'lucide-react';
import ProductCard from '@/src/widgets/product-card/ui/ProductCard';
import ProductBookModal from '@/src/widgets/product-book-modal';
import FilterPanel from '@/src/features/product-filter/ui/FilterPanel';
import LoadingOverlay from '@/src/shared/ui/LoadingOverlay';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import type { Product } from '@/src/entities/product/model/types';

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Más Populares' },
    { value: 'price-asc', label: 'Precio: Menor a Mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a Menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
];

export default function CatalogViewWithModal() {
    const { products: allProducts, error: productsError } = useProducts();
    const { activeCategories, loading: catsLoading, error: categoriesError } = useCategories();
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [sortOpen, setSortOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    // Close sort dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
                setSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredProducts = useMemo(() => {
        let products = allProducts.filter((p) => p.isPublished);

        if (activeCategoryId) {
            products = products.filter((p) => String(p.categoryId) === activeCategoryId);
        }

        switch (sortBy) {
            case 'price-asc':
                products = [...products].sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products = [...products].sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                products = [...products].sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'popular':
            default:
                break;
        }

        return products;
    }, [activeCategoryId, sortBy, allProducts]);

    const activeCategoryName = activeCategoryId
        ? activeCategories.find((c) => c.id === activeCategoryId)?.nombre
        : null;

    const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label;

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const showLoading = catsLoading && activeCategories.length === 0;
    const loadError = categoriesError || productsError;

    return (
        <>
            <LoadingOverlay visible={showLoading} message="Cargando catálogo..." />

            <div className={`flex flex-col md:flex-row gap-8 transition-opacity duration-500 ${showLoading ? 'opacity-0' : 'opacity-100'}`}>
                {/* Sidebar */}
                <FilterPanel
                    categories={activeCategories}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={setActiveCategoryId}
                />

                {/* Main */}
                <div className="flex-1 min-w-0">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <nav className="text-sm text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
                            <span className="hover:text-orange-600 cursor-pointer" onClick={() => setActiveCategoryId(null)}>
                                Catálogo
                            </span>
                            {activeCategoryName && (
                                <>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-slate-700 font-semibold">{activeCategoryName}</span>
                                </>
                            )}
                        </nav>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                            {activeCategoryName ?? 'Todos los Productos'}
                        </h1>
                        <p className="text-slate-500 max-w-xl text-sm">
                            Materiales y productos de construcción con información técnica detallada.
                        </p>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-4 shadow-sm">
                        <span className="text-xs text-slate-400 font-medium">
                            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-4">
                            {/* Sort dropdown */}
                            <div className="relative" ref={sortRef}>
                                <button
                                    onClick={() => setSortOpen(!sortOpen)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-orange-600 transition-colors"
                                >
                                    {currentSortLabel}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {sortOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[200px] z-20">
                                        {SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors
                        ${sortBy === opt.value
                                                        ? 'text-orange-600 bg-orange-50 font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* View toggle */}
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                <button
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setViewMode('grid')}
                                    aria-label="Vista grilla"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    onClick={() => setViewMode('list')}
                                    aria-label="Vista lista"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    {loadError && (
                        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
                            {loadError}
                        </div>
                    )}
                    {filteredProducts.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                            <p className="text-slate-400 font-medium">No se encontraron productos en esta categoría.</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="space-y-4">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onClick={handleProductClick} viewMode="list" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onClick={handleProductClick} viewMode="grid" />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal del producto */}
            {selectedProduct && (
                <ProductBookModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}
