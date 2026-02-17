'use client';
import { ChevronRight } from 'lucide-react';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    viewMode?: 'list' | 'grid';
}

const MAX_WORDS = 100;

function truncateWords(text: string, count: number) {
    const words = text.trim().split(/\s+/);
    if (words.length <= count) return text;
    return `${words.slice(0, count).join(' ')}…`;
}

function buildFichaTecnicaItems(product: Product): Array<{ label: string; value: string }> {
    const items: Array<{ label: string; value: string }> = [];

    if (product.color) items.push({ label: 'Color', value: product.color });
    if (product.material) items.push({ label: 'Material', value: product.material });
    if (product.contenido) {
        const unidad = product.unidadMedida ? ` ${product.unidadMedida}` : '';
        items.push({ label: 'Contenido', value: `${product.contenido}${unidad}` });
    }
    if (product.presentacion) items.push({ label: 'Presentación', value: product.presentacion });
    if (product.pesoKg != null) items.push({ label: 'Peso', value: `${product.pesoKg} kg` });

    const dims = [
        product.altoMm != null ? `${product.altoMm}mm` : null,
        product.anchoMm != null ? `${product.anchoMm}mm` : null,
        product.largoMm != null ? `${product.largoMm}mm` : null,
    ].filter(Boolean).join(' × ');
    if (dims) items.push({ label: 'Dimensiones', value: dims });

    const specs = product.fullSpecs ?? product.specs;
    if (specs && typeof specs === 'object') {
        Object.entries(specs).forEach(([key, val]) => {
            if (!key?.trim()) return;
            items.push({ label: key, value: String(val ?? '') });
        });
    }

    return items;
}

/** Tarjeta vista LISTA (horizontal). */
function ListCard({ product, onClick }: Omit<ProductCardProps, 'viewMode'>) {
    const fichaItems = buildFichaTecnicaItems(product).slice(0, 3);
    const descriptionText = product.description?.trim()
        ? truncateWords(product.description, MAX_WORDS)
        : 'Sin descripción';
    const categoryLabel = product.category?.trim() || 'Sin categoria';

    return (
        <article
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col sm:flex-row
        group hover:shadow-lg transition-all duration-300 cursor-pointer
        border-l-4 border-l-transparent hover:border-l-orange-500"
            onClick={() => onClick(product)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick(product)}
        >
            {/* Imagen */}
            <div className="sm:w-64 h-48 sm:h-auto overflow-hidden bg-slate-100 flex-shrink-0 relative">
                <img
                    src={product.images[0]}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Info */}
            <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-semibold bg-slate-800 text-white px-2.5 py-0.5 rounded">
                            Categoria: {categoryLabel}
                        </span>
                        <StockBadge stock={product.stock} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 leading-snug">
                        {product.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                        {descriptionText}
                    </p>
                    {fichaItems.length > 0 && (
                        <div className="flex flex-wrap gap-4">
                            {fichaItems.map((item) => (
                                <span key={item.label} className="text-sm text-slate-500 font-medium">
                                    <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 align-middle" />
                                    {item.label}: {item.value}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Precio */}
            <div className="p-6 bg-slate-50 sm:w-52 flex flex-col justify-center items-end text-right border-t sm:border-t-0 sm:border-l border-gray-100 flex-shrink-0">
                {product.precioVisible !== false ? (
                    <>
                        <span className="text-xs font-medium text-slate-400 uppercase mb-1">
                            Precio Neto
                        </span>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                ${formatPrice(product.price)}
                            </span>
                            <span className="text-xs font-medium text-slate-400">{product.unit}</span>
                        </div>
                    </>
                ) : (
                    <div className="mb-4">
                        <span className="text-sm font-bold text-orange-600">Consultar precio</span>
                    </div>
                )}
                <div className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow active:scale-95">
                    Ver Detalle <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </article>
    );
}

/** Tarjeta vista GRILLA (vertical). */
function GridCard({ product, onClick }: Omit<ProductCardProps, 'viewMode'>) {
    const fichaItems = buildFichaTecnicaItems(product).slice(0, 3);
    const descriptionText = product.description?.trim()
        ? truncateWords(product.description, MAX_WORDS)
        : 'Sin descripción';
    const categoryLabel = product.category?.trim() || 'Sin categoria';

    return (
        <article
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col
        group hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
            onClick={() => onClick(product)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick(product)}
        >
            {/* Imagen */}
            <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                <img
                    src={product.images[0]}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute top-3 left-3">
                    <StockBadge stock={product.stock} />
                </div>
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-medium text-slate-400 mb-1">Categoria: {categoryLabel}</span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 leading-snug line-clamp-2">
                    {product.title}
                </h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1">
                    {descriptionText}
                </p>
                {fichaItems.length > 0 && (
                    <div className="flex flex-wrap gap-3 -mt-2 mb-3">
                        {fichaItems.map((item) => (
                            <span key={item.label} className="text-xs text-slate-500 font-semibold">
                                <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 align-middle" />
                                {item.label}: {item.value}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        {product.precioVisible !== false ? (
                            <>
                                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    ${formatPrice(product.price)}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
                            </>
                        ) : (
                            <span className="text-sm font-bold text-orange-600">Consultar precio</span>
                        )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </article>
    );
}

function StockBadge({ stock }: { stock: string }) {
    const style =
        stock === 'EN STOCK'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : stock === 'A PEDIDO'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-red-700 border-red-200';

    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${style}`}>
            {stock}
        </span>
    );
}

export default function ProductCard({ product, onClick, viewMode = 'list' }: ProductCardProps) {
    return viewMode === 'grid' ? (
        <GridCard product={product} onClick={onClick} />
    ) : (
        <ListCard product={product} onClick={onClick} />
    );
}
