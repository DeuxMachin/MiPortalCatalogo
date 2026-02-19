
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
    ChevronRight,
    RotateCcw,
    Info,
    Package,
    Maximize2,
    X,
} from 'lucide-react';
import { useProducts } from '@/src/features/product-management';
import { useCategories } from '@/src/features/category-management';
import type { Product } from '@/src/entities/product/model/types';
import type { StockStatus } from '@/src/shared/types/common';
import { formatPrice } from '@/src/shared/lib/formatters';

/* ─── Types ─── */

interface ProductFormViewProps {
    editProduct?: Product;
}

interface ResourceInput {
    label: string;
    url: string;
}

interface VariantInput {
    id: string;
    sku: string;
    price: string;
    stock: StockStatus;
    presentacion: string;
    medida: string;
    color: string;
    material: string;
    pesoKg: string;
    altoMm: string;
    anchoMm: string;
    largoMm: string;
    description: string;
    isActive: boolean;
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
    variants: VariantInput[];
}

/* ─── Constants ─── */

const STOCK_OPTIONS: StockStatus[] = ['EN STOCK', 'BAJO STOCK', 'SIN STOCK', 'A PEDIDO'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=600';
const QUICK_SPECS_DEFAULTS = [{ label: '', value: '' }];
const CUSTOM_OPTION = '__custom__';
const MEDIDA_UNITS = ['mm', 'cm', 'm', 'kg', 'g', 'lt', 'ml', 'und'];
const FORMATO_OPTIONS = ['Bolsa', 'Bidón', 'Caja', 'Saco', 'Rollo', 'Unidad'];
const COLOR_OPTIONS = ['Negro', 'Blanco', 'Gris', 'Rojo', 'Azul', 'Verde'];
const MATERIAL_OPTIONS = ['Plástico', 'Polietileno', 'Cementicio', 'Metal', 'PVC', 'Acrílico'];

const FORM_TABS = [
    { key: 'product' as const, label: 'Producto', icon: Package },
    { key: 'images' as const, label: 'Imágenes', icon: Upload },
];

/* ─── Helpers ─── */

function buildQuickSpecs(product?: Product) {
    if (!product?.quickSpecs?.length) return QUICK_SPECS_DEFAULTS;
    return product.quickSpecs.map((s) => ({ label: s.label ?? '', value: s.value ?? '' }));
}

function splitMedida(medida?: string) {
    const raw = (medida ?? '').trim();
    if (!raw) return { value: '', unit: '' };

    // Soporta entradas como: "9,5", "9.5", "9,6 mm", "9.6 mm x ml"
    const match = raw.match(/^(\d+(?:[\.,]\d+)*)\s*(.*)$/);
    if (!match || !match[1]) {
        // Si no hay número al inicio, tratamos todo como unidad para no contaminar el campo numérico.
        return { value: '', unit: raw.toLowerCase() };
    }

    // Normalizar: reemplazar comas por punto
    const normalizedValue = (match[1] ?? '').replace(/,/g, '.').trim();
    const unit = (match[2] ?? '').trim().toLowerCase();

    return {
        value: normalizedValue,
        unit: unit,
    };
}

function buildMedida(value: string, unit: string) {
    const cleanValue = value.trim();
    const cleanUnit = unit.trim().toLowerCase();
    if (!cleanValue && !cleanUnit) return '';
    if (!cleanUnit) return cleanValue;
    if (!cleanValue) return cleanUnit;
    return `${cleanValue} ${cleanUnit}`;
}

function splitPresentacion(presentacion?: string) {
    const raw = presentacion ?? '';
    if (!raw.trim()) return { type: '', detail: '', custom: '' };
    const normalizedBase = raw.trimStart();
    const normalized = normalizedBase.toLowerCase();
    const matchedType = FORMATO_OPTIONS.find((opt) => normalized.startsWith(opt.toLowerCase()));
    if (!matchedType) return { type: CUSTOM_OPTION, detail: '', custom: raw.trim() };

    const rest = normalizedBase.slice(matchedType.length);
    const detail = rest.replace(/^\s*[-:]?\s*/, '');
    return { type: matchedType, detail, custom: '' };
}

function buildPresentacion(type: string, detail: string, custom: string) {
    if (type === CUSTOM_OPTION) return custom.trim();
    const cleanType = type.trim();
    const cleanDetail = detail.replace(/^\s+/, '');
    if (!cleanType) return '';
    if (!cleanDetail.trim()) return cleanType;
    return `${cleanType} ${cleanDetail}`;
}

function getSelectValue(value: string, options: string[]) {
    const clean = value.trim();
    if (!clean) return '';
    const found = options.find((opt) => opt.toLowerCase() === clean.toLowerCase());
    return found ?? CUSTOM_OPTION;
}

function buildFormData(product?: Product): FormData {
    if (product) {
        const initialUrls = (product.images ?? []).slice(0, 4);
        const images = Array.from({ length: 4 }).map((_, idx) => ({
            url: initialUrls[idx] ?? '',
            file: null,
            crop: { zoom: 1, offsetX: 0, offsetY: 0 },
        }));

        const rawVariants = product.variants && product.variants.length > 0
            ? product.variants
            : [{
                id: `variant-${product.id}`,
                sku: product.sku,
                price: product.price,
                stock: product.stock,
                presentacion: product.presentacion,
                medida: product.contenido,
                isActive: true,
            }];

        const variants = rawVariants.map((variant, index) => ({
            id: variant.id ?? `variant-${product.id}-${index}`,
            sku: variant.sku ?? '',
            price: String(variant.price ?? 0),
            stock: variant.stock ?? 'EN STOCK',
            presentacion: variant.presentacion ?? '',
            medida: variant.medida ?? ('contenido' in variant ? (variant.contenido ?? '') : ''),
            color: 'color' in variant ? (variant.color ?? product.color ?? '') : (product.color ?? ''),
            material: 'material' in variant ? (variant.material ?? product.material ?? '') : (product.material ?? ''),
            pesoKg: 'pesoKg' in variant ? (variant.pesoKg != null ? String(variant.pesoKg) : (product.pesoKg != null ? String(product.pesoKg) : '')) : (product.pesoKg != null ? String(product.pesoKg) : ''),
            altoMm: 'altoMm' in variant ? (variant.altoMm != null ? String(variant.altoMm) : (product.altoMm != null ? String(product.altoMm) : '')) : (product.altoMm != null ? String(product.altoMm) : ''),
            anchoMm: 'anchoMm' in variant ? (variant.anchoMm != null ? String(variant.anchoMm) : (product.anchoMm != null ? String(product.anchoMm) : '')) : (product.anchoMm != null ? String(product.anchoMm) : ''),
            largoMm: 'largoMm' in variant ? (variant.largoMm != null ? String(variant.largoMm) : (product.largoMm != null ? String(product.largoMm) : '')) : (product.largoMm != null ? String(product.largoMm) : ''),
            description: product.description ?? '',
            isActive: variant.isActive ?? index === 0,
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
            variants,
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
        variants: [{
            id: `variant-${Date.now()}`,
            sku: '',
            price: '',
            stock: 'EN STOCK',
            presentacion: '',
            medida: '',
            color: '',
            material: '',
            pesoKg: '',
            altoMm: '',
            anchoMm: '',
            largoMm: '',
            description: '',
            isActive: true,
        }],
    };
}

/* ─── Component ─── */

export default function ProductFormView({ editProduct }: ProductFormViewProps) {
    const router = useRouter();
    const { addProduct, updateProduct, setProductImages } = useProducts();
    const isEditing = !!editProduct;

    const [form, setForm] = useState<FormData>(() => buildFormData(editProduct));
    const [formTab, setFormTab] = useState<'product' | 'images'>('product');
    const [mobileStep, setMobileStep] = useState<'form' | 'preview'>('form');
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeVariantIndex, setActiveVariantIndex] = useState(0);
    const [previewVariantIndex, setPreviewVariantIndex] = useState(0);
    const [medidaUnitModeByVariant, setMedidaUnitModeByVariant] = useState<Record<string, string>>({});
    const [medidaUnitCustomByVariant, setMedidaUnitCustomByVariant] = useState<Record<string, string>>({});
    const [formatoModeByVariant, setFormatoModeByVariant] = useState<Record<string, string>>({});
    const [formatoCustomByVariant, setFormatoCustomByVariant] = useState<Record<string, string>>({});
    const [colorModeByVariant, setColorModeByVariant] = useState<Record<string, string>>({});
    const [materialModeByVariant, setMaterialModeByVariant] = useState<Record<string, string>>({});
    const [activeImageSlot, setActiveImageSlot] = useState(0);
    const [activePreviewImageIdx, setActivePreviewImageIdx] = useState(0);
    const [editorImageExpanded, setEditorImageExpanded] = useState(false);

    const { categories } = useCategories();
    const categoryName = categories.find((c) => c.id === form.categoryId)?.nombre ?? '';

    const updateField = (field: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const [imagePreviews, setImagePreviews] = useState<string[]>(() =>
        (buildFormData(editProduct).images ?? []).map((s) => s.url || ''),
    );

    useEffect(() => {
        return () => {
            imagePreviews.forEach((p) => {
                if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Image handlers ── */

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

    /* ── Spec / QuickSpec / Resource handlers ── */

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
        setForm((prev) => ({ ...prev, recursos: prev.recursos.filter((_, i) => i !== index) }));
    };

    /* ── Variant handlers ── */

    const updateVariantField = (index: number, field: keyof VariantInput, value: string | boolean) => {
        setForm((prev) => {
            const variants = [...prev.variants];
            const current = variants[index];
            if (!current) return prev;
            const updated = { ...current, [field]: value } as VariantInput;
            variants[index] = updated;

            const isCurrentPrimary = updated.isActive || variants.findIndex((v) => v.isActive) === index;
            if (!isCurrentPrimary) return { ...prev, variants };

            return {
                ...prev,
                variants,
                sku: field === 'sku' ? String(value) : prev.sku,
                price: field === 'price' ? String(value) : prev.price,
                stock: field === 'stock' ? (value as StockStatus) : prev.stock,
                presentacion: field === 'presentacion' ? String(value) : prev.presentacion,
                contenido: field === 'medida' ? String(value) : prev.contenido,
                color: field === 'color' ? String(value) : prev.color,
                material: field === 'material' ? String(value) : prev.material,
                pesoKg: field === 'pesoKg' ? String(value) : prev.pesoKg,
                altoMm: field === 'altoMm' ? String(value) : prev.altoMm,
                anchoMm: field === 'anchoMm' ? String(value) : prev.anchoMm,
                largoMm: field === 'largoMm' ? String(value) : prev.largoMm,
                description: field === 'description' ? String(value) : prev.description,
            };
        });
    };

    const setPrimaryVariant = (index: number) => {
        setForm((prev) => {
            const variants = prev.variants.map((v, i) => ({ ...v, isActive: i === index }));
            const primary = variants[index] ?? variants[0];
            if (!primary) return prev;
            return {
                ...prev,
                variants,
                sku: primary.sku,
                price: primary.price,
                stock: primary.stock,
                presentacion: primary.presentacion,
                contenido: primary.medida,
                color: primary.color,
                material: primary.material,
                pesoKg: primary.pesoKg,
                altoMm: primary.altoMm,
                anchoMm: primary.anchoMm,
                largoMm: primary.largoMm,
                description: primary.description,
            };
        });
    };

    const addVariant = () => {
        setForm((prev) => ({
            ...prev,
            variants: [
                ...prev.variants,
                {
                    id: `variant-${Date.now()}-${prev.variants.length + 1}`,
                    sku: '',
                    price: '',
                    stock: 'EN STOCK',
                    presentacion: '',
                    medida: '',
                    color: '',
                    material: '',
                    pesoKg: '',
                    altoMm: '',
                    anchoMm: '',
                    largoMm: '',
                    description: '',
                    isActive: false,
                },
            ],
        }));
        setActiveVariantIndex((prev) => prev + 1);
        setPreviewVariantIndex((prev) => prev + 1);
    };

    const removeVariant = (index: number) => {
        setForm((prev) => {
            if (prev.variants.length <= 1) return prev;
            const removedWasPrimary = prev.variants[index]?.isActive;
            const variants = prev.variants.filter((_, i) => i !== index);
            if (removedWasPrimary && variants[0]) variants[0] = { ...variants[0], isActive: true };
            const primary = variants.find((v) => v.isActive) ?? variants[0];
            return {
                ...prev,
                variants,
                sku: primary?.sku ?? prev.sku,
                price: primary?.price ?? prev.price,
                stock: primary?.stock ?? prev.stock,
                presentacion: primary?.presentacion ?? prev.presentacion,
                contenido: primary?.medida ?? prev.contenido,
                color: primary?.color ?? prev.color,
                material: primary?.material ?? prev.material,
                pesoKg: primary?.pesoKg ?? prev.pesoKg,
                altoMm: primary?.altoMm ?? prev.altoMm,
                anchoMm: primary?.anchoMm ?? prev.anchoMm,
                largoMm: primary?.largoMm ?? prev.largoMm,
                description: primary?.description ?? prev.description,
            };
        });
        setActiveVariantIndex((prev) => {
            if (prev > index) return prev - 1;
            if (prev === index) return Math.max(0, prev - 1);
            return prev;
        });
        setPreviewVariantIndex((prev) => {
            if (prev > index) return prev - 1;
            if (prev === index) return Math.max(0, prev - 1);
            return prev;
        });
    };

    const updateVariantMedidaParts = (index: number, value: string, unit: string) => {
        const medida = buildMedida(value, unit);
        updateVariantField(index, 'medida', medida);
    };

    const updateVariantPresentacionParts = (index: number, type: string, detail: string, custom: string) => {
        const presentacion = buildPresentacion(type, detail, custom);
        updateVariantField(index, 'presentacion', presentacion);
    };

    const updateVariantMedidaUnitMode = (variantId: string, mode: string) => {
        setMedidaUnitModeByVariant((prev) => ({ ...prev, [variantId]: mode }));
    };

    const updateVariantFormatoMode = (variantId: string, mode: string) => {
        setFormatoModeByVariant((prev) => ({ ...prev, [variantId]: mode }));
    };

    const updateVariantColorMode = (variantId: string, mode: string) => {
        setColorModeByVariant((prev) => ({ ...prev, [variantId]: mode }));
    };

    const updateVariantMaterialMode = (variantId: string, mode: string) => {
        setMaterialModeByVariant((prev) => ({ ...prev, [variantId]: mode }));
    };

    /* ── Save ── */

    const primaryVariant = form.variants.find((v) => v.isActive) ?? form.variants[0];
    const safeActiveVariantIndex = Math.min(activeVariantIndex, Math.max(0, form.variants.length - 1));
    const safePreviewVariantIndex = Math.min(previewVariantIndex, Math.max(0, form.variants.length - 1));
    const activeVariant = form.variants[safeActiveVariantIndex] ?? form.variants[0];
    const previewVariant = form.variants[safePreviewVariantIndex] ?? primaryVariant;
    const previewSku = previewVariant?.sku || form.sku;
    const previewPrice = Number(previewVariant?.price || form.price || 0);
    const previewStock = previewVariant?.stock || form.stock;
    const filledSpecs = form.specs.filter((s) => s.key.trim());
    const hasImages = imagePreviews.some((p) => !!p);

    const handleSave = async () => {
        setSaveError(null);
        if (saving) return;

        const catId = form.categoryId || '';
        if (!catId.trim()) {
            setSaveError('Selecciona una categoría antes de guardar.');
            return;
        }

        const overLimitVariant = form.variants.find((v) => {
            const wc = v.description.trim() ? v.description.trim().split(/\s+/).length : 0;
            return wc > 500;
        });
        if (overLimitVariant) {
            setSaveError('La descripción de uno o más formatos excede las 500 palabras. Reduce el texto antes de guardar.');
            return;
        }

        setSaving(true);
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

        const variantsPayload = form.variants.map((variant, index) => ({
            id: variant.id,
            sku: variant.sku.trim() || `SKU-${Date.now()}-${index + 1}`,
            price: Number(variant.price) || 0,
            unit: 'CLP',
            stock: variant.stock,
            medida: variant.medida || undefined,
            presentacion: variant.presentacion || undefined,
            altoMm: variant.altoMm ? Number(variant.altoMm) : undefined,
            anchoMm: variant.anchoMm ? Number(variant.anchoMm) : undefined,
            largoMm: variant.largoMm ? Number(variant.largoMm) : undefined,
            pesoKg: variant.pesoKg ? Number(variant.pesoKg) : undefined,
            material: variant.material || undefined,
            color: variant.color || undefined,
            contenido: variant.medida || undefined,
            specs: specsObj,
            quickSpecs,
            isActive: variant.isActive || index === 0,
        }));

        const principalVariant = variantsPayload.find((v) => v.isActive) ?? variantsPayload[0];
        const principalVariantForm = form.variants.find((v) => v.isActive) ?? form.variants[0];
        if (!principalVariant) {
            setSaveError('Debes agregar al menos un formato.');
            setSaving(false);
            return;
        }

        try {
            const baseData = {
                title: form.title || 'Producto Sin Nombre',
                sku: principalVariant.sku,
                price: principalVariant.price,
                categoryId: catId,
                category: categoryName || 'Sin Categoría',
                description: principalVariantForm?.description || form.description,
                stock: principalVariant.stock,
                unit: 'CLP',
                specs: specsObj,
                fullSpecs: specsObj,
                isPublished: form.isPublished,
                precioVisible: form.precioVisible,
                quickSpecs,
                variants: variantsPayload,
                notaTecnica: form.notaTecnica,
                recursos,
                ...(principalVariant.color && { color: principalVariant.color }),
                ...(principalVariant.material && { material: principalVariant.material }),
                ...(principalVariant.contenido && { contenido: principalVariant.contenido }),
                ...(principalVariant.presentacion && { presentacion: principalVariant.presentacion }),
                ...(principalVariant.pesoKg && { pesoKg: Number(principalVariant.pesoKg) }),
                ...(principalVariant.altoMm && { altoMm: Number(principalVariant.altoMm) }),
                ...(principalVariant.anchoMm && { anchoMm: Number(principalVariant.anchoMm) }),
                ...(principalVariant.largoMm && { largoMm: Number(principalVariant.largoMm) }),
            };

            const imageInputs = form.images
                .map((s) => {
                    const source = s.file ?? s.url?.trim();
                    if (!source) return null;
                    return { source, crop: { zoom: s.crop.zoom, offsetX: s.crop.offsetX, offsetY: s.crop.offsetY } };
                })
                .filter((v) => !!v) as Array<{ source: File | string; crop: { zoom: number; offsetX: number; offsetY: number } }>;

            const originalUrls = (editProduct?.images ?? []).slice(0, 4);
            const currentUrls = form.images.map((s) => s.file ? '__file__' : (s.url?.trim() ?? '')).slice(0, 4);
            const imagesChanged = form.images.some((s) => !!s.file) || currentUrls.some((u, idx) => u !== (originalUrls[idx] ?? ''));

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
                router.push(isEditing ? '/admin/products?toast=updated' : '/admin/products?toast=created');
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

    /* ═══════════════════════════════════════════════
       FORM SECTION — tabbed card
       ═══════════════════════════════════════════════ */

    const imgSlot = form.images[activeImageSlot];
    const imgSlotHasContent = !!(imgSlot?.url || imgSlot?.file);

    const FormSection = (
        <div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Gradient accent */}
                <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

                {/* Tab navigation */}
                <div className="px-3 sm:px-6 pt-3 flex gap-1 overflow-x-auto">
                    {FORM_TABS.map(({ key, label, icon: Icon }) => {
                        const isActive = formTab === key;
                        const hasDot = key === 'images' && hasImages;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setFormTab(key)}
                                className={`relative flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${isActive
                                    ? 'text-orange-600 border-orange-500 bg-orange-50/50'
                                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                {hasDot && !isActive && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-gray-100" />

                {/* ────── PRODUCTO TAB ────── */}
                {formTab === 'product' && (
                    <div className="p-5 sm:p-7 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Nombre del producto</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ej: Separador cono"
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-300"
                            />
                            <p className="text-xs text-slate-400 mt-1.5">Solo el nombre base. El resto se define en cada formato.</p>
                        </div>

                        {/* Category + Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">Categoría</label>
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => updateField('categoryId', e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1.5">Ejemplos: Separadores, Membranas, Morteros, Adhesivos.</p>
                            </div>
                            <div className="flex items-center gap-5 pb-1">
                                {/* Toggle: Publicado */}
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.isPublished}
                                        onClick={() => updateField('isPublished', !form.isPublished)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-orange-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-slate-600">Publicado</span>
                                </label>
                                {/* Toggle: Precio visible */}
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.precioVisible}
                                        onClick={() => updateField('precioVisible', !form.precioVisible)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${form.precioVisible ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.precioVisible ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-slate-600">Precio visible</span>
                                </label>
                            </div>
                        </div>

                        {/* Formatos */}
                        <div className="border-t border-gray-100 pt-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Formatos del producto</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Cada formato tiene sus propios datos (medida, color, material, dimensiones y descripción).</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Ejemplo: Formato = Bolsa. Medida = 20 mm, 25 mm, 9.6 mm x ml.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Agregar
                                </button>
                            </div>

                            {activeVariant && (
                                <div className="space-y-3">
                                    {(() => {
                                        const medidaParts = splitMedida(activeVariant.medida);
                                        const medidaUnitSelectDerived = MEDIDA_UNITS.includes(medidaParts.unit) ? medidaParts.unit : (medidaParts.unit ? CUSTOM_OPTION : '');
                                        const medidaUnitSelect = medidaUnitModeByVariant[activeVariant.id] ?? medidaUnitSelectDerived;
                                        const medidaUnitCustom = medidaUnitCustomByVariant[activeVariant.id] ?? (medidaUnitSelect === CUSTOM_OPTION ? medidaParts.unit : '');

                                        const presentacionParts = splitPresentacion(activeVariant.presentacion);
                                        const presentacionType = formatoModeByVariant[activeVariant.id] ?? presentacionParts.type;
                                        const presentacionDetail = presentacionParts.detail;
                                        const presentacionCustom = formatoCustomByVariant[activeVariant.id] ?? presentacionParts.custom;

                                        const colorSelect = colorModeByVariant[activeVariant.id] ?? getSelectValue(activeVariant.color, COLOR_OPTIONS);
                                        const colorCustom = colorSelect === CUSTOM_OPTION ? activeVariant.color : '';

                                        const materialSelect = materialModeByVariant[activeVariant.id] ?? getSelectValue(activeVariant.material, MATERIAL_OPTIONS);
                                        const materialCustom = materialSelect === CUSTOM_OPTION ? activeVariant.material : '';

                                        return (
                                            <>
                                                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-slate-50 px-3 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveVariantIndex((prev) => (prev <= 0 ? form.variants.length - 1 : prev - 1))}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:bg-white transition-colors"
                                                        >
                                                            <ArrowLeft className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-xs font-semibold text-slate-600">
                                                            Formato {safeActiveVariantIndex + 1} de {form.variants.length}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveVariantIndex((prev) => (prev >= form.variants.length - 1 ? 0 : prev + 1))}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:bg-white transition-colors"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {!activeVariant.isActive && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPrimaryVariant(safeActiveVariantIndex)}
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                                                            >
                                                                Hacer principal
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(safeActiveVariantIndex)}
                                                            disabled={form.variants.length <= 1}
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={`rounded-2xl border-2 p-4 sm:p-5 ${activeVariant.isActive ? 'border-orange-300 bg-orange-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
                                                    <div className="mb-3">
                                                        <span className={`text-xs font-bold uppercase tracking-wide ${activeVariant.isActive ? 'text-orange-600' : 'text-slate-500'}`}>
                                                            {activeVariant.isActive ? '★ Formato principal' : `Formato ${safeActiveVariantIndex + 1}`}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            <input
                                                                type="text"
                                                                value={activeVariant.sku}
                                                                onChange={(e) => updateVariantField(safeActiveVariantIndex, 'sku', e.target.value)}
                                                                placeholder="Ej: SEP-CONO-20-BLA"
                                                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                            />
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={activeVariant.price}
                                                                    onChange={(e) => updateVariantField(safeActiveVariantIndex, 'price', e.target.value)}
                                                                    placeholder="Ej: 1290"
                                                                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <select
                                                                value={activeVariant.stock}
                                                                onChange={(e) => updateVariantField(safeActiveVariantIndex, 'stock', e.target.value)}
                                                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                            >
                                                                {STOCK_OPTIONS.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <label className="block text-xs font-semibold text-slate-500">Formato</label>
                                                                <select
                                                                    value={presentacionType || ''}
                                                                    onChange={(e) => {
                                                                        const nextType = e.target.value;
                                                                        updateVariantFormatoMode(activeVariant.id, nextType);
                                                                        if (nextType === CUSTOM_OPTION) {
                                                                            setFormatoCustomByVariant((prev) => ({ ...prev, [activeVariant.id]: presentacionCustom }));
                                                                            updateVariantPresentacionParts(safeActiveVariantIndex, CUSTOM_OPTION, '', presentacionCustom);
                                                                        } else {
                                                                            updateVariantPresentacionParts(safeActiveVariantIndex, nextType, presentacionDetail, '');
                                                                        }
                                                                    }}
                                                                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                                >
                                                                    <option value="">Seleccionar formato...</option>
                                                                    {FORMATO_OPTIONS.map((option) => (
                                                                        <option key={option} value={option}>{option}</option>
                                                                    ))}
                                                                    <option value={CUSTOM_OPTION}>Agregar formato personalizado</option>
                                                                </select>
                                                                {presentacionType === CUSTOM_OPTION ? (
                                                                    <input
                                                                        type="text"
                                                                        value={presentacionCustom}
                                                                        onChange={(e) => {
                                                                            const customValue = e.target.value;
                                                                            setFormatoCustomByVariant((prev) => ({ ...prev, [activeVariant.id]: customValue }));
                                                                            updateVariantPresentacionParts(safeActiveVariantIndex, CUSTOM_OPTION, '', customValue);
                                                                        }}
                                                                        placeholder="Formato personalizado (ej: Cubeta)"
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={presentacionDetail}
                                                                        onChange={(e) => updateVariantPresentacionParts(safeActiveVariantIndex, presentacionType, e.target.value, '')}
                                                                        placeholder="Detalle formato (ej: 100 und / 25 kg)"
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                )}
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="block text-xs font-semibold text-slate-500">Medida</label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={medidaParts.value}
                                                                        onChange={(e) => {
                                                                            const inputValue = e.target.value;
                                                                            const normalizedInput = inputValue.replace(/,/g, '.').trimStart();

                                                                            // Si el usuario escribe "9.5 mm" o "9.5 mm x ml", parseamos automáticamente.
                                                                            const parsed = splitMedida(normalizedInput);
                                                                            if (parsed.unit) {
                                                                                const parsedUnit = parsed.unit;
                                                                                const isKnownUnit = MEDIDA_UNITS.includes(parsedUnit);

                                                                                if (isKnownUnit) {
                                                                                    updateVariantMedidaUnitMode(activeVariant.id, parsedUnit);
                                                                                } else {
                                                                                    updateVariantMedidaUnitMode(activeVariant.id, CUSTOM_OPTION);
                                                                                    setMedidaUnitCustomByVariant((prev) => ({ ...prev, [activeVariant.id]: parsedUnit }));
                                                                                }

                                                                                updateVariantMedidaParts(safeActiveVariantIndex, parsed.value, parsedUnit);
                                                                                return;
                                                                            }

                                                                            // Campo numérico estricto para evitar mezclar texto y unidad.
                                                                            const numericValue = normalizedInput.replace(/[^\d.]/g, '');
                                                                            updateVariantMedidaParts(
                                                                                safeActiveVariantIndex,
                                                                                numericValue,
                                                                                medidaUnitSelect === CUSTOM_OPTION ? medidaUnitCustom : medidaUnitSelect,
                                                                            );
                                                                        }}
                                                                        placeholder="Número (ej: 9,5 o 9.5 mm)"
                                                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                    <select
                                                                        value={medidaUnitSelect}
                                                                        onChange={(e) => {
                                                                            const nextUnitMode = e.target.value;
                                                                            updateVariantMedidaUnitMode(activeVariant.id, nextUnitMode);
                                                                            if (nextUnitMode === CUSTOM_OPTION) {
                                                                                updateVariantMedidaParts(safeActiveVariantIndex, medidaParts.value, medidaUnitCustom);
                                                                            } else {
                                                                                updateVariantMedidaParts(safeActiveVariantIndex, medidaParts.value, nextUnitMode);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                                    >
                                                                        <option value="">Unidad...</option>
                                                                        {MEDIDA_UNITS.map((unit) => (
                                                                            <option key={unit} value={unit}>{unit}</option>
                                                                        ))}
                                                                        <option value={CUSTOM_OPTION}>Agregar unidad personalizada</option>
                                                                    </select>
                                                                </div>
                                                                {medidaUnitSelect === CUSTOM_OPTION && (
                                                                    <input
                                                                        type="text"
                                                                        value={medidaUnitCustom}
                                                                        onChange={(e) => {
                                                                            const customUnit = e.target.value;
                                                                            setMedidaUnitCustomByVariant((prev) => ({ ...prev, [activeVariant.id]: customUnit }));
                                                                            updateVariantMedidaParts(safeActiveVariantIndex, medidaParts.value, customUnit);
                                                                        }}
                                                                        placeholder="Unidad personalizada (ej: mm x ml)"
                                                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Color</label>
                                                                <select
                                                                    value={colorSelect}
                                                                    onChange={(e) => {
                                                                        const nextColorMode = e.target.value;
                                                                        updateVariantColorMode(activeVariant.id, nextColorMode);
                                                                        if (nextColorMode !== CUSTOM_OPTION) {
                                                                            updateVariantField(safeActiveVariantIndex, 'color', nextColorMode);
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                                >
                                                                    <option value="">Color...</option>
                                                                    {COLOR_OPTIONS.map((option) => (
                                                                        <option key={option} value={option}>{option}</option>
                                                                    ))}
                                                                    <option value={CUSTOM_OPTION}>Color personalizado</option>
                                                                </select>
                                                                {colorSelect === CUSTOM_OPTION && (
                                                                    <input
                                                                        type="text"
                                                                        value={colorCustom}
                                                                        onChange={(e) => updateVariantField(safeActiveVariantIndex, 'color', e.target.value)}
                                                                        placeholder="Escribe color personalizado"
                                                                        className="w-full mt-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Material</label>
                                                                <select
                                                                    value={materialSelect}
                                                                    onChange={(e) => {
                                                                        const nextMaterialMode = e.target.value;
                                                                        updateVariantMaterialMode(activeVariant.id, nextMaterialMode);
                                                                        if (nextMaterialMode !== CUSTOM_OPTION) {
                                                                            updateVariantField(safeActiveVariantIndex, 'material', nextMaterialMode);
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                                >
                                                                    <option value="">Material...</option>
                                                                    {MATERIAL_OPTIONS.map((option) => (
                                                                        <option key={option} value={option}>{option}</option>
                                                                    ))}
                                                                    <option value={CUSTOM_OPTION}>Material personalizado</option>
                                                                </select>
                                                                {materialSelect === CUSTOM_OPTION && (
                                                                    <input
                                                                        type="text"
                                                                        value={materialCustom}
                                                                        onChange={(e) => updateVariantField(safeActiveVariantIndex, 'material', e.target.value)}
                                                                        placeholder="Escribe material personalizado"
                                                                        className="w-full mt-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Peso (kg)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={activeVariant.pesoKg}
                                                                    onChange={(e) => updateVariantField(safeActiveVariantIndex, 'pesoKg', e.target.value)}
                                                                    placeholder="Ej: 0.5"
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Alto (mm)</label>
                                                                <input
                                                                    type="number"
                                                                    value={activeVariant.altoMm}
                                                                    onChange={(e) => updateVariantField(safeActiveVariantIndex, 'altoMm', e.target.value)}
                                                                    placeholder="Ej: 200"
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Ancho (mm)</label>
                                                                <input
                                                                    type="number"
                                                                    value={activeVariant.anchoMm}
                                                                    onChange={(e) => updateVariantField(safeActiveVariantIndex, 'anchoMm', e.target.value)}
                                                                    placeholder="Ej: 50"
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Largo (mm)</label>
                                                                <input
                                                                    type="number"
                                                                    value={activeVariant.largoMm}
                                                                    onChange={(e) => updateVariantField(safeActiveVariantIndex, 'largoMm', e.target.value)}
                                                                    placeholder="Ej: 300"
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-600 mb-2">Descripción del formato</label>
                                                            <textarea
                                                                value={activeVariant.description}
                                                                onChange={(e) => updateVariantField(safeActiveVariantIndex, 'description', e.target.value)}
                                                                placeholder="Ej: Separador plástico para enfierradura, ideal para mantener recubrimiento uniforme"
                                                                rows={3}
                                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                            />
                                                            {(() => {
                                                                const wordCount = activeVariant.description.trim() ? activeVariant.description.trim().split(/\s+/).length : 0;
                                                                const isOver = wordCount > 500;
                                                                const isNear = wordCount > 450 && wordCount <= 500;
                                                                return (
                                                                    <div className="flex items-center justify-between mt-1.5">
                                                                        <p className={`text-xs font-semibold ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                            {wordCount} / 500 palabras
                                                                        </p>
                                                                        {isOver && (
                                                                            <p className="text-xs font-semibold text-red-600">
                                                                                Reduce la descripción, excede el límite.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-center gap-1.5">
                                                    {form.variants.map((variant, index) => (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            onClick={() => setActiveVariantIndex(index)}
                                                            className={`h-2.5 rounded-full transition-all ${index === safeActiveVariantIndex ? 'w-8 bg-orange-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                                                            aria-label={`Ir al formato ${index + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-5 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nota adicional</label>
                                <textarea
                                    value={form.notaTecnica}
                                    onChange={(e) => updateField('notaTecnica', e.target.value)}
                                    placeholder="Ej: Producto recomendado para losas y muros interiores"
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archivos o enlaces</p>
                                    <button type="button" onClick={addResource} className="text-xs font-semibold text-orange-600 hover:text-orange-700">+ Añadir</button>
                                </div>
                                <div className="space-y-2">
                                    {form.recursos.map((res, i) => (
                                        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                                            <input type="text" value={res.label} onChange={(e) => updateResource(i, 'label', e.target.value)} placeholder="Ej: Ficha técnica PDF"
                                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                            <input type="url" value={res.url} onChange={(e) => updateResource(i, 'url', e.target.value)} placeholder="Ej: https://miportal.cl/docs/ficha-separador.pdf"
                                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                            <button type="button" onClick={() => removeResource(i)} className="text-slate-300 hover:text-red-500 transition-colors p-1 justify-self-end sm:justify-self-auto" disabled={form.recursos.length <= 1}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ────── IMÁGENES TAB ────── */}
                {formTab === 'images' && (
                    <div className="p-5 sm:p-7 space-y-5">
                        {/* Thumbnail strip */}
                        <div className="grid grid-cols-4 gap-3">
                            {form.images.map((img, idx) => {
                                const hasContent = !!(img.url || img.file);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageSlot(idx)}
                                        className={`aspect-square rounded-2xl overflow-hidden border-2 relative transition-all ${idx === activeImageSlot
                                            ? 'border-orange-500 shadow-md shadow-orange-500/20'
                                            : 'border-gray-200 hover:border-orange-300'
                                            }`}
                                    >
                                        {hasContent ? (
                                            <img
                                                src={imagePreviews[idx] || DEFAULT_IMAGE}
                                                alt={`Miniatura ${idx + 1}`}
                                                className="w-full h-full object-contain bg-slate-100"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                        )}
                                        {idx === 0 && (
                                            <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white shadow">P</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Main preview */}
                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-gray-200 relative">
                            {imgSlotHasContent ? (
                                <img
                                    src={imagePreviews[activeImageSlot] || DEFAULT_IMAGE}
                                    alt={`Imagen ${activeImageSlot + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain bg-slate-100"
                                    style={{
                                        transform: `translate(${((imgSlot?.crop.offsetX ?? 0) * 18).toFixed(2)}%, ${((imgSlot?.crop.offsetY ?? 0) * 18).toFixed(2)}%) scale(${imgSlot?.crop.zoom ?? 1})`,
                                        transformOrigin: 'center',
                                    }}
                                    loading="lazy"
                                    onDoubleClick={() => setEditorImageExpanded(true)}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                    <Upload className="w-10 h-10 mb-2" />
                                    <span className="text-sm font-medium">Sin imagen</span>
                                </div>
                            )}

                            {/* Floating actions */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                {imgSlotHasContent && (
                                    <button
                                        type="button"
                                        onClick={() => setEditorImageExpanded(true)}
                                        className="bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors backdrop-blur-sm"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Slot label */}
                            <div className="absolute bottom-3 left-3">
                                <span className="bg-black/50 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                                    {activeImageSlot === 0 ? '★ Principal' : `Imagen ${activeImageSlot + 1}`}
                                </span>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                {activeImageSlot !== 0 && imgSlotHasContent && (
                                    <button
                                        type="button"
                                        onClick={() => { swapImages(activeImageSlot, 0); setActiveImageSlot(0); setActivePreviewImageIdx(0); }}
                                        className="p-2 rounded-xl text-orange-600 hover:bg-orange-50 transition-colors" title="Hacer principal"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>
                                )}
                                {activeImageSlot > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => { moveImage(activeImageSlot, -1); setActiveImageSlot((v) => Math.max(0, v - 1)); }}
                                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Mover izquierda"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                )}
                                {activeImageSlot < 3 && (
                                    <button
                                        type="button"
                                        onClick={() => { moveImage(activeImageSlot, 1); setActiveImageSlot((v) => Math.min(3, v + 1)); }}
                                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="Mover derecha"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => resetImageCrop(activeImageSlot)}
                                    className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors" title="Restaurar"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => clearImageSlot(activeImageSlot)}
                                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">Hasta 4 fotos · doble clic para expandir</span>
                        </div>

                        {/* Controls grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Crop controls */}
                            {imgSlotHasContent && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encuadre</p>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-600">Zoom</span>
                                            <span className="text-xs font-bold text-orange-600">{(imgSlot?.crop.zoom ?? 1).toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range" min={0.6} max={2.5} step={0.1}
                                            value={imgSlot?.crop.zoom ?? 1}
                                            onChange={(e) => updateImageCrop(activeImageSlot, { zoom: Number(e.target.value) })}
                                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-slate-600">Horizontal</span>
                                                <span className="text-xs font-bold text-orange-600">{(imgSlot?.crop.offsetX ?? 0) > 0 ? '→' : (imgSlot?.crop.offsetX ?? 0) < 0 ? '←' : '•'}</span>
                                            </div>
                                            <input
                                                type="range" min={-1} max={1} step={0.1}
                                                value={imgSlot?.crop.offsetX ?? 0}
                                                onChange={(e) => updateImageCrop(activeImageSlot, { offsetX: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-slate-600">Vertical</span>
                                                <span className="text-xs font-bold text-orange-600">{(imgSlot?.crop.offsetY ?? 0) > 0 ? '↓' : (imgSlot?.crop.offsetY ?? 0) < 0 ? '↑' : '•'}</span>
                                            </div>
                                            <input
                                                type="range" min={-1} max={1} step={0.1}
                                                value={imgSlot?.crop.offsetY ?? 0}
                                                onChange={(e) => updateImageCrop(activeImageSlot, { offsetY: Number(e.target.value) })}
                                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upload / URL */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {imgSlotHasContent ? 'Cambiar imagen' : 'Agregar imagen'}
                                </p>
                                <input
                                    type="url"
                                    value={imgSlot?.url ?? ''}
                                    onChange={(e) => updateImageUrl(activeImageSlot, e.target.value)}
                                    placeholder="Ej: https://miportal.cl/catalogo/separador-cono-20mm.jpg"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => updateImageFile(activeImageSlot, e.target.files?.[0] ?? null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className={`px-3 py-2.5 border rounded-xl text-sm text-center font-medium pointer-events-none transition-colors ${imgSlotHasContent
                                        ? 'bg-white border-gray-200 text-slate-600'
                                        : 'bg-orange-500 border-orange-500 text-white'
                                        }`}>
                                        {imgSlot?.file ? imgSlot.file.name.slice(0, 28) : 'Subir archivo'}
                                    </div>
                                </div>
                                {activeImageSlot === 0 && (
                                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                        Esta imagen se muestra en el catálogo.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Expanded image modal */}
            {
                editorImageExpanded && (
                    <div
                        className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
                        onClick={() => setEditorImageExpanded(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
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
                )
            }
        </div >
    );

    /* ═══════════════════════════════════════════════
       PREVIEW SECTION
       ═══════════════════════════════════════════════ */

    const previewImages = imagePreviews.filter(Boolean).slice(0, 4);

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
                            className="absolute inset-0 w-full h-full object-contain bg-slate-100"
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
                    {previewStock && (
                        <div className={`absolute top-3 left-3 text-sm font-bold px-3 py-1.5 rounded-lg shadow ${previewStock === 'EN STOCK' ? 'bg-emerald-500 text-white'
                            : previewStock === 'BAJO STOCK' ? 'bg-amber-500 text-white'
                                : previewStock === 'A PEDIDO' ? 'bg-blue-500 text-white'
                                    : 'bg-red-500 text-white'
                            }`}>
                            {previewStock}
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
                                <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-contain bg-slate-100" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-400">SKU: {previewSku || 'AUTO'}</span>
                        <span className={`text-sm font-semibold px-2.5 py-1 rounded-md ${form.isPublished ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                            {form.isPublished ? 'Activo' : 'Deshabilitado'}
                        </span>
                    </div>

                    <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
                        {form.title || 'Nombre del Producto'}
                    </h3>

                    {form.variants.length > 1 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formato</p>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {form.variants.map((variant, index) => (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={() => setPreviewVariantIndex(index)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${index === safePreviewVariantIndex
                                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        {variant.medida || `Formato ${index + 1}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {form.precioVisible ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-600/5 rounded-full -mr-10 -mt-10" />
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                    ${previewPrice ? formatPrice(previewPrice) : '0'}
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

                    <p className="text-base text-slate-500 leading-relaxed line-clamp-3">
                        {previewVariant?.description || form.description || 'La descripción del producto aparecerá aquí...'}
                    </p>

                    {(() => {
                        const rows: { key: string; value: string }[] = [];
                        const currentFormat = previewVariant?.presentacion || form.presentacion;
                        const currentMeasure = previewVariant?.medida || form.contenido;
                        if (previewVariant?.color) rows.push({ key: 'Color', value: previewVariant.color });
                        if (previewVariant?.material) rows.push({ key: 'Material', value: previewVariant.material });
                        if (currentMeasure) rows.push({ key: 'Medida', value: currentMeasure });
                        if (currentFormat) rows.push({ key: 'Formato', value: currentFormat });
                        if (previewVariant?.pesoKg) rows.push({ key: 'Peso', value: `${previewVariant.pesoKg} kg` });
                        const dims = [previewVariant?.altoMm && `${previewVariant.altoMm}mm`, previewVariant?.anchoMm && `${previewVariant.anchoMm}mm`, previewVariant?.largoMm && `${previewVariant.largoMm}mm`].filter(Boolean).join(' × ');
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

    /* ═══════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════ */

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
        <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-3">
            {/* Sticky Header */}
            <div className="sticky top-2 z-30 mb-7 bg-slate-50/95 backdrop-blur border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <nav className="text-sm text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                            <span className="hover:text-orange-600 cursor-pointer" onClick={() => router.push('/admin/products')}>Admin</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-slate-700 font-semibold">{isEditing ? 'Editar' : 'Nuevo'}</span>
                        </nav>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {isEditing ? 'Editar Producto' : 'Crear Producto'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => router.push('/admin/products')}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20 text-sm active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Crear Producto')}
                        </button>
                    </div>
                </div>
            </div>

            {saveError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3.5 text-sm font-semibold">
                    {saveError}
                </div>
            )}

            {/* Desktop: split panel */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-6">
                <div className="col-span-8">{FormSection}</div>
                <div className="col-span-4">
                    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 scrollbar-thin">
                        {PreviewSection}
                    </div>
                </div>
            </div>

            {/* Mobile: step wizard */}
            <div className="lg:hidden">
                <div className="flex items-center gap-2 mb-5">
                    <button
                        onClick={() => setMobileStep('form')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${mobileStep === 'form' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        Formulario
                    </button>
                    <button
                        onClick={() => setMobileStep('preview')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all ${mobileStep === 'preview' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-slate-100 text-slate-500'
                            }`}
                    >
                        Vista Previa
                    </button>
                </div>

                {mobileStep === 'form' ? (
                    <>
                        {FormSection}
                        <button
                            onClick={() => setMobileStep('preview')}
                            className="w-full mt-5 flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 rounded-xl text-sm"
                        >
                            Ver Previsualización <ArrowRight className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        {PreviewSection}
                        <div className="mt-5 space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl text-sm shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Guardando...' : (isEditing ? 'Guardar' : 'Crear Producto')}
                            </button>
                            <button
                                onClick={() => setMobileStep('form')}
                                className="w-full flex items-center justify-center gap-2 text-slate-600 font-semibold py-3 rounded-xl text-sm border border-gray-200 hover:bg-slate-50"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
