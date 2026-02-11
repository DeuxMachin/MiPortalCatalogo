'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    viewMode?: 'list' | 'grid';
}

/** Tarjeta vista LISTA (horizontal). */
function ListCard({ product, onClick }: Omit<ProductCardProps, 'viewMode'>) {
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
                <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 256px"
                />
            </div>

            {/* Info */}
            <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-semibold bg-slate-800 text-white px-2.5 py-0.5 rounded">
                            SKU: {product.sku}
                        </span>
                        <StockBadge stock={product.stock} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 leading-snug">
                        {product.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {product.description}
                    </p>
                    {product.specs && (
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(product.specs).map(([key, val]) => (
                                <span key={key} className="text-sm text-slate-500 font-medium capitalize">
                                    <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 align-middle" />
                                    {key}: {val}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Precio */}
            <div className="p-6 bg-slate-50 sm:w-52 flex flex-col justify-center items-end text-right border-t sm:border-t-0 sm:border-l border-gray-100 flex-shrink-0">
                <span className="text-xs font-medium text-slate-400 uppercase mb-1">
                    Precio Neto
                </span>
                <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        ${formatPrice(product.price)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{product.unit}</span>
                </div>
                <div className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow active:scale-95">
                    Ver Detalle <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </article>
    );
}

/** Tarjeta vista GRILLA (vertical). */
function GridCard({ product, onClick }: Omit<ProductCardProps, 'viewMode'>) {
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
                <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute top-3 left-3">
                    <StockBadge stock={product.stock} />
                </div>
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-medium text-slate-400 mb-1">SKU: {product.sku}</span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2 leading-snug line-clamp-2">
                    {product.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                    {product.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                            ${formatPrice(product.price)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">{product.unit}</span>
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
        stock === 'EN STOCK' || stock === 'DISPONIBLE'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : stock === 'A PEDIDO'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-orange-50 text-orange-700 border-orange-200';

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
