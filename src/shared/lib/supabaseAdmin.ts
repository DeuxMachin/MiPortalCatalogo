import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

function resolveServiceRoleKey(): string | undefined {
    const raw = process.env.SUPABASE_SERVICE_ROLE_KEY
        ?? process.env.SUPABASE_SERVICE_ROLE
        ?? process.env.SUPABASE_SERVICE_KEY
        ?? process.env.SUPABASE_SECRET_KEY;

    const normalized = raw?.trim();
    return normalized ? normalized : undefined;
}

export function getSupabaseAdminClient(): SupabaseClient {
    if (_adminClient) return _adminClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = resolveServiceRoleKey();

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Faltan variables para fallback: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY (o alias SUPABASE_SERVICE_ROLE, SUPABASE_SERVICE_KEY, SUPABASE_SECRET_KEY).',
        );
    }

    _adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return _adminClient;
}
