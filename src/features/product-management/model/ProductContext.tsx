'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { MOCK_PRODUCTS } from '@/src/entities/product/model/mock-data';
import type { Product } from '@/src/entities/product/model/types';

interface ProductContextValue {
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Product;
    updateProduct: (id: number, updates: Partial<Product>) => void;
    deleteProduct: (id: number) => void;
    getProduct: (id: number) => Product | undefined;
}

const ProductContext = createContext<ProductContextValue | null>(null);

let nextId = 100;

export function ProductProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<Product[]>([...MOCK_PRODUCTS]);

    const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
        const newProduct: Product = { ...productData, id: nextId++ };
        setProducts((prev) => [newProduct, ...prev]);
        return newProduct;
    }, []);

    const updateProduct = useCallback((id: number, updates: Partial<Product>) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
    }, []);

    const deleteProduct = useCallback((id: number) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const getProduct = useCallback(
        (id: number) => products.find((p) => p.id === id),
        [products]
    );

    return (
        <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, getProduct }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts(): ProductContextValue {
    const ctx = useContext(ProductContext);
    if (!ctx) throw new Error('useProducts debe usarse dentro de un ProductProvider');
    return ctx;
}
