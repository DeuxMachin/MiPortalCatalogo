'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '@/src/entities/product/model/types';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

type PopularityRow = {
    producto_id: string;
    views_30d: number;
    clicks_30d: number;
    favs_30d: number;
    score: number;
};

type PopularityMap = Record<string, PopularityRow>;

export function useProductPopularity(products: Product[]) {
    const sb = useRef(getSupabaseBrowserClient());
    const [popularityByProductId, setPopularityByProductId] = useState<PopularityMap>({});

    const productIds = useMemo(() => products.map((p) => p.id), [products]);

    useEffect(() => {
        const fetchPopularity = async () => {
            if (productIds.length === 0) {
                setPopularityByProductId({});
                return;
            }

            const { data, error } = await sb.current.rpc('get_product_popularity_30d', {
                p_product_ids: productIds,
            });

            if (error) {
                console.warn('[ProductPopularity] Error al cargar score popular:', error.message);
                return;
            }

            const rows = (data ?? []) as PopularityRow[];
            const nextMap: PopularityMap = {};
            rows.forEach((row) => {
                nextMap[row.producto_id] = row;
            });
            setPopularityByProductId(nextMap);
        };

        void fetchPopularity();
    }, [productIds]);

    return { popularityByProductId };
}
