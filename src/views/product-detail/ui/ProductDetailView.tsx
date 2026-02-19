'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronRight,
    Clock,
    Trophy,
    ShieldCheck,
    Droplets,
    Info,
    Download,
    ArrowRight,
    PackageCheck,
    Sparkles,
} from 'lucide-react';
import ProductGallery from '@/src/widgets/product-gallery/ui/ProductGallery';
import RelatedProductsCarousel from '@/src/widgets/related-products-carousel/ui/RelatedProductsCarousel';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';
import { useProducts } from '@/src/features/product-management';

interface ProductDetailViewProps {
    product: Product;
}

const QUICK_SPECS_ICONS = {
    Resistencia: <Clock className="w-5 h-5" />,
    Normativa: <Trophy className="w-5 h-5" />,
    Protección: <ShieldCheck className="w-5 h-5" />,
    Propiedad: <Droplets className="w-5 h-5" />,
} as const;

export default function ProductDetailView({ product }: ProductDetailViewProps) {
    const router = useRouter();
    const { getRelatedProducts } = useProducts();
    const variants = useMemo(() => product.variants ?? [], [product.variants]);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
        const active = variants.find((variant) => variant.isActive);
        return active?.id ?? variants[0]?.id ?? '';
    });
    const effectiveVariantId = variants.some((variant) => variant.id === selectedVariantId)
        ? selectedVariantId
        : (variants.find((variant) => variant.isActive)?.id ?? variants[0]?.id ?? '');
    const selectedVariant = useMemo(
        () => variants.find((variant) => variant.id === effectiveVariantId) ?? variants[0],
        [effectiveVariantId, variants],
    );
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
    const quickSpecs = (productData.quickSpecs ?? []).filter((s) => s.value?.trim());
    const relatedProducts = getRelatedProducts(product.id, 20);

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="text-sm text-slate-400 flex items-center gap-2 mb-8 font-medium">
                <span
                    className="cursor-pointer hover:text-orange-600 transition-colors"
                    onClick={() => router.push('/catalog')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && router.push('/catalog')}
                >
                    Catálogo
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-700 font-semibold">{product.category}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                {/* Galería */}
                <ProductGallery
                    images={product.images}
                    title={product.title}
                    stockLabel={productData.stock === 'EN STOCK' ? 'Stock en Planta' : undefined}
                />

                {/* Info */}
                <div className="flex flex-col">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                        {productData.title}
                    </h1>

                    {variants.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                                Variante
                            </label>
                            <select
                                value={effectiveVariantId}
                                onChange={(event) => setSelectedVariantId(event.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-slate-700"
                            >
                                {variants.map((variant) => {
                                    const labelParts = [variant.presentacion, variant.medida].filter(Boolean);
                                    return (
                                        <option key={variant.id} value={variant.id}>
                                            {labelParts.join(' · ') || `Formato ${variant.id.slice(0, 6)}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {/* Precio */}
                    {productData.precioVisible !== false ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-7 mb-6 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-600/5 rounded-full -mr-14 -mt-14" />
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    ${formatPrice(productData.price)}
                                </span>
                                <span className="text-base font-semibold text-slate-400">Neto</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Valores sujetos a variación por volumen
                            </p>
                            <div className="h-px bg-gray-100 w-full mb-4" />
                            <div className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                Envío prioritario 24-48h
                            </div>
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-7 mb-6 text-center">
                            <p className="text-lg font-bold text-orange-700 mb-1">Precio bajo consulta</p>
                            <p className="text-sm text-orange-600">Contáctanos para obtener una cotización personalizada</p>
                        </div>
                    )}

                    {/* Quick Specs */}
                    {quickSpecs.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {quickSpecs.map((spec, i) => (
                                <div
                                    key={`${spec.label}-${i}`}
                                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3 group hover:bg-white hover:border-orange-200 transition-all"
                                >
                                    <div className="bg-white p-2.5 rounded-lg text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                                        {QUICK_SPECS_ICONS[spec.label as keyof typeof QUICK_SPECS_ICONS] ?? <Info className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                            {spec.label}
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">{spec.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-sm shadow-lg shadow-orange-600/20"
                        onClick={() => router.push('/catalog')}
                    >
                        Volver al Catálogo <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div className="bg-white rounded-3xl overflow-hidden mb-16 shadow-lg border border-gray-200">
                {/* Header con diseño suave */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-8 py-6 border-b border-orange-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                            <PackageCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Ficha Técnica Completa
                            </h2>
                            <p className="text-slate-600 text-sm font-medium">
                                Especificaciones detalladas del producto
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                    <div className="lg:col-span-2 space-y-6">
                        {productData.description && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Descripción</h3>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                    {productData.description}
                                </p>
                            </div>
                        )}

                        {/* Structured technical spec cards */}
                        {(() => {
                            const cards: { label: string; value: string; icon?: React.ReactNode }[] = [];
                            if (productData.color) cards.push({ label: 'Color', value: productData.color, icon: <Sparkles className="w-4 h-4" /> });
                            if (productData.material) cards.push({ label: 'Material', value: productData.material, icon: <PackageCheck className="w-4 h-4" /> });
                            if (productData.contenido) cards.push({ label: 'Contenido', value: `${productData.contenido}${productData.unidadMedida ? ' ' + productData.unidadMedida : ''}`, icon: <Info className="w-4 h-4" /> });
                            if (productData.presentacion) cards.push({ label: 'Presentación', value: productData.presentacion });
                            if (productData.pesoKg != null) cards.push({ label: 'Peso', value: `${productData.pesoKg} kg` });
                            const dims = [productData.altoMm && `${productData.altoMm}mm`, productData.anchoMm && `${productData.anchoMm}mm`, productData.largoMm && `${productData.largoMm}mm`].filter(Boolean).join(' × ');
                            if (dims) cards.push({ label: 'Dimensiones', value: dims });

                            return cards.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                    {cards.map((c) => (
                                        <div key={c.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 
                                            group hover:bg-white hover:border-orange-300 transition-all hover:shadow-md">
                                            {c.icon && (
                                                <div className="mb-2 text-orange-600">
                                                    {c.icon}
                                                </div>
                                            )}
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                                {c.label}
                                            </p>
                                            <p className="text-sm font-bold text-slate-900">
                                                {c.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : null;
                        })()}

                        {/* Full specs table con diseño mejorado */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Especificaciones Detalladas
                                </h3>
                            </div>
                            {Object.entries(productData.fullSpecs ?? productData.specs).map(([key, val], idx) => (
                                <div
                                    key={key}
                                    className={`flex py-4 px-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} 
                                        hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0`}
                                >
                                    <span className="w-44 text-sm font-semibold text-slate-500 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                        {key}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900 flex-1">
                                        {val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {productData.notaTecnica && (
                            <div className="bg-orange-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                                <div className="absolute -bottom-4 -right-4 opacity-10">
                                    <Info className="w-28 h-28" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-wider">
                                            Nota Técnica
                                        </p>
                                    </div>
                                    <p className="text-base font-medium leading-relaxed italic whitespace-pre-line">
                                        {productData.notaTecnica}
                                    </p>
                                </div>
                            </div>
                        )}
                        {productData.recursos && productData.recursos.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Recursos Descargables
                                </h3>
                                <div className="space-y-3">
                                    {productData.recursos.map((doc, idx) => (
                                        <a
                                            key={`${doc.label}-${idx}`}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full flex items-center justify-between p-4 bg-white 
                                                border border-slate-200 rounded-xl hover:border-orange-400 hover:shadow-md 
                                                transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-100 text-orange-600 p-2.5 rounded-lg 
                                                    group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {doc.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 
                                                group-hover:translate-x-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Productos Relacionados */}
            {relatedProducts.length > 0 && (
                <RelatedProductsCarousel products={relatedProducts} />
            )}

        </div>
    );
}
