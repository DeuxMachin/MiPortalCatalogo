'use client';

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
} from 'lucide-react';
import ProductGallery from '@/src/widgets/product-gallery/ui/ProductGallery';
import type { Product } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';

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
    const quickSpecs = (product.quickSpecs ?? []).filter((s) => s.value?.trim());

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
                    stockLabel={product.stock === 'EN STOCK' ? 'Stock en Planta' : undefined}
                />

                {/* Info */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-400">
                            SKU: {product.sku}
                        </span>
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                        {product.title}
                    </h1>

                    {/* Precio */}
                    {product.precioVisible !== false ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-7 mb-6 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-orange-600/5 rounded-full -mr-14 -mt-14" />
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    ${formatPrice(product.price)}
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
                    <p className="text-base text-slate-500 leading-relaxed mb-5">{product.description}</p>
                    <button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-sm shadow-lg shadow-orange-600/20"
                        onClick={() => router.push('/catalog')}
                    >
                        Volver al Catálogo <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-extrabold text-slate-900 mb-5">Ficha Técnica</h2>

                        {/* Structured technical spec cards */}
                        {(() => {
                            const cards: { label: string; value: string }[] = [];
                            if (product.color) cards.push({ label: 'Color', value: product.color });
                            if (product.material) cards.push({ label: 'Material', value: product.material });
                            if (product.contenido) cards.push({ label: 'Contenido', value: `${product.contenido}${product.unidadMedida ? ' ' + product.unidadMedida : ''}` });
                            if (product.presentacion) cards.push({ label: 'Presentación', value: product.presentacion });
                            if (product.pesoKg != null) cards.push({ label: 'Peso', value: `${product.pesoKg} kg` });
                            const dims = [product.altoMm && `${product.altoMm}mm`, product.anchoMm && `${product.anchoMm}mm`, product.largoMm && `${product.largoMm}mm`].filter(Boolean).join(' × ');
                            if (dims) cards.push({ label: 'Dimensiones', value: dims });

                            return cards.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                    {cards.map((c) => (
                                        <div key={c.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4 group hover:bg-white hover:border-orange-200 transition-all">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{c.label}</p>
                                            <p className="text-sm font-bold text-slate-900">{c.value}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : null;
                        })()}

                        {/* Full specs table */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md">
                            {Object.entries(product.fullSpecs ?? product.specs).map(([key, val], idx) => (
                                <div
                                    key={key}
                                    className={`flex py-4 px-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                                >
                                    <span className="w-44 text-sm font-semibold text-slate-400">{key}</span>
                                    <span className="text-sm font-semibold text-slate-900">{val}</span>
                                </div>
                            ))}
                        </div>
                </div>
                <div className="space-y-6">
                    {product.notaTecnica && (
                        <div className="bg-orange-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute -bottom-4 -right-4 opacity-10">
                                <Info className="w-28 h-28" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-80">Nota Técnica</p>
                            <p className="text-base font-medium leading-relaxed italic whitespace-pre-line">
                                {product.notaTecnica}
                            </p>
                        </div>
                    )}
                    {product.recursos && product.recursos.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                Recursos Descargables
                            </h2>
                            <div className="space-y-3">
                                {product.recursos.map((doc, idx) => (
                                    <a
                                        key={`${doc.label}-${idx}`}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-orange-400 transition-all group shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-50 text-orange-600 p-2 rounded-lg shadow-sm">
                                                <Download className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">{doc.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
