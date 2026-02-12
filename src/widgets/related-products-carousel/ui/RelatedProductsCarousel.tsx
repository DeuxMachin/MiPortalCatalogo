'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';

interface RelatedProductsCarouselProps {
    products: Product[];
}

export default function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Duplicar productos para scroll infinito si hay suficientes
    const displayProducts = products.length > 0 ? [...products, ...products, ...products] : [];

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScroll();
        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [displayProducts.length]);

    // Resetear posición para efecto infinito
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || products.length === 0) return;

        const handleScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const thirdWidth = scrollWidth / 3;
            
            // Si llegamos al final del segundo grupo, volver al inicio del segundo grupo
            if (scrollLeft >= thirdWidth * 2 - clientWidth) {
                container.scrollLeft = thirdWidth;
            }
            // Si llegamos al inicio del primer grupo, saltar al inicio del segundo grupo
            else if (scrollLeft <= 0) {
                container.scrollLeft = thirdWidth;
            }
        };

        container.addEventListener('scroll', handleScroll);
        // Iniciar en el medio
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth / 3;
        }

        return () => container.removeEventListener('scroll', handleScroll);
    }, [products.length]);

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 320; // Ancho de tarjeta + gap
        const newScrollLeft = direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth',
        });
    };

    const handleProductClick = (productId: string) => {
        router.push(`/catalog/${productId}`);
    };

    if (products.length === 0) return null;

    return (
        <section className="py-12 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-gray-100 relative">
            <div className="px-6 md:px-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Productos Relacionados
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            Descubre más productos de esta categoría
                        </p>
                    </div>
                </div>
            </div>

            {/* Botones de navegación centrados verticalmente */}
            <button
                onClick={() => scroll('left')}
                className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full 
                    flex items-center justify-center transition-all shadow-xl
                    ${showLeftArrow 
                        ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-110' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
                disabled={!showLeftArrow}
                aria-label="Anterior"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={() => scroll('right')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full 
                    flex items-center justify-center transition-all shadow-xl
                    ${showRightArrow 
                        ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-110' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'}`}
                disabled={!showRightArrow}
                aria-label="Siguiente"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide px-6 md:px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="flex gap-5" style={{ width: 'max-content' }}>
                    {displayProducts.map((product, index) => (
                        <article
                            key={`${product.id}-${index}`}
                            className="w-[300px] bg-white border border-gray-100 rounded-2xl overflow-hidden 
                                group hover:shadow-xl transition-all duration-300 cursor-pointer flex-shrink-0
                                hover:border-orange-200"
                            onClick={() => handleProductClick(product.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleProductClick(product.id)}
                        >
                            {/* Imagen */}
                            <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                                <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                />
                                {product.stock === 'EN STOCK' && (
                                    <div className="absolute top-3 left-3">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg 
                                            bg-emerald-500 text-white shadow-lg">
                                            En Stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-slate-400">
                                        SKU: {product.sku}
                                    </span>
                                    <span className="text-xs text-slate-300">•</span>
                                    <span className="text-xs font-medium text-orange-600">
                                        {product.category}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 
                                    transition-colors mb-3 leading-snug line-clamp-2 min-h-[3rem]">
                                    {product.title}
                                </h3>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div>
                                        {product.precioVisible !== false ? (
                                            <div>
                                                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                                                    ${formatPrice(product.price)}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">
                                                    {product.unit}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-orange-600">
                                                Consultar precio
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center 
                                        text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
