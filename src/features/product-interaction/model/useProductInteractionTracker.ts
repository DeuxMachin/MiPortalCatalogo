'use client';

import { useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

type InteractionEventType = 'view' | 'click' | 'favorite';

const DEVICE_ID_KEY = 'catalog_device_id';
const SESSION_ID_KEY = 'catalog_session_id';

function safeGenerateId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function getOrCreateLocalStorageId(key: string, prefix: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const existing = window.localStorage.getItem(key);
        if (existing?.trim()) return existing;
        const created = safeGenerateId(prefix);
        window.localStorage.setItem(key, created);
        return created;
    } catch {
        return null;
    }
}

function getOrCreateSessionStorageId(key: string, prefix: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const existing = window.sessionStorage.getItem(key);
        if (existing?.trim()) return existing;
        const created = safeGenerateId(prefix);
        window.sessionStorage.setItem(key, created);
        return created;
    } catch {
        return null;
    }
}

export function useProductInteractionTracker() {
    const sb = useRef(getSupabaseBrowserClient());

    const trackEvent = useCallback(
        async (productId: string, eventType: InteractionEventType, clickAction?: string): Promise<boolean> => {
            const deviceId = getOrCreateLocalStorageId(DEVICE_ID_KEY, 'dev');
            const sessionId = getOrCreateSessionStorageId(SESSION_ID_KEY, 'ses');

            if (!deviceId && !sessionId) return false;

            const { data, error } = await sb.current.rpc('record_product_interaction', {
                p_producto_id: productId,
                p_event_type: eventType,
                p_device_id: deviceId,
                p_session_id: sessionId,
                p_click_action: clickAction ?? null,
            });

            if (error) {
                console.warn('[InteractionTracker] Error al registrar interacción:', error.message);
                return false;
            }

            return Boolean(data);
        },
        [],
    );

    const trackView = useCallback((productId: string) => trackEvent(productId, 'view'), [trackEvent]);
    const trackClick = useCallback(
        (productId: string, action: string) => trackEvent(productId, 'click', action),
        [trackEvent],
    );
    const trackFavorite = useCallback((productId: string) => trackEvent(productId, 'favorite'), [trackEvent]);

    return {
        trackView,
        trackClick,
        trackFavorite,
    };
}
