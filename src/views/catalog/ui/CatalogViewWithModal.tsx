'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Filter,
    LayoutGrid,
    List as ListIcon,
    Maximize2,
    Search,
    Tag,
    Info,
    X,
} from 'lucide-react';
import type { Product } from '@/src/entities/product/model/types';
import type { StockStatus } from '@/src/shared/types/common';
import { formatPrice } from '@/src/shared/lib/formatters';
import FilterPanelEnhanced from '@/src/features/product-filter/ui/FilterPanelEnhanced';
import ProductBookModal from '@/src/widgets/product-book-modal';
import LoadingOverlay from '@/src/shared/ui/LoadingOverlay';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import { getCategoryPopularityRank } from '@/src/shared/lib/categoryPopularityOrder';

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Mas populares' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
];

const STOCK_FILTERS: Array<{ value: StockStatus; label: string }> = [
    { value: 'EN STOCK', label: 'En stock' },
    { value: 'A PEDIDO', label: 'A pedido' },
    { value: 'SIN STOCK', label: 'Sin stock' },
];

export default function CatalogViewWithModal() {
    const router = useRouter();
    const { products: allProducts, error: productsError } = useProducts();
    const { activeCategories, loading: catsLoading, error: categoriesError } = useCategories();
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState<StockStatus | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const categoryNameById = useMemo(() => {
        return new Map(activeCategories.map((c) => [c.id, c.nombre] as const));
    }, [activeCategories]);

    const filteredProducts = useMemo(() => {
        const getCategoryName = (product: Product) =>
            categoryNameById.get(String(product.categoryId)) ?? product.category ?? 'Sin categoria';
        let products = allProducts.filter((p) => p.isPublished);

        if (activeCategoryId) {
            products = products.filter((p) => String(p.categoryId) === activeCategoryId);
        }

        if (stockFilter) {
            products = products.filter((p) => p.stock === stockFilter);
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            products = products.filter((p) => {
                const categoryName = getCategoryName(p).toLowerCase();
                return (
                    p.title.toLowerCase().includes(query) ||
                    p.sku.toLowerCase().includes(query) ||
                    categoryName.includes(query) ||
                    (p.material ?? '').toLowerCase().includes(query) ||
                    (p.presentacion ?? '').toLowerCase().includes(query)
                );
            });
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
                if (!activeCategoryId) {
                    products = [...products].sort((a, b) => {
                        const aRank = getCategoryPopularityRank(getCategoryName(a));
                        const bRank = getCategoryPopularityRank(getCategoryName(b));
                        if (aRank !== bRank) return aRank - bRank;
                        return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
                    });
                }
                break;
        }

        return products;
    }, [activeCategoryId, allProducts, categoryNameById, searchQuery, sortBy, stockFilter]);

    const activeCategoryName = activeCategoryId
        ? activeCategories.find((c) => c.id === activeCategoryId)?.nombre
        : null;

    const showLoading = catsLoading && activeCategories.length === 0;
    const loadError = categoriesError || productsError;

    const handleProductOpen = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setStockFilter(null);
        setActiveCategoryId(null);
    };

    const getCategoryName = (product: Product) =>
        categoryNameById.get(String(product.categoryId)) ?? product.category ?? 'Sin categoria';
    const selectedCategoryLabel = selectedProduct ? getCategoryName(selectedProduct) : '';

    return (
        <>
            <LoadingOverlay visible={showLoading} message="Cargando catalogo..." />

            <div className="w-full px-0 md:px-2 py-0">
                <div className={`flex gap-0 transition-opacity duration-500 ${showLoading ? 'opacity-0' : 'opacity-100'}`}>
                    <FilterPanelEnhanced
                        categories={activeCategories}
                        activeCategoryId={activeCategoryId}
                        onCategoryChange={setActiveCategoryId}
                        products={allProducts}
                        isOpen={isSidebarOpen}
                    />

                    <main className="flex-1 min-w-0 p-3 md:p-5 lg:p-6">
                        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 md:p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                        aria-label="Mostrar filtros"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </button>
                                    <div className="h-4 w-px bg-slate-300 mx-2" />
                                    <div>
                                        <h1 className="text-lg font-bold text-slate-800">
                                            {activeCategoryName ?? 'Todos los Productos'}
                                        </h1>
                                        <p className="text-sm font-normal text-slate-400">
                                            {filteredProducts.length} resultado{filteredProducts.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <select
                                        className="hidden md:block text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        aria-label="Ordenar"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>

                                    <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            aria-label="Vista grilla"
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            aria-label="Vista lista"
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative max-w-2xl mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por SKU, nombre o categoria..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent focus:border-orange-400 focus:bg-white rounded-full outline-none transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto mt-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Filtros:</span>
                                {STOCK_FILTERS.map((filter) => (
                                    <FilterChip
                                        key={filter.value}
                                        label={filter.label}
                                        active={stockFilter === filter.value}
                                        onClick={() => setStockFilter(stockFilter === filter.value ? null : filter.value)}
                                    />
                                ))}
                                {(stockFilter || searchQuery || activeCategoryId) && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-xs font-semibold text-orange-700 hover:text-orange-600 transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>

                        {loadError && (
                            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
                                {loadError}
                            </div>
                        )}

                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No encontramos coincidencias</h3>
                                <p className="text-slate-500 max-w-xs mx-auto">
                                    Prueba ajustando los filtros o revisa que la categoria sea la correcta.
                                </p>
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-6 text-orange-600 font-bold flex items-center gap-2 hover:underline"
                                >
                                    Limpiar filtros <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {filteredProducts.map((product) => (
                                    <CatalogProductCard
                                        key={product.id}
                                        product={product}
                                        viewMode={viewMode}
                                        categoryLabel={getCategoryName(product)}
                                        onOpen={() => handleProductOpen(product)}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

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

function FilterChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                active
                    ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
        >
            {label}
            {active && <X className="w-3 h-3" />}
        </button>
    );
}

function StockBadge({ stock }: { stock: StockStatus }) {
    const style =
        stock === 'EN STOCK'
            ? 'bg-emerald-100 text-emerald-700'
            : stock === 'A PEDIDO'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700';

    return (
        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style}`}>
            {stock}
        </span>
    );
}

function CatalogProductCard({
    product,
    viewMode,
    categoryLabel,
    onOpen,
}: {
    product: Product;
    viewMode: ViewMode;
    categoryLabel: string;
    onOpen: () => void;
}) {
    if (viewMode === 'list') {
        return (
            <div
                onClick={onOpen}
                className="group bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-4 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer"
            >
                <div className="w-16 h-16 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                    <img
                        src={product.images[0]}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        alt={product.title}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="mb-0.5">
                        <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full w-fit">
                            Categoria: {categoryLabel}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base truncate">{product.title}</h3>
                    <p className="text-xs text-slate-600">{product.presentacion ?? product.unit}</p>
                </div>
                <div className="text-right shrink-0">
                    {product.precioVisible !== false ? (
                        <p className="text-base font-bold text-slate-800">${formatPrice(product.price)}</p>
                    ) : (
                        <p className="text-base font-bold text-orange-700">Consultar precio</p>
                    )}
                    <button className="text-[10px] font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest mt-1">
                        Ficha rapida
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onOpen}
            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-orange-900/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                    src={product.images[0]}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={product.title}
                />
                <div className="absolute top-2 left-2">
                    <StockBadge stock={product.stock} />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-slate-700 hover:text-orange-600">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                    <div className="mb-1.5">
                        <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full w-fit">
                            Categoria: {categoryLabel}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-[1.08rem] leading-tight group-hover:text-orange-700 transition-colors line-clamp-2">
                        {product.title}
                    </h3>
                </div>

                <div className="mb-4">
                    <p className="text-[0.95rem] text-slate-600 line-clamp-2 italic mb-2">
                        {product.description}
                    </p>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {product.presentacion ?? product.unit}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Cotizacion</p>
                        {product.precioVisible !== false ? (
                            <p className="font-black text-slate-900 text-base whitespace-nowrap">${formatPrice(product.price)}</p>
                        ) : (
                            <p className="font-black text-orange-700 text-base whitespace-nowrap">Consultar precio</p>
                        )}
                    </div>
                    <button className="flex-1 bg-orange-50 text-orange-700 text-[11px] font-bold py-2 rounded-lg hover:bg-orange-600 hover:text-white transition-all">
                        Ver producto
                    </button>
                </div>
            </div>
        </div>
    );
}
