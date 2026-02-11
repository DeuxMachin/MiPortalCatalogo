'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronRight,
    Star,
    Clock,
    Trophy,
    ShieldCheck,
    Droplets,
    Info,
    Download,
    ArrowRight,
    FileText,
    Award,
} from 'lucide-react';
import ProductGallery from '@/src/widgets/product-gallery/ui/ProductGallery';
import type { Product } from '@/src/entities/product/model/types';
import type { RelatedProduct } from '@/src/entities/product/model/types';
import { formatPrice } from '@/src/shared/lib/formatters';
import { MOCK_RELATED } from '@/src/entities/product/model/mock-data';

interface ProductDetailViewProps {
    product: Product;
}

const QUICK_SPECS = [
    { icon: <Clock className="w-5 h-5" />, label: 'Resistencia', val: 'Alta / Industrial' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Normativa', val: 'NCh ISO Cert' },
    { icon: <ShieldCheck className="w-5 h-5" />, label: 'Protección', val: 'Anticorrosivo' },
    { icon: <Droplets className="w-5 h-5" />, label: 'Propiedad', val: 'Impermeable' },
];

const TABS = ['Especificaciones Técnicas', 'Memoria de Cálculo', 'Certificaciones'] as const;

export default function ProductDetailView({ product }: ProductDetailViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>(TABS[0]);

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
                    stockLabel={product.stock === 'EN STOCK' || product.stock === 'DISPONIBLE' ? 'Stock en Planta' : undefined}
                />

                {/* Info */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-400">
                            SKU: {product.sku}
                        </span>
                        {product.rating != null && (
                            <div className="flex items-center gap-1 text-orange-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < product.rating! ? 'fill-current' : ''}`} />
                                ))}
                                <span className="text-sm text-slate-500 ml-2">
                                    ({product.reviews} reseñas)
                                </span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                        {product.title}
                    </h1>

                    {/* Precio */}
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

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {QUICK_SPECS.map((spec, i) => (
                            <div
                                key={i}
                                className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3 group hover:bg-white hover:border-orange-200 transition-all"
                            >
                                <div className="bg-white p-2.5 rounded-lg text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                                    {spec.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                        {spec.label}
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">{spec.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

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

            {/* Tabs */}
            <div className="border-b-2 border-gray-100 mb-8">
                <div className="flex gap-6 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            className={`pb-4 text-sm font-semibold transition-all relative whitespace-nowrap
                ${activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-orange-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {activeTab === 'Especificaciones Técnicas' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-extrabold text-slate-900 mb-5">Ficha Técnica</h2>
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
                        <div className="bg-orange-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute -bottom-4 -right-4 opacity-10">
                                <Info className="w-28 h-28" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-80">Nota Técnica</p>
                            <p className="text-base font-medium leading-relaxed italic">
                                &ldquo;Este material presenta el mejor balance costo-beneficio para proyectos
                                residenciales de altura.&rdquo;
                            </p>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                Recursos Descargables
                            </h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Hoja de Seguridad (HDS)', color: 'bg-red-50 text-red-600' },
                                    { label: 'Ficha Técnica Full', color: 'bg-orange-50 text-orange-600' },
                                ].map((doc) => (
                                    <button
                                        key={doc.label}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-orange-400 transition-all group shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`${doc.color} p-2 rounded-lg shadow-sm`}>
                                                <Download className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">{doc.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Memoria de Cálculo' && (
                <div className="mb-16">
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Memoria de Cálculo</h3>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                            Los documentos de memoria de cálculo contienen los análisis de resistencia, carga máxima,
                            y comportamiento estructural del material según las normativas vigentes (NCh, ACI, ASTM).
                        </p>
                        <div className="space-y-2 text-left bg-slate-50 rounded-xl p-4 mb-4">
                            <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Resistencia a la tracción
                            </p>
                            <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Resistencia al corte
                            </p>
                            <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Módulo de elasticidad
                            </p>
                            <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Fatiga y fluencia
                            </p>
                        </div>
                        <p className="text-xs text-slate-400">
                            Los PDFs estarán disponibles cuando se conecte la base de datos.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'Certificaciones' && (
                <div className="mb-16">
                    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Certificaciones del Producto</h3>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                            Certificados que acreditan el cumplimiento de normas nacionales e internacionales para uso
                            en obras de construcción.
                        </p>
                        <div className="space-y-3 text-left mb-4">
                            {[
                                { name: 'NCh 204 Of.2006', desc: 'Barras laminadas en caliente para hormigón armado' },
                                { name: 'ASTM A615/A615M', desc: 'Standard for deformed and plain carbon-steel bars' },
                                { name: 'ISO 9001:2015', desc: 'Sistema de gestión de calidad certificado' },
                            ].map((cert) => (
                                <div key={cert.name} className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                                    <div className="bg-amber-100 p-1.5 rounded-lg mt-0.5">
                                        <Award className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{cert.name}</p>
                                        <p className="text-xs text-slate-500">{cert.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">
                            Los certificados PDF estarán disponibles cuando se conecte la base de datos.
                        </p>
                    </div>
                </div>
            )}

            {/* Productos relacionados */}
            <section className="pb-10">
                <h2 className="text-xl font-extrabold text-slate-900 mb-6">Productos Relacionados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_RELATED.map((item) => (
                        <RelatedCard key={item.id} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function RelatedCard({ item }: { item: RelatedProduct }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-full">
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow">
                        {item.category}
                    </span>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1 justify-between">
                <h3 className="text-sm font-bold text-slate-900 mb-3 line-clamp-2 leading-snug">
                    {item.title}
                </h3>
                <div className="flex items-center justify-between">
                    <p className="text-lg font-extrabold text-orange-600 tracking-tight">
                        ${formatPrice(item.price)}
                    </p>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
