'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Info, Package, Clock, ShoppingCart } from 'lucide-react';
import type { Product } from '@/src/entities/product/model/types';
import { useProductInteractionTracker } from '@/src/features/product-interaction';
import { formatPrice } from '@/src/shared/lib/formatters';

interface ProductBookModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductBookModal({ product, isOpen, onClose }: ProductBookModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const { trackClick } = useProductInteractionTracker();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsClosing(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;

    // Construir cards de ficha técnica
    const technicalCards: { label: string; value: string }[] = [];
    if (product.color) technicalCards.push({ label: 'Color', value: product.color });
    if (product.material) technicalCards.push({ label: 'Material', value: product.material });
    if (product.contenido) {
        technicalCards.push({
            label: 'Contenido',
            value: `${product.contenido}${product.unidadMedida ? ' ' + product.unidadMedida : ''}`,
        });
    }
    if (product.presentacion) technicalCards.push({ label: 'Presentación', value: product.presentacion });
    if (product.pesoKg != null) technicalCards.push({ label: 'Peso', value: `${product.pesoKg} kg` });
    const dims = [
        product.altoMm && `${product.altoMm}mm`,
        product.anchoMm && `${product.anchoMm}mm`,
        product.largoMm && `${product.largoMm}mm`,
    ]
        .filter(Boolean)
        .join(' × ');
    if (dims) technicalCards.push({ label: 'Dimensiones', value: dims });

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/55 transition-opacity duration-200 ${
                isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleClose}
        >
            {/* Modal Libro */}
            <div
                className={`relative bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-7xl w-full max-h-[96vh] overflow-hidden transform transition-all duration-200 ${
                    isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5 text-slate-700" />
                </button>

                {/* Contenedor de páginas del libro */}
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[96vh] overflow-y-auto overscroll-contain">
                    {/* PÁGINA IZQUIERDA - Imágenes y Info Principal */}
                    <div className="bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 lg:p-12 border-r border-gray-200 flex flex-col">
                        {/* Badge de categoría */}
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                {product.category}
                            </span>
                        </div>

                        {/* Galería de imágenes */}
                        <div className="mb-6 flex-shrink-0">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-lg mb-4">
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={`${product.title} - ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {product.stock === 'EN STOCK' && (
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                            ✓ Stock en Planta
                                        </span>
                                    </div>
                                )}
                                {product.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-slate-700" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-700" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Miniaturas */}
                            {product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                                idx === currentImageIndex
                                                    ? 'border-orange-500 shadow-md'
                                                    : 'border-gray-200 hover:border-orange-300'
                                            }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`Miniatura ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Título y SKU */}
                        <div className="mb-6">
                            <div className="text-sm text-slate-500 font-semibold mb-2 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                SKU: {product.sku}
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                                {product.title}
                            </h1>
                        </div>

                        {/* Precio */}
                        {product.precioVisible !== false ? (
                            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 mb-6 shadow-md">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-sm text-slate-500 font-semibold">Precio Unitario</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                                        ${formatPrice(product.price)}
                                    </span>
                                    <span className="text-base sm:text-lg text-slate-500 font-semibold">{product.unit}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 pt-3 border-t border-orange-100">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="font-medium">Envío prioritario 24-48h disponible</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 mb-6 text-center">
                                <p className="text-xl font-bold text-orange-700 mb-2">Precio bajo consulta</p>
                                <p className="text-sm text-orange-600">
                                    Contáctanos para obtener una cotización personalizada
                                </p>
                            </div>
                        )}

                        {/* Descripción */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Descripción
                            </h3>
                            <p className="text-slate-700 leading-relaxed">{product.description}</p>
                        </div>

                        {/* Quick Specs */}
                        {product.quickSpecs && product.quickSpecs.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {product.quickSpecs.map((spec, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white border border-slate-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all"
                                    >
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                            {spec.label}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">{spec.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PÁGINA DERECHA - Ficha Técnica y Recursos */}
                    <div className="bg-white p-4 sm:p-6 lg:p-12">
                        {/* Header Ficha Técnica */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Ficha Técnica Completa</h2>
                            </div>
                            <p className="text-slate-600 text-sm">
                                Especificaciones detalladas y características del producto
                            </p>
                        </div>

                        {/* Cards de características principales */}
                        {technicalCards.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                    Características Principales
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {technicalCards.map((card) => (
                                        <div
                                            key={card.label}
                                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-white hover:border-orange-300 hover:shadow-md transition-all"
                                        >
                                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">
                                                {card.label}
                                            </p>
                                            <p className="text-sm font-bold text-slate-900">{card.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Especificaciones detalladas */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                Especificaciones Detalladas
                            </h3>
                            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                                {Object.entries(product.fullSpecs ?? product.specs).map(([key, val], idx) => (
                                    <div
                                        key={key}
                                        className={`flex py-3 px-5 ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                        } hover:bg-orange-50 transition-colors`}
                                    >
                                        <span className="w-40 text-sm font-semibold text-slate-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                                            {key}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900 flex-1">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nota Técnica */}
                        {product.notaTecnica && (
                            <div className="mb-8">
                                <div className="bg-orange-600 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-5 h-5" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">Nota Técnica</h3>
                                    </div>
                                    <p className="text-base leading-relaxed italic whitespace-pre-line">
                                        {product.notaTecnica}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Recursos Descargables */}
                        {product.recursos && product.recursos.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Recursos Descargables
                                </h3>
                                <div className="space-y-3">
                                    {product.recursos.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={() => {
                                                void trackClick(product.id, 'download_resource');
                                            }}
                                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-orange-400 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-100 text-orange-600 p-2.5 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {doc.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA Button */}
                        <div className="bg-white pt-6 border-t border-gray-200">
                            <button
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                                onClick={() => {
                                    void trackClick(product.id, 'request_quote');
                                    handleClose();
                                }}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Solicitar Cotización
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
