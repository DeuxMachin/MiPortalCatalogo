'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import ProductFormView from '@/src/views/admin/ui/ProductFormView';
import { useProducts } from '@/src/features/product-management';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { getProduct, loading } = useProducts();
    const product = getProduct(id);

    if (loading) return null;

    if (!product) {
        notFound();
    }

    return <ProductFormView editProduct={product} />;
}
