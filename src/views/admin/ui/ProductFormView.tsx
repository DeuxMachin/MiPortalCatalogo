
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    ChevronDown,
    RotateCcw,
    Clock,
    Trophy,
    ShieldCheck,
    Droplets,
    Info,
    Palette,
    Ruler,
    Package,
    Weight,
    Layers,
    Maximize2,
    X,
} from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import type { Product } from '@/src/entities/product/model/types';
import type { StockStatus } from '@/src/shared/types/common';
import { formatPrice } from '@/src/shared/lib/formatters';

interface ProductFormViewProps {
    editProduct?: Product;
}

interface ResourceInput {
    label: string;
    url: string;
}

interface FormData {
    title: string;
    sku: string;
    price: string;
    categoryId: string;
    description: string;
    stock: StockStatus;
    images: Array<{ url: string; file: File | null; crop: { zoom: number; offsetX: number; offsetY: number } }>;
    isPublished: boolean;
    precioVisible: boolean;
    specs: { key: string; value: string }[];
    /* Ficha Técnica (all optional) */
    color: string;
    material: string;
    contenido: string;
    unidadMedida: string;
    presentacion: string;
    pesoKg: string;
    altoMm: string;
    anchoMm: string;
    largoMm: string;
    quickSpecs: { label: string; value: string }[];
    notaTecnica: string;
    recursos: ResourceInput[];
}

const UNIT_OPTIONS = ['ml', 'lt', 'gl', 'kg', 'g', 'mt', 'mm', 'cm', 'un', 'rollo', 'caja', 'CC', 'Galones','Bolsas','Rollo','gr/m2'] as const;

const STOCK_OPTIONS: StockStatus[] = ['EN STOCK', 'SIN STOCK', 'A PEDIDO'];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600';

const QUICK_SPECS_DEFAULTS = [{ label: '', value: '' }];

