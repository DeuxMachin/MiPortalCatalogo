import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let _adminClient: SupabaseClient | null = null;

let _dotEnvCache: Record<string, string> | null = null;

function readDotEnvFile(): Record<string, string> {
    if (_dotEnvCache) return _dotEnvCache;

    try {
        const envPath = path.join(process.cwd(), '.env');
        const raw = fs.readFileSync(envPath, 'utf8');
        const entries = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));

        const parsed: Record<string, string> = {};

        entries.forEach((line) => {
            const idx = line.indexOf('=');
            if (idx <= 0) return;
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            if (!key) return;
            parsed[key] = value;
        });

        _dotEnvCache = parsed;
        return parsed;
    } catch {
        _dotEnvCache = {};
        return _dotEnvCache;
    }
}

function resolveEnvValue(...keys: string[]): string | undefined {
    for (const key of keys) {
        const runtimeValue = process.env[key]?.trim();
        if (runtimeValue) return runtimeValue;
    }

    const dotEnv = readDotEnvFile();
    for (const key of keys) {
        const fileValue = dotEnv[key]?.trim();
        if (fileValue) return fileValue;
    }

    return undefined;
}

function resolveServiceRoleKey(): string | undefined {
    return resolveEnvValue(
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SERVICE_ROLE',
        'SUPABASE_SERVICE_KEY',
        'SUPABASE_SECRET_KEY',
    );
}

export function getSupabaseAdminClient(): SupabaseClient {
    if (_adminClient) return _adminClient;

    const supabaseUrl = resolveEnvValue('NEXT_PUBLIC_SUPABASE_URL');
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
