import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _browserClient: SupabaseClient | null = null;

/**
 * Supabase browser client — singleton.
 * Uses NEXT_PUBLIC_ env vars so it works in client components.
 * Session is persisted via localStorage by supabase-js.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
    if (_browserClient) return _browserClient;

    const fetchWithTimeout: typeof fetch | undefined = typeof window !== 'undefined'
        ? (async (input: RequestInfo | URL, init?: RequestInit) => {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 12_000);

            try {
                if (init?.signal) return await fetch(input, init);
                return await fetch(input, { ...init, signal: controller.signal });
            } finally {
                window.clearTimeout(timeout);
            }
        })
        : undefined;

    _browserClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: fetchWithTimeout,
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        },
    );

    return _browserClient;
}