const QUICK_SPECS_ICONS = [
    { icon: <Clock className="w-4 h-4" />, label: 'Resistencia' },
    { icon: <Trophy className="w-4 h-4" />, label: 'Normativa' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Protección' },
    { icon: <Droplets className="w-4 h-4" />, label: 'Propiedad' },
];

function buildQuickSpecs(product?: Product) {
    if (!product?.quickSpecs?.length) return QUICK_SPECS_DEFAULTS;
    return product.quickSpecs.map((s) => ({ label: s.label ?? '', value: s.value ?? '' }));
}

function buildFormData(product?: Product): FormData {
    if (product) {
        const initialUrls = (product.images ?? []).slice(0, 4);
        const images = Array.from({ length: 4 }).map((_, idx) => ({
            url: initialUrls[idx] ?? '',
            file: null,
            crop: { zoom: 1, offsetX: 0, offsetY: 0 },
        }));

        return {
            title: product.title,
            sku: product.sku,
            price: String(product.price),
            categoryId: String(product.categoryId),
            description: product.description,
            stock: product.stock,
            images,
            isPublished: product.isPublished,
            precioVisible: product.precioVisible ?? true,
            specs: Object.entries(product.fullSpecs ?? product.specs).map(([key, value]) => ({ key, value })),
            color: product.color ?? '',
            material: product.material ?? '',
            contenido: product.contenido ?? '',
            unidadMedida: product.unidadMedida ?? '',
            presentacion: product.presentacion ?? '',
            pesoKg: product.pesoKg != null ? String(product.pesoKg) : '',
            altoMm: product.altoMm != null ? String(product.altoMm) : '',
            anchoMm: product.anchoMm != null ? String(product.anchoMm) : '',
            largoMm: product.largoMm != null ? String(product.largoMm) : '',
            quickSpecs: buildQuickSpecs(product),
            notaTecnica: product.notaTecnica ?? '',
            recursos: product.recursos && product.recursos.length > 0
                ? product.recursos.map((r) => ({ label: r.label, url: r.url }))
                : [{ label: '', url: '' }],
        };
    }
    return {
        title: '',
        sku: '',
        price: '',
        categoryId: '',
        description: '',
        stock: 'EN STOCK',
        images: [
            { url: DEFAULT_IMAGE, file: null, crop: { zoom: 1, offsetX: 0, offsetY: 0 } },
            { url: '', file: null, crop: { zoom: 1, offsetX: 0, offsetY: 0 } },
            { url: '', file: null, crop: { zoom: 1, offsetX: 0, offsetY: 0 } },
            { url: '', file: null, crop: { zoom: 1, offsetX: 0, offsetY: 0 } },
        ],
        isPublished: true,
        precioVisible: true,
        specs: [{ key: '', value: '' }],
        color: '',
        material: '',
        contenido: '',
        unidadMedida: '',
        presentacion: '',
        pesoKg: '',
        altoMm: '',
        anchoMm: '',
        largoMm: '',
        quickSpecs: QUICK_SPECS_DEFAULTS,
        notaTecnica: '',
        recursos: [{ label: '', url: '' }],
    };
}

export default function ProductFormView({ editProduct }: ProductFormViewProps) {
    const router = useRouter();
    const { addProduct, updateProduct, setProductImages } = useProducts();
    const isEditing = !!editProduct;

    const [form, setForm] = useState<FormData>(() => buildFormData(editProduct));
    const [mobileStep, setMobileStep] = useState<'form' | 'preview'>('form');
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeImageSlot, setActiveImageSlot] = useState(0);
    const [activePreviewImageIdx, setActivePreviewImageIdx] = useState(0);
    const [specsOpen, setSpecsOpen] = useState(false);
    const [editorImageExpanded, setEditorImageExpanded] = useState(false);

    const { categories } = useCategories();
    const categoryName = categories.find((c) => c.id === form.categoryId)?.nombre ?? '';

    const updateField = (field: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const [imagePreviews, setImagePreviews] = useState<string[]>(() =>
        (buildFormData(editProduct).images ?? []).map((s) => s.url || ''),
    );

    // Cleanup blob URLs
    useEffect(() => {
        return () => {
            imagePreviews.forEach((p) => {
                if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateImageUrl = (index: number, url: string) => {
        setForm((prev) => {
            const images = [...prev.images];
            images[index] = { ...images[index], url, file: null };
            return { ...prev, images };
        });
        setImagePreviews((prev) => {
            const next = [...prev];
            const old = next[index];
            if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
            next[index] = url;
            return next;
        });
    };

    const updateImageFile = (index: number, file: File | null) => {
        setForm((prev) => {
            const images = [...prev.images];
            const prevUrl = images[index]?.url ?? '';
            images[index] = { ...images[index], file, url: file ? '' : prevUrl };
            return { ...prev, images };
        });
        setImagePreviews((prev) => {
            const next = [...prev];
            const old = next[index];
            if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
            next[index] = file ? URL.createObjectURL(file) : '';
            return next;
        });
    };

    const updateImageCrop = (index: number, patch: Partial<FormData['images'][number]['crop']>) => {
        setForm((prev) => {
            const images = [...prev.images];
            const crop = images[index]?.crop ?? { zoom: 1, offsetX: 0, offsetY: 0 };
            images[index] = { ...images[index], crop: { ...crop, ...patch } };
            return { ...prev, images };
        });
    };

    const resetImageCrop = (index: number) => {
        updateImageCrop(index, { zoom: 1, offsetX: 0, offsetY: 0 });
    };

    const swapImages = (a: number, b: number) => {
        if (a === b) return;
        setForm((prev) => {
            const images = [...prev.images];
            [images[a], images[b]] = [images[b], images[a]];
            return { ...prev, images };
        });

        setImagePreviews((prev) => {
            const next = [...prev];
            [next[a], next[b]] = [next[b], next[a]];
            return next;
        });

        setActivePreviewImageIdx((idx) => {
            if (idx === a) return b;
            if (idx === b) return a;
            return idx;
        });
    };

    const moveImage = (index: number, direction: -1 | 1) => {
        const next = index + direction;
        if (next < 0 || next > 3) return;
        swapImages(index, next);
        setActivePreviewImageIdx(next);
    };

    const clearImageSlot = (index: number) => {
        setForm((prev) => {
            const images = [...prev.images];
            images[index] = { url: '', file: null, crop: { zoom: 1, offsetX: 0, offsetY: 0 } };
            return { ...prev, images };
        });

        setImagePreviews((prev) => {
            const next = [...prev];
            const old = next[index];
            if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
            next[index] = '';
            return next;
        });
    };

    const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
        setForm((prev) => {
            const specs = [...prev.specs];
            specs[index] = { ...specs[index], [field]: value };
            return { ...prev, specs };
        });
    };

    const updateQuickSpec = (index: number, field: 'label' | 'value', value: string) => {
        setForm((prev) => {
            const quickSpecs = [...prev.quickSpecs];
            quickSpecs[index] = { ...quickSpecs[index], [field]: value };
            return { ...prev, quickSpecs };
        });
    };

    const addQuickSpec = () => {
        setForm((prev) => ({ ...prev, quickSpecs: [...prev.quickSpecs, { label: '', value: '' }] }));
    };

    const removeQuickSpec = (index: number) => {
        setForm((prev) => ({
            ...prev,
            quickSpecs: prev.quickSpecs.filter((_, i) => i !== index),
        }));
    };

    const updateResource = (index: number, field: keyof ResourceInput, value: string) => {
        setForm((prev) => {
            const recursos = [...prev.recursos];
            recursos[index] = { ...recursos[index], [field]: value };
            return { ...prev, recursos };
        });
    };

    const addResource = () => {
        setForm((prev) => ({ ...prev, recursos: [...prev.recursos, { label: '', url: '' }] }));
    };

    const removeResource = (index: number) => {
        setForm((prev) => ({
            ...prev,
            recursos: prev.recursos.filter((_, i) => i !== index),
        }));
    };

    const addSpec = () => {
        setForm((prev) => ({ ...prev, specs: [...prev.specs, { key: '', value: '' }] }));
    };

    const removeSpec = (index: number) => {
        setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        setSaveError(null);
        if (saving) return;

        const catId = form.categoryId || '';
        if (!catId.trim()) {
            setSaveError('Selecciona una categoría antes de guardar.');
            return;
        }

        setSaving(true);
        const price = Number(form.price) || 0;
        const specsObj: Record<string, string> = {};
        form.specs.forEach((s) => {
            if (s.key.trim()) specsObj[s.key.trim()] = s.value.trim();
        });

        const quickSpecs = form.quickSpecs
            .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
            .filter((s) => s.label && s.value);

        const recursos = form.recursos
            .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
            .filter((r) => r.label && r.url);

        try {
            const baseData = {
                title: form.title || 'Producto Sin Nombre',
                sku: form.sku || `SKU-${Date.now()}`,
                price,
                categoryId: catId,
                category: categoryName || 'Sin Categoría',
                description: form.description,
                stock: form.stock,
                unit: 'CLP',
                specs: specsObj,
                fullSpecs: specsObj,
                isPublished: form.isPublished,
                precioVisible: form.precioVisible,
                quickSpecs,
                notaTecnica: form.notaTecnica,
                recursos,
                /* Ficha Técnica */
                ...(form.color && { color: form.color }),
                ...(form.material && { material: form.material }),
                ...(form.contenido && { contenido: form.contenido }),
                ...(form.unidadMedida && { unidadMedida: form.unidadMedida }),
                ...(form.presentacion && { presentacion: form.presentacion }),
                ...(form.pesoKg && { pesoKg: Number(form.pesoKg) }),
                ...(form.altoMm && { altoMm: Number(form.altoMm) }),
                ...(form.anchoMm && { anchoMm: Number(form.anchoMm) }),
                ...(form.largoMm && { largoMm: Number(form.largoMm) }),
            };

            const imageInputs = form.images
                .map((s) => {
                    const source = s.file ?? s.url?.trim();
                    if (!source) return null;
                    return {
                        source,
                        crop: {
                            zoom: s.crop.zoom,
                            offsetX: s.crop.offsetX,
                            offsetY: s.crop.offsetY,
                        },
                    };
                })
                .filter((v) => !!v) as Array<{ source: File | string; crop: { zoom: number; offsetX: number; offsetY: number } }>;

            const originalUrls = (editProduct?.images ?? []).slice(0, 4);
            const currentUrls = form.images.map((s) => s.file ? '__file__' : (s.url?.trim() ?? '')).slice(0, 4);
            const imagesChanged = form.images.some((s) => !!s.file) ||
                currentUrls.some((u, idx) => u !== (originalUrls[idx] ?? ''));

            const result = isEditing && editProduct
                ? await updateProduct(editProduct.id, baseData)
                : await addProduct({ ...baseData, images: [] }, imageInputs);

            if (result.success && isEditing && editProduct && imagesChanged) {
                const imgRes = await setProductImages(editProduct.id, imageInputs);
                if (!imgRes.success) {
                    setSaveError(imgRes.error ?? 'No se pudieron guardar las imágenes.');
                    return;
                }
            }

            if (result.success) {
                setSaved(true);
                router.push(isEditing ? '/admin?toast=updated' : '/admin?toast=created');
                return;
            }

            setSaveError(result.error ?? 'No se pudo guardar el producto.');
        } catch (err) {
            console.error('[ProductForm] Save error:', err);
            setSaveError('Ocurrió un error inesperado al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const filledSpecs = form.specs.filter((s) => s.key.trim());

    // --- FORM SECTION ---
    const FormSection = (
        <div className="space-y-8">
            {/* Info General */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-7 py-5 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-orange-500" /> Información General
                    </h3>
                </div>
                <div className="p-7 space-y-5">
                    <div>
                        <label className="block text-base font-semibold text-slate-600 mb-2">Nombre del Producto</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Ej: Saco Cemento Extra-Fuerte 25kg"
                            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-semibold text-slate-600 mb-2">SKU</label>
                        <input
                            type="text"
                            value={form.sku}
                            onChange={(e) => updateField('sku', e.target.value)}
                            placeholder="Se genera automáticamente si está vacío"
                            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-base font-semibold text-slate-600 mb-2">Precio CLP</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-400 font-semibold">$</span>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => updateField('price', e.target.value)}
                                    placeholder="8490"
                                    className="w-full pl-8 pr-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-slate-600 mb-2">Categoría</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => updateField('categoryId', e.target.value)}
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-base font-semibold text-slate-600 mb-2">Disponibilidad</label>
                            <select
                                value={form.stock}
                                onChange={(e) => updateField('stock', e.target.value)}
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                {STOCK_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-6">
                            <label className="flex items-center gap-3 cursor-pointer py-3">
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={(e) => updateField('isPublished', e.target.checked)}
                                    className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-base font-semibold text-slate-600">Publicado</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer py-3">
                                <input
                                    type="checkbox"
                                    checked={form.precioVisible}
                                    onChange={(e) => updateField('precioVisible', e.target.checked)}
                                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-base font-semibold text-slate-600">Precio visible</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-semibold text-slate-600 mb-2">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Describe las características del producto..."
                            rows={5}
                            className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-7 py-5 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
                        <Upload className="w-5 h-5 text-orange-500" /> Imágenes del Producto
                        <span className="text-sm font-normal text-slate-400">(hasta 4 fotos)</span>
                    </h3>
                </div>
                <div className="p-7 space-y-5">
                    {(() => {
                        const slot = form.images[activeImageSlot];
                        const hasContent = !!(slot.url || slot.file);
                        const isPrincipal = activeImageSlot === 0;

                        return (
                            <>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveImageSlot((prev) => (prev === 0 ? 3 : prev - 1))}
                                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            title="Imagen anterior"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-base font-bold text-slate-800">
                                            {isPrincipal ? '🌟 Imagen principal' : `📸 Imagen ${activeImageSlot + 1}`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setActiveImageSlot((prev) => (prev === 3 ? 0 : prev + 1))}
                                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            title="Imagen siguiente"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {!isPrincipal && (
                                            <button
                                                type="button"
                                                onClick={() => { swapImages(activeImageSlot, 0); setActiveImageSlot(0); setActivePreviewImageIdx(0); }}
                                                title="Hacer principal"
                                                className="p-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                            >
                                                <Star className="w-4 h-4" />
                                            </button>
                                        )}
                                        {activeImageSlot > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => { moveImage(activeImageSlot, -1); setActiveImageSlot((v) => Math.max(0, v - 1)); }}
                                                title="Mover izquierda"
                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                        )}
                                        {activeImageSlot < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => { moveImage(activeImageSlot, 1); setActiveImageSlot((v) => Math.min(3, v + 1)); }}
                                                title="Mover derecha"
                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => resetImageCrop(activeImageSlot)}
                                            title="Restaurar encuadre"
                                            className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => clearImageSlot(activeImageSlot)}
                                            title="Eliminar imagen"
                                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
                                    <div className="space-y-3">
                                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-gray-200 relative">
                                            {hasContent ? (
                                                <img
                                                    src={imagePreviews[activeImageSlot] || DEFAULT_IMAGE}
                                                    alt={`Imagen ${activeImageSlot + 1}`}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    style={{
                                                        transform: `translate(${(slot.crop.offsetX * 18).toFixed(2)}%, ${(slot.crop.offsetY * 18).toFixed(2)}%) scale(${slot.crop.zoom})`,
                                                        transformOrigin: 'center',
                                                    }}
                                                    loading="lazy"
                                                    onDoubleClick={() => setEditorImageExpanded(true)}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                    <Upload className="w-8 h-8 mb-2" />
                                                    <span className="text-sm font-medium">Sin imagen</span>
                                                </div>
                                            )}

                                            {hasContent && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditorImageExpanded(true)}
                                                    className="absolute top-3 right-3 bg-black/55 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                                                    title="Expandir imagen"
                                                >
                                                    <Maximize2 className="w-3.5 h-3.5" /> Expandir
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-4 gap-3">
                                            {form.images.map((_, idx) => {
                                                const hasSlotContent = !!(form.images[idx].url || form.images[idx].file);
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setActiveImageSlot(idx)}
                                                        className={`aspect-square rounded-2xl overflow-hidden border-2 relative transition-all ${idx === activeImageSlot ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'}`}
                                                    >
                                                        {hasSlotContent ? (
                                                            <img
                                                                src={imagePreviews[idx] || DEFAULT_IMAGE}
                                                                alt={`Miniatura ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-slate-400 bg-slate-50">
                                                                {idx + 1}
                                                            </div>
                                                        )}
                                                        {idx === 0 && (
                                                            <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white">
                                                                P
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-5 border border-gray-200 rounded-2xl p-5 bg-slate-50/50">
                                        {hasContent ? (
                                            <>
                                                <div>
                                                    <label className="text-sm font-bold text-slate-600 mb-2 block">Ajustar encuadre</label>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-sm text-slate-600">Zoom</span>
                                                                <span className="text-xs font-bold text-orange-600">{slot.crop.zoom.toFixed(1)}x</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={1}
                                                                max={2.5}
                                                                step={0.1}
                                                                value={slot.crop.zoom}
                                                                onChange={(e) => updateImageCrop(activeImageSlot, { zoom: Number(e.target.value) })}
                                                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-xs text-slate-600">Horizontal</span>
                                                                    <span className="text-xs font-bold text-orange-600">{slot.crop.offsetX > 0 ? '→' : slot.crop.offsetX < 0 ? '←' : '•'}</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min={-1}
                                                                    max={1}
                                                                    step={0.1}
                                                                    value={slot.crop.offsetX}
                                                                    onChange={(e) => updateImageCrop(activeImageSlot, { offsetX: Number(e.target.value) })}
                                                                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <span className="text-xs text-slate-600">Vertical</span>
                                                                    <span className="text-xs font-bold text-orange-600">{slot.crop.offsetY > 0 ? '↓' : slot.crop.offsetY < 0 ? '↑' : '•'}</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min={-1}
                                                                    max={1}
                                                                    step={0.1}
                                                                    value={slot.crop.offsetY}
                                                                    onChange={(e) => updateImageCrop(activeImageSlot, { offsetY: Number(e.target.value) })}
                                                                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-gray-200">
                                                    <label className="text-sm font-bold text-slate-600 mb-2 block">Cambiar imagen</label>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <input
                                                            type="url"
                                                            value={slot.url}
                                                            onChange={(e) => updateImageUrl(activeImageSlot, e.target.value)}
                                                            placeholder="Pegar URL..."
                                                            className="px-3 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                        />
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => updateImageFile(activeImageSlot, e.target.files?.[0] ?? null)}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            <div className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-base text-slate-600 text-center font-medium pointer-events-none">
                                                                {slot.file ? slot.file.name.slice(0, 24) : 'Subir archivo'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <label className="text-sm font-bold text-slate-600 mb-2 block">Agregar imagen</label>
                                                <div className="space-y-3">
                                                    <input
                                                        type="url"
                                                        value={slot.url}
                                                        onChange={(e) => updateImageUrl(activeImageSlot, e.target.value)}
                                                        placeholder="Pegar URL de la imagen..."
                                                        className="w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => updateImageFile(activeImageSlot, e.target.files?.[0] ?? null)}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <div className="px-4 py-3.5 bg-orange-500 text-white rounded-xl text-base text-center font-bold pointer-events-none transition-colors">
                                                            Subir desde tu computadora
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {isPrincipal && (
                                            <p className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                                                Esta imagen se muestra en el catálogo.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {editorImageExpanded && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
                    onClick={() => setEditorImageExpanded(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="relative max-w-6xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setEditorImageExpanded(false)}
                            className="absolute -top-11 right-0 text-white/90 hover:text-white flex items-center gap-2 text-sm font-semibold"
                        >
                            <X className="w-5 h-5" /> Cerrar
                        </button>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative w-full aspect-[16/10] bg-black">
                                <img
                                    src={imagePreviews[activeImageSlot] || DEFAULT_IMAGE}
                                    alt={`Imagen expandida ${activeImageSlot + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    loading="eager"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ficha Técnica (principal) */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-500" /> Ficha Técnica
                        <span className="text-xs font-normal text-slate-400">(puede estar vacía)</span>
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                        {/* Color + Material */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-slate-400" /> Color
                                </label>
                                <input
                                    type="text"
                                    value={form.color}
                                    onChange={(e) => updateField('color', e.target.value)}
                                    placeholder="Ej: Blanco, Transparente"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Material
                                </label>
                                <input
                                    type="text"
                                    value={form.material}
                                    onChange={(e) => updateField('material', e.target.value)}
                                    placeholder="Ej: Acrílico, Poliuretano"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Contenido + Unidad */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Contenido</label>
                                <input
                                    type="text"
                                    value={form.contenido}
                                    onChange={(e) => updateField('contenido', e.target.value)}
                                    placeholder="Ej: 300, 25, 1/4"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Unidad</label>
                                <select
                                    value={form.unidadMedida}
                                    onChange={(e) => updateField('unidadMedida', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="">—</option>
                                    {UNIT_OPTIONS.map((u) => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-slate-400" /> Presentación
                                </label>
                                <input
                                    type="text"
                                    value={form.presentacion}
                                    onChange={(e) => updateField('presentacion', e.target.value)}
                                    placeholder="Ej: Caja 12x1/4gl"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Peso + Dimensiones */}
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Ruler className="w-3.5 h-3.5" /> Dimensiones y Peso
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Peso (kg)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.pesoKg}
                                            onChange={(e) => updateField('pesoKg', e.target.value)}
                                            placeholder="0.5"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <Weight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Alto (mm)</label>
                                    <input
                                        type="number"
                                        value={form.altoMm}
                                        onChange={(e) => updateField('altoMm', e.target.value)}
                                        placeholder="200"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Ancho (mm)</label>
                                    <input
                                        type="number"
                                        value={form.anchoMm}
                                        onChange={(e) => updateField('anchoMm', e.target.value)}
                                        placeholder="50"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Largo (mm)</label>
                                    <input
                                        type="number"
                                        value={form.largoMm}
                                        onChange={(e) => updateField('largoMm', e.target.value)}
                                        placeholder="300"
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {/* Especificaciones Técnicas (opcional) */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                    type="button"
                    onClick={() => setSpecsOpen((v) => !v)}
                    className="w-full px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between"
                >
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-orange-500" /> Especificaciones Técnicas
                        <span className="text-xs font-normal text-slate-400">(opcional)</span>
                    </h3>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${specsOpen ? 'rotate-180' : ''}`} />
                </button>
                {specsOpen && (
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
                )}
            </div>

            {/* Detalle avanzado */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Info className="w-4 h-4 text-orange-500" /> Detalle Avanzado
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    {/* Quick specs */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen rápido</p>
                            <button
                                type="button"
                                onClick={addQuickSpec}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                            >
                                + Añadir
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.quickSpecs.map((spec, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={spec.label}
                                        onChange={(e) => updateQuickSpec(i, 'label', e.target.value)}
                                        placeholder="Etiqueta (ej: Resistencia)"
                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={spec.value}
                                        onChange={(e) => updateQuickSpec(i, 'value', e.target.value)}
                                        placeholder="Valor (ej: Alta / Industrial)"
                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeQuickSpec(i)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        disabled={form.quickSpecs.length <= 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Nota técnica */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Nota Técnica</label>
                        <textarea
                            value={form.notaTecnica}
                            onChange={(e) => updateField('notaTecnica', e.target.value)}
                            placeholder="Ej: Este material presenta el mejor balance costo-beneficio..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Recursos descargables */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos descargables</p>
                            <button
                                type="button"
                                onClick={addResource}
                                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                            >
                                + Añadir recurso
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.recursos.map((res, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                                    <input
                                        type="text"
                                        value={res.label}
                                        onChange={(e) => updateResource(i, 'label', e.target.value)}
                                        placeholder="Nombre del recurso"
                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <input
                                        type="url"
                                        value={res.url}
                                        onChange={(e) => updateResource(i, 'url', e.target.value)}
                                        placeholder="https://..."
                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeResource(i)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                        disabled={form.recursos.length <= 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const previewImages = imagePreviews.filter(Boolean).slice(0, 4);

    // --- DETAIL PREVIEW SECTION ---
    const PreviewSection = (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Previsualización
                </h3>
                <span className="text-xs font-semibold text-orange-600">Vista de producto</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md space-y-6">
                <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                    <span>Catálogo</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-600">{categoryName || 'Categoría'}</span>
                </div>

                <div className="aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden relative">
                    {previewImages.length > 0 ? (
                        <img
                            src={imagePreviews[activePreviewImageIdx] || previewImages[0]}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                transform: `translate(${((form.images[activePreviewImageIdx]?.crop.offsetX ?? 0) * 18).toFixed(2)}%, ${((form.images[activePreviewImageIdx]?.crop.offsetY ?? 0) * 18).toFixed(2)}%) scale(${form.images[activePreviewImageIdx]?.crop.zoom ?? 1})`,
                                transformOrigin: 'center',
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-300">
                            <Upload className="w-10 h-10" />
                        </div>
                    )}
                    {form.stock && (
                        <div className={`absolute top-3 left-3 text-sm font-bold px-3 py-1.5 rounded-lg shadow ${form.stock === 'EN STOCK'
                            ? 'bg-emerald-500 text-white'
                            : form.stock === 'A PEDIDO'
                                ? 'bg-blue-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                            {form.stock}
                        </div>
                    )}
                </div>

                {previewImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                        {previewImages.map((img, idx) => (
                            <button
                                key={`${img}-${idx}`}
                                type="button"
                                onClick={() => setActivePreviewImageIdx(idx)}
                                className={`aspect-square rounded-xl overflow-hidden border-2 ${idx === activePreviewImageIdx ? 'border-orange-500' : 'border-slate-200'}`}
                            >
                                <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-400">SKU: {form.sku || 'AUTO'}</span>
                        <span className={`text-sm font-semibold px-2.5 py-1 rounded-md ${form.isPublished ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                            {form.isPublished ? 'Activo' : 'Deshabilitado'}
                        </span>
                    </div>

                    <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
                        {form.title || 'Nombre del Producto'}
                    </h3>

                    {form.precioVisible ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-600/5 rounded-full -mr-10 -mt-10" />
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    ${form.price ? formatPrice(Number(form.price)) : '0'}
                                </span>
                                <span className="text-base font-semibold text-slate-400">Neto</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" /> Valores sujetos a variación por volumen
                            </p>
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
                            <p className="text-base font-bold text-orange-700">Precio bajo consulta</p>
                        </div>
                    )}

                    {form.quickSpecs.some((s) => s.value.trim()) && (
                        <div className="grid grid-cols-2 gap-3">
                            {form.quickSpecs.filter((s) => s.value.trim()).slice(0, 4).map((s, i) => (
                                <div key={`${s.label}-${i}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-2.5">
                                    <div className="bg-white p-2 rounded-md text-orange-500 shadow-sm">
                                        {QUICK_SPECS_ICONS[i % QUICK_SPECS_ICONS.length].icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate">{s.label}</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-base text-slate-500 leading-relaxed line-clamp-3">
                        {form.description || 'La descripción del producto aparecerá aquí...'}
                    </p>

                    {(() => {
                        const rows: { key: string; value: string }[] = [];
                        if (form.color) rows.push({ key: 'Color', value: form.color });
                        if (form.material) rows.push({ key: 'Material', value: form.material });
                        if (form.contenido) rows.push({ key: 'Contenido', value: `${form.contenido}${form.unidadMedida ? ' ' + form.unidadMedida : ''}` });
                        if (form.presentacion) rows.push({ key: 'Presentación', value: form.presentacion });
                        if (form.pesoKg) rows.push({ key: 'Peso', value: `${form.pesoKg} kg` });
                        const dims = [form.altoMm && `${form.altoMm}mm`, form.anchoMm && `${form.anchoMm}mm`, form.largoMm && `${form.largoMm}mm`].filter(Boolean).join(' × ');
                        if (dims) rows.push({ key: 'Dimensiones', value: dims });
                        filledSpecs.forEach((s) => rows.push(s));

                        if (rows.length === 0) return null;

                        return (
                            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-gray-200">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ficha técnica</p>
                                </div>
                                {rows.map((s, idx) => (
                                    <div key={`${s.key}-${idx}`} className={`flex px-4 py-3 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                                        <span className="w-32 font-semibold text-slate-400 flex-shrink-0 truncate">{s.key}</span>
                                        <span className="font-semibold text-slate-800 truncate">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <button className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base">
                        Solicitar Cotización <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
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
        <div className="max-w-[1450px] mx-auto">
            {/* Sticky Header */}
            <div className="sticky top-2 z-30 mb-7 bg-slate-50/95 backdrop-blur border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                        <nav className="text-base text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/admin')}>
                                Admin
                            </span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-700 font-semibold">
                                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                            </span>
                        </nav>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-5 py-3 rounded-xl text-base font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-base active:scale-95 inline-flex"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Producto')}
                        </button>
                    </div>
                </div>
            </div>

            {saveError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3.5 text-base font-semibold">
                    {saveError}
                </div>
            )}

            {/* Desktop: split panel */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-10">
                <div className="col-span-7">{FormSection}</div>
                <div className="col-span-5">
                    <div className="sticky top-10 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">
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
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Producto')}
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
