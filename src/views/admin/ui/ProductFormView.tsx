'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowLeft,
    ArrowRight,
    Save,
    Plus,
    Trash2,
    Star,
    Upload,
    Eye,
    Sparkles,
    ChevronRight,
    Clock,
    Trophy,
    ShieldCheck,
    Droplets,
    Info,
} from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import { MOCK_CATEGORIES } from '@/src/entities/category/model/mock-data';
import type { Product } from '@/src/entities/product/model/types';
import type { StockStatus } from '@/src/shared/types/common';
import { formatPrice } from '@/src/shared/lib/formatters';

interface ProductFormViewProps {
    editProduct?: Product;
}

interface FormData {
    title: string;
    sku: string;
    price: string;
    categoryId: string;
    description: string;
    stock: StockStatus;
    imageUrl: string;
    isPublished: boolean;
    specs: { key: string; value: string }[];
}

const STOCK_OPTIONS: StockStatus[] = ['EN STOCK', 'A PEDIDO', 'DISPONIBLE', 'AGOTADO'];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600';

const QUICK_SPECS_ICONS = [
    { icon: <Clock className="w-4 h-4" />, label: 'Resistencia' },
    { icon: <Trophy className="w-4 h-4" />, label: 'Normativa' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Protección' },
    { icon: <Droplets className="w-4 h-4" />, label: 'Propiedad' },
];

function buildFormData(product?: Product): FormData {
    if (product) {
        return {
            title: product.title,
            sku: product.sku,
            price: String(product.price),
            categoryId: String(product.categoryId),
            description: product.description,
            stock: product.stock,
            imageUrl: product.images[0] || DEFAULT_IMAGE,
            isPublished: product.isPublished,
            specs: Object.entries(product.fullSpecs ?? product.specs).map(([key, value]) => ({ key, value })),
        };
    }
    return {
        title: '',
        sku: '',
        price: '',
        categoryId: '',
        description: '',
        stock: 'EN STOCK',
        imageUrl: DEFAULT_IMAGE,
        isPublished: true,
        specs: [{ key: '', value: '' }],
    };
}

export default function ProductFormView({ editProduct }: ProductFormViewProps) {
    const router = useRouter();
    const { addProduct, updateProduct } = useProducts();
    const isEditing = !!editProduct;

    const [form, setForm] = useState<FormData>(() => buildFormData(editProduct));
    const [mobileStep, setMobileStep] = useState<'form' | 'preview'>('form');
    const [saved, setSaved] = useState(false);

    const categoryName = MOCK_CATEGORIES.find((c) => c.id === Number(form.categoryId))?.name ?? '';

    const updateField = (field: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
        setForm((prev) => {
            const specs = [...prev.specs];
            specs[index] = { ...specs[index], [field]: value };
            return { ...prev, specs };
        });
    };

    const addSpec = () => {
        setForm((prev) => ({ ...prev, specs: [...prev.specs, { key: '', value: '' }] }));
    };

    const removeSpec = (index: number) => {
        setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }));
    };

    const handleSave = () => {
        const price = Number(form.price) || 0;
        const catId = Number(form.categoryId) || 1;
        const specsObj: Record<string, string> = {};
        form.specs.forEach((s) => {
            if (s.key.trim()) specsObj[s.key.trim()] = s.value.trim();
        });

        const productData = {
            title: form.title || 'Producto Sin Nombre',
            sku: form.sku || `SKU-${Date.now()}`,
            price,
            categoryId: catId,
            category: categoryName || 'Sin Categoría',
            description: form.description,
            stock: form.stock,
            unit: 'CLP' as const,
            images: [form.imageUrl || DEFAULT_IMAGE],
            specs: specsObj,
            fullSpecs: specsObj,
            isPublished: form.isPublished,
            rating: 0,
            reviews: 0,
        };

        if (isEditing && editProduct) {
            updateProduct(editProduct.id, productData);
        } else {
            addProduct(productData as Omit<Product, 'id'>);
        }

        setSaved(true);
        setTimeout(() => router.push('/admin'), 800);
    };

    const filledSpecs = form.specs.filter((s) => s.key.trim());

    // --- FORM SECTION ---
    const FormSection = (
        <div className="space-y-6">
            {/* Info General */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" /> Información General
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Nombre del Producto</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Ej: Saco Cemento Extra-Fuerte 25kg"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">SKU</label>
                        <input
                            type="text"
                            value={form.sku}
                            onChange={(e) => updateField('sku', e.target.value)}
                            placeholder="Se genera automáticamente si está vacío"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Precio CLP</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => updateField('price', e.target.value)}
                                    placeholder="8490"
                                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Categoría</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => updateField('categoryId', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {MOCK_CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Disponibilidad</label>
                            <select
                                value={form.stock}
                                onChange={(e) => updateField('stock', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                {STOCK_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer py-3">
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={(e) => updateField('isPublished', e.target.checked)}
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm font-semibold text-slate-600">Publicado</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Describe las características del producto..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Image */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-orange-500" /> Imagen del Producto
                    </h3>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">URL de la imagen</label>
                    <input
                        type="text"
                        value={form.imageUrl}
                        onChange={(e) => updateField('imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Pega la URL de una imagen. En el futuro se podrá subir directamente.</p>
                    {form.imageUrl && (
                        <div className="mt-4 aspect-video relative rounded-xl overflow-hidden bg-slate-100 border border-gray-200">
                            <Image src={form.imageUrl} alt="Preview" fill className="object-cover" sizes="400px" />
                        </div>
                    )}
                </div>
            </div>

            {/* Specs */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-orange-500" /> Especificaciones Técnicas
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        {form.specs.map((spec, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={spec.key}
                                    onChange={(e) => updateSpec(i, 'key', e.target.value)}
                                    placeholder="Propiedad"
                                    className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <input
                                    type="text"
                                    value={spec.value}
                                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                                    placeholder="Valor"
                                    className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <button
                                    onClick={() => removeSpec(i)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                                    disabled={form.specs.length <= 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addSpec}
                        className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Añadir otra especificación
                    </button>
                </div>
            </div>
        </div>
    );

    // --- DETAIL PREVIEW SECTION ---
    const PreviewSection = (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Previsualización
                </h3>
                <span className="text-xs font-semibold text-orange-600">Vista Detallada</span>
            </div>

            {/* Detail-style preview */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
                {/* Product Image */}
                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    {form.imageUrl ? (
                        <Image src={form.imageUrl} alt="Preview" fill className="object-cover" sizes="500px" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-300">
                            <Upload className="w-10 h-10" />
                        </div>
                    )}
                    {form.isPublished && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                            PUBLICADO
                        </div>
                    )}
                    {form.stock && (
                        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-lg shadow ${form.stock === 'EN STOCK' || form.stock === 'DISPONIBLE'
                                ? 'bg-emerald-500 text-white'
                                : form.stock === 'A PEDIDO'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-orange-500 text-white'
                            }`}>
                            {form.stock}
                        </div>
                    )}
                </div>

                <div className="p-5">
                    {/* SKU + Category */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">
                            SKU: {form.sku || 'AUTO'}
                        </span>
                        {categoryName && (
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                {categoryName}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug mb-3">
                        {form.title || 'Nombre del Producto'}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-orange-400 fill-current" />
                        ))}
                        <span className="text-xs text-slate-400 ml-1">(0 reseñas)</span>
                    </div>

                    {/* Price card */}
                    <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 mb-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600/5 rounded-full -mr-8 -mt-8" />
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                ${form.price ? formatPrice(Number(form.price)) : '0'}
                            </span>
                            <span className="text-sm font-semibold text-slate-400">Neto</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Info className="w-3 h-3" /> Valores sujetos a variación por volumen
                        </p>
                    </div>

                    {/* Quick specs grid */}
                    {filledSpecs.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {filledSpecs.slice(0, 4).map((s, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-2">
                                    <div className="bg-white p-1.5 rounded-md text-orange-500 shadow-sm">
                                        {QUICK_SPECS_ICONS[i % QUICK_SPECS_ICONS.length].icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">{s.key}</p>
                                        <p className="text-xs font-bold text-slate-800 truncate">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                        {form.description || 'La descripción del producto aparecerá aquí...'}
                    </p>

                    {/* Specs table */}
                    {filledSpecs.length > 0 && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
                            <div className="px-4 py-2 bg-slate-50 border-b border-gray-100">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ficha Técnica</p>
                            </div>
                            {filledSpecs.map((s, idx) => (
                                <div key={idx} className={`flex px-4 py-2.5 text-xs ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                                    <span className="w-28 font-semibold text-slate-400 flex-shrink-0 truncate">{s.key}</span>
                                    <span className="font-semibold text-slate-800 truncate">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA */}
                    <button className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                        Solicitar Cotización <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Design tip */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Consejo
                </p>
                <p className="text-xs text-orange-600 mt-1">
                    Usa fotos de alta resolución con fondo blanco para que el producto resalte en el catálogo.
                </p>
            </div>
        </div>
    );

    // --- SAVED TOAST ---
    if (saved) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Save className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {isEditing ? 'Producto Actualizado' : 'Producto Creado'}
                    </h2>
                    <p className="text-sm text-slate-500">Redirigiendo al panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <nav className="text-sm text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                        <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/admin')}>
                            Admin
                        </span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-700 font-semibold">
                            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                        </span>
                    </nav>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin')}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 transition-colors"
                    >
                        Descartar
                    </button>
                    {/* Desktop save button */}
                    <button
                        onClick={handleSave}
                        className="hidden lg:flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-sm active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        {isEditing ? 'Guardar Cambios' : 'Guardar Producto'}
                    </button>
                </div>
            </div>

            {/* Desktop: split panel */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-8">
                <div className="col-span-3">{FormSection}</div>
                <div className="col-span-2">
                    <div className="sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">
                        {PreviewSection}
                    </div>
                </div>
            </div>

            {/* Mobile: step wizard */}
            <div className="lg:hidden">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setMobileStep('form')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold text-center transition-all ${mobileStep === 'form' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        1. Información
                    </button>
                    <button
                        onClick={() => setMobileStep('preview')}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold text-center transition-all ${mobileStep === 'preview' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        2. Previsualización
                    </button>
                </div>

                {mobileStep === 'form' ? (
                    <>
                        {FormSection}
                        <button
                            onClick={() => setMobileStep('preview')}
                            className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 rounded-xl text-sm"
                        >
                            Siguiente: Ver Previsualización <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        {PreviewSection}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Guardar Cambios' : 'Guardar Producto'}
                            </button>
                            <button
                                onClick={() => setMobileStep('form')}
                                className="w-full flex items-center justify-center gap-2 text-slate-600 font-semibold py-3 rounded-xl text-sm border border-gray-200 hover:bg-slate-50"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver a Editar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
