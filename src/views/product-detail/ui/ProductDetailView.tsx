'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronRight,
    Clock,
    Info,
    Download,
    ShoppingCart,
    Share2,
    Package,
    Weight,
    Ruler,
    CheckCircle2,
    FileText,
    ArrowLeft,
    Maximize2,
    X,
    ChevronLeft,
} from 'lucide-react';
import RelatedProductsCarousel from '@/src/widgets/related-products-carousel/ui/RelatedProductsCarousel';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';
import { useProducts } from '@/src/features/product-management';
import { useProductInteractionTracker } from '@/src/features/product-interaction';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductDetailViewProps {
    product: Product;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-0.5 p-2.5 bg-slate-50 text-slate-400 rounded-xl flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
            </div>
        </div>
    );
}

function StockBadge({ stock }: { stock: string }) {
    const config = {
        'EN STOCK': { label: 'Stock en Planta', bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
        'A PEDIDO': { label: 'Bajo Pedido', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
        'BAJO STOCK': { label: 'Stock Limitado', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
        'SIN STOCK': { label: 'Sin Stock', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    }[stock] ?? { label: stock, bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 ${config.bg} ${config.text} rounded-full text-[11px] font-bold`}>
            <div className={`w-1.5 h-1.5 ${config.dot} rounded-full animate-pulse`} />
            {config.label}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ProductDetailView({ product }: ProductDetailViewProps) {
    const router = useRouter();
    const { getRelatedProducts } = useProducts();
    const { trackView, trackClick } = useProductInteractionTracker();

    /* --- Variantes --- */
    const variants = useMemo(() => product.variants ?? [], [product.variants]);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
        const active = variants.find((v) => v.isActive);
        return active?.id ?? variants[0]?.id ?? '';
    });
    const effectiveVariantId = variants.some((v) => v.id === selectedVariantId)
        ? selectedVariantId
        : (variants.find((v) => v.isActive)?.id ?? variants[0]?.id ?? '');
    const selectedVariant = useMemo(
        () => variants.find((v) => v.id === effectiveVariantId) ?? variants[0],
        [effectiveVariantId, variants],
    );

    /* --- Datos efectivos del producto (mergeando variante seleccionada) --- */
    const productData = useMemo(
        () => ({
            ...product,
            sku: selectedVariant?.sku ?? product.sku,
            price: selectedVariant?.price ?? product.price,
            unit: selectedVariant?.unit ?? product.unit,
            stock: selectedVariant?.stock ?? product.stock,
            quickSpecs: selectedVariant?.quickSpecs ?? product.quickSpecs,
            specs: selectedVariant?.specs ?? product.specs,
            fullSpecs: selectedVariant?.specs ?? product.fullSpecs,
            color: selectedVariant?.color ?? product.color,
            material: selectedVariant?.material ?? product.material,
            contenido: selectedVariant?.contenido ?? product.contenido,
            unidadMedida: selectedVariant?.unidadVenta ?? product.unidadMedida,
            presentacion: selectedVariant?.presentacion ?? product.presentacion,
            pesoKg: selectedVariant?.pesoKg ?? product.pesoKg,
            altoMm: selectedVariant?.altoMm ?? product.altoMm,
            anchoMm: selectedVariant?.anchoMm ?? product.anchoMm,
            largoMm: selectedVariant?.largoMm ?? product.largoMm,
        }),
        [product, selectedVariant],
    );

    /* --- Galería --- */
    const [activeImage, setActiveImage] = useState(0);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [hoverZoom, setHoverZoom] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const LENS_SIZE = 180;
    const LENS_ZOOM = 2.4;
    const safeImages = useMemo(() => (product.images ?? []).filter(Boolean).slice(0, 4), [product.images]);

    /* --- Tabs --- */
    const [activeTab, setActiveTab] = useState<'especificaciones' | 'descripcion'>('descripcion');

    /* --- Datos derivados --- */
    const relatedProducts = getRelatedProducts(product.id, 20);

    /* --- Track view on mount --- */
    useEffect(() => {
        void trackView(product.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    /* --- Technical cards --- */
    const technicalCards = useMemo(() => {
        const cards: { label: string; value: string; icon: React.ReactNode }[] = [];
        if (productData.material) cards.push({ label: 'Material', value: productData.material, icon: <Package size={16} /> });
        if (productData.color) cards.push({
            label: 'Color',
            value: productData.color,
            icon: <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: '#64748b' }} />,
        });
        if (productData.pesoKg != null) cards.push({ label: 'Peso Unitario', value: `${productData.pesoKg} kg`, icon: <Weight size={16} /> });
        const dimU = (selectedVariant as unknown as Record<string, unknown>)?.dimensionUnit as string || 'mm';
        const dims = [
            productData.altoMm && `${productData.altoMm} ${dimU}`,
            productData.anchoMm && `${productData.anchoMm} ${dimU}`,
            productData.largoMm && `${productData.largoMm} ${dimU}`,
        ].filter(Boolean).join(' × ');
        if (dims) cards.push({ label: 'Dimensiones', value: dims, icon: <Ruler size={16} /> });
        if (productData.contenido) cards.push({
            label: 'Contenido',
            value: `${productData.contenido}${productData.unidadMedida ? ' ' + productData.unidadMedida : ''}`,
            icon: <Info size={16} />,
        });
        if (productData.presentacion) cards.push({ label: 'Presentación', value: productData.presentacion, icon: <Package size={16} /> });
        return cards;
    }, [productData, selectedVariant]);

    /* --- Helpers --- */
    const getVariantLabel = (v: typeof variants[0]) => {
        return (v as unknown as Record<string, unknown>).formatName as string
            || [v.presentacion, v.medida].filter(Boolean).join(' · ')
            || `Formato ${v.id.slice(0, 6)}`;
    };

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title: product.title, url: window.location.href });
            } catch { /* user cancelled */ }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(window.location.href);
        }
    };

    const prevImage = () => setActiveImage((p) => (p - 1 + safeImages.length) % safeImages.length);
    const nextImage = () => setActiveImage((p) => (p + 1) % safeImages.length);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8">
                <button
                    onClick={() => router.push('/catalog')}
                    className="hover:text-orange-600 transition-colors flex items-center gap-1.5"
                >
                    <ArrowLeft size={14} />
                    Catálogo
                </button>
                <ChevronRight size={12} />
                <span>{product.category}</span>
                <ChevronRight size={12} />
                <span className="text-slate-600 truncate max-w-[200px]">{product.title}</span>
            </nav>

            {/* ================================================================ */}
            {/*  CONTENEDOR PRINCIPAL: DOS COLUMNAS                              */}
            {/* ================================================================ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-2">

                    {/* ============================================================ */}
                    {/*  COLUMNA IZQUIERDA: GALERÍA + PRECIO                         */}
                    {/* ============================================================ */}
                    <div className="p-6 sm:p-8 lg:p-10 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100">

                        {/* Badge de disponibilidad */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="inline-block px-3 py-1.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {product.category}
                            </span>
                            <StockBadge stock={productData.stock} />
                        </div>

                        {/* Galería Principal */}
                        <div className="relative group mb-6">
                            <div
                                className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative cursor-zoom-in"
                                onMouseEnter={() => setHoverZoom(true)}
                                onMouseLeave={() => setHoverZoom(false)}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    setZoomPos({
                                        x: Math.max(0, Math.min(rect.width, x)),
                                        y: Math.max(0, Math.min(rect.height, y)),
                                        width: rect.width,
                                        height: rect.height,
                                    });
                                }}
                                onDoubleClick={() => setIsImageExpanded(true)}
                            >
                                {safeImages[activeImage] ? (
                                    <img
                                        src={safeImages[activeImage]}
                                        alt={`${product.title} - ${activeImage + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package className="w-16 h-16" />
                                    </div>
                                )}

                                {/* Zoom lens */}
                                {hoverZoom && safeImages[activeImage] && (
                                    <div
                                        className="pointer-events-none absolute rounded-full border-2 border-white/90 shadow-2xl hidden md:block"
                                        style={{
                                            width: `${LENS_SIZE}px`,
                                            height: `${LENS_SIZE}px`,
                                            left: `${zoomPos.x - LENS_SIZE / 2}px`,
                                            top: `${zoomPos.y - LENS_SIZE / 2}px`,
                                            backgroundImage: `url(${safeImages[activeImage]})`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: `${zoomPos.width * LENS_ZOOM}px ${zoomPos.height * LENS_ZOOM}px`,
                                            backgroundPosition: `${-(zoomPos.x * LENS_ZOOM - LENS_SIZE / 2)}px ${-(zoomPos.y * LENS_ZOOM - LENS_SIZE / 2)}px`,
                                        }}
                                    />
                                )}

                                {/* Expand button */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsImageExpanded(true); }}
                                    className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur rounded-xl shadow-lg text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Expandir imagen"
                                >
                                    <Maximize2 size={18} />
                                </button>

                                {/* Nav arrows */}
                                {safeImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft size={18} className="text-slate-700" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight size={18} className="text-slate-700" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {safeImages.length > 1 && (
                                <div className="flex gap-3 mt-4">
                                    {safeImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx
                                                ? 'border-orange-500 shadow-lg shadow-orange-100'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Expanded image lightbox */}
                        {isImageExpanded && safeImages[activeImage] && (
                            <div
                                className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4"
                                onClick={() => setIsImageExpanded(false)}
                                role="dialog"
                                aria-modal="true"
                            >
                                <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setIsImageExpanded(false)}
                                        className="absolute -top-11 right-0 text-white/90 hover:text-white flex items-center gap-2 text-sm font-semibold"
                                    >
                                        <X className="w-5 h-5" /> Cerrar
                                    </button>
                                    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="relative w-full aspect-[4/3] bg-black">
                                            <img
                                                src={safeImages[activeImage]}
                                                alt={`${product.title} - imagen expandida`}
                                                className="absolute inset-0 w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bloque de Precio (dark) */}
                        <div className="mt-auto">
                            {productData.precioVisible !== false ? (
                                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                                    <div className="flex items-end justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precio Unitario Ref.</p>
                                            <h3 className="text-3xl sm:text-4xl font-black flex items-center gap-2">
                                                ${formatPrice(productData.price)}
                                                <span className="text-sm font-medium text-slate-500">{productData.unit}</span>
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Disponibilidad</p>
                                            <p className={`text-sm font-bold ${productData.stock === 'EN STOCK' ? 'text-green-400' : productData.stock === 'A PEDIDO' ? 'text-blue-400' : 'text-amber-400'}`}>
                                                {productData.stock === 'EN STOCK' ? 'Entrega inmediata' : productData.stock === 'A PEDIDO' ? 'Bajo pedido' : productData.stock}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-800 pt-3">
                                        * El precio final puede variar según volumen de compra y costos de envío logístico.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                                    <p className="text-xl font-black mb-1">Precio bajo consulta</p>
                                    <p className="text-sm text-orange-100">Contáctanos para obtener una cotización personalizada</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/*  COLUMNA DERECHA: INFO TÉCNICA Y ACCIÓN                      */}
                    {/* ============================================================ */}
                    <div className="p-6 sm:p-8 lg:p-10 flex flex-col">

                        {/* Título y SKU */}
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-3">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                {product.grade && (
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                        {product.grade}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">
                                    SKU: {productData.sku}
                                </span>
                            </div>
                        </div>

                        {/* Selector de Variantes (botones) */}
                        {variants.length > 1 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Seleccionar Variante
                                    </label>
                                    <Info size={14} className="text-slate-300" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariantId(v.id)}
                                            className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 text-center ${effectiveVariantId === v.id
                                                ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100'
                                                : 'border-slate-100 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className={`text-sm font-black leading-tight ${effectiveVariantId === v.id ? 'text-orange-600' : 'text-slate-800'}`}>
                                                {getVariantLabel(v)}
                                            </span>
                                            {v.stock && (
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                    {v.stock === 'EN STOCK' ? 'Disponible' : v.stock === 'A PEDIDO' ? 'Bajo pedido' : v.stock}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Solo una variante → mostrar como dropdown si hay 1 */}
                        {variants.length === 1 && (
                            <div className="mb-6 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Formato</p>
                                <p className="text-sm font-bold text-slate-800">{getVariantLabel(variants[0])}</p>
                            </div>
                        )}

                        {/* Quick Specs */}
                        {(productData.quickSpecs ?? []).filter((s) => s.value?.trim()).length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {(productData.quickSpecs ?? []).filter((s) => s.value?.trim()).map((spec, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-orange-200 hover:shadow-sm transition-all"
                                    >
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {spec.label}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">{spec.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TABS DE INFORMACIÓN */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex gap-6 border-b border-slate-100 mb-6">
                                <button
                                    onClick={() => setActiveTab('descripcion')}
                                    className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'descripcion' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                                >
                                    Descripción
                                    {activeTab === 'descripcion' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('especificaciones')}
                                    className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'especificaciones' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                                >
                                    Especificaciones
                                    {activeTab === 'especificaciones' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
                                    )}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 product-detail-scroll">
                                {activeTab === 'especificaciones' ? (
                                    <div className="space-y-6">
                                        {/* Technical cards */}
                                        {technicalCards.length > 0 && (
                                            <div className="grid grid-cols-2 gap-6">
                                                {technicalCards.map((card) => (
                                                    <SpecItem
                                                        key={card.label}
                                                        icon={card.icon}
                                                        label={card.label}
                                                        value={card.value}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Nota Técnica */}
                                        {productData.notaTecnica && (
                                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={12} /> Nota del Experto
                                                </p>
                                                <p className="text-xs text-blue-700 italic font-medium leading-relaxed">
                                                    &ldquo;{productData.notaTecnica}&rdquo;
                                                </p>
                                            </div>
                                        )}

                                        {/* Specs table */}
                                        {Object.keys(productData.fullSpecs ?? productData.specs).length > 0 && (
                                            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                                <div className="px-5 py-3 border-b border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Especificaciones Detalladas
                                                    </h4>
                                                </div>
                                                {Object.entries(productData.fullSpecs ?? productData.specs).map(([key, val], idx) => (
                                                    <div
                                                        key={key}
                                                        className={`flex py-3 px-5 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-orange-50 transition-colors`}
                                                    >
                                                        <span className="w-36 text-xs font-semibold text-slate-500 flex items-center gap-2 flex-shrink-0">
                                                            <span className="w-1 h-1 bg-orange-500 rounded-full" />
                                                            {key}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900 flex-1">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Recursos Descargables */}
                                        {productData.recursos && productData.recursos.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                {productData.recursos.map((doc, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={() => { void trackClick(product.id, 'download_resource'); }}
                                                        className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-orange-200 hover:bg-orange-50/50 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{doc.label}</p>
                                                                <p className="text-[10px] text-slate-400">Descargar documento</p>
                                                            </div>
                                                        </div>
                                                        <Download size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {productData.description ? (
                                            <p className="text-sm text-slate-600 leading-[1.9] whitespace-pre-line">
                                                {productData.description}
                                            </p>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <FileText size={32} className="text-slate-200 mb-3" />
                                                <p className="text-sm font-semibold text-slate-400">Sin descripción disponible</p>
                                                <p className="text-xs text-slate-300 mt-1">Consulta las especificaciones técnicas del producto.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ACCIÓN PRINCIPAL */}
                        <div className="mt-8 flex gap-3">
                            <button
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                onClick={() => {
                                    void trackClick(product.id, 'request_quote');
                                }}
                            >
                                <ShoppingCart size={18} />
                                Solicitar Cotización
                            </button>
                            <button
                                onClick={() => void handleShare()}
                                className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                                title="Compartir producto"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom scrollbar styles */}
            <style>{`
                .product-detail-scroll::-webkit-scrollbar { width: 4px; }
                .product-detail-scroll::-webkit-scrollbar-track { background: transparent; }
                .product-detail-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .product-detail-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>

            {/* Productos Relacionados */}
            {relatedProducts.length > 0 && (
                <div className="mt-12">
                    <RelatedProductsCarousel products={relatedProducts} />
                </div>
            )}
        </div>
    );
}
