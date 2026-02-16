import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/src/shared/lib/supabaseAdmin';

export const runtime = 'nodejs';

function fingerprintFor(message: string, route: string, action: string, stack?: string): string {
    return createHash('sha256')
        .update(`${message}|${stack ?? ''}|${route}|${action}`)
        .digest('hex');
}

export async function GET(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ ok: false, reason: 'Not found' }, { status: 404 });
    }

    const route = '/api/debug-fallback';
    const action = 'manual_fallback_test';
    const message = 'DEBUG_FALLBACK_TEST: persistencia forzada en Supabase fallback';

    const payload = {
        severity: 'error',
        source: 'server',
        route,
        action,
        message,
        stack: 'DebugStack: fallback_test',
        timestamp: new Date().toISOString(),
        env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
        release: process.env.APP_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
        context: {
            debug: true,
            purpose: 'validar fallback supabase',
        },
        critical: true,
        forcePersist: true,
        sessionId: 'debug-fallback-session',
    };

    const requestUrl = new URL(request.url);
    const fallbackUrl = `${requestUrl.origin}/api/log-error`;
    const fingerprint = fingerprintFor(payload.message, payload.route, payload.action, payload.stack);

    const response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
    });

    const body = await response.json().catch(() => ({}));

    let persistedRow: { id: string; ocurrencias: number; actualizado_en: string } | null = null;
    let persistedLookupError: string | null = null;

    try {
        const sb = getSupabaseAdminClient();
        const { data, error } = await sb
            .from('error_registros_fallback')
            .select('id, ocurrencias, actualizado_en')
            .eq('fingerprint', fingerprint)
            .order('actualizado_en', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            persistedLookupError = error.message;
        } else if (data) {
            persistedRow = data;
        }
    } catch (err) {
        persistedLookupError = err instanceof Error ? err.message : 'lookup_failed';
    }

    return NextResponse.json({
        ok: response.ok,
        channel: 'supabase-fallback',
        fallbackStatus: response.status,
        fallbackResponse: body,
        fingerprint,
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        persistedRow,
        persistedLookupError,
        message: 'Evento de prueba enviado al fallback interno.',
    }, { status: response.ok ? 200 : 500 });
}
