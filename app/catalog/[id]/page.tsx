'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { useProducts } from '@/src/features/product-management';
import ProductDetailView from '@/src/views/product-detail/ui/ProductDetailView';

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
    const { id } = use(params);
    const { getProduct } = useProducts();
    const product = getProduct(Number(id));

    if (!product) {
        notFound();
    }

    return <ProductDetailView product={product} />;
}
