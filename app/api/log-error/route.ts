import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ErrorSeverity } from '@/src/shared/lib/errorTracking';
import { getSupabaseAdminClient } from '@/src/shared/lib/supabaseAdmin';

export const runtime = 'nodejs';
const IS_PROD = process.env.NODE_ENV === 'production';

type SourceType = 'client' | 'server';

type ErrorPayload = {
    severity: ErrorSeverity;
    source: SourceType;
    route: string;
    action: string;
    message: string;
    stack?: string;
    timestamp?: string;
    env?: string;
    release?: string;
    context?: Record<string, unknown>;
    sessionId?: string;
    critical?: boolean;
    forcePersist?: boolean;
};

const MAX_PAYLOAD_BYTES = 20_000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 8_000;
const MAX_ROUTE_LENGTH = 200;
const MAX_ACTION_LENGTH = 120;
const MAX_ENV_LENGTH = 40;
const MAX_RELEASE_LENGTH = 80;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const DEDUPE_MINUTES = 10;

const tokenRegex = /(?:bearer\s+)?[a-z0-9-_]{20,}\.[a-z0-9-_]{20,}\.[a-z0-9-_]{10,}|(?:sk|pk)_[a-z0-9]{12,}|eyJ[a-zA-Z0-9_-]{10,}/gi;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

function mask(value: string): string {
    return value.replace(tokenRegex, '[REDACTED_TOKEN]').replace(emailRegex, '[REDACTED_EMAIL]');
}

function sanitizeContext(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return mask(value).slice(0, 2000);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 20).map(sanitizeContext);
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const clean: Record<string, unknown> = {};
        Object.entries(obj).slice(0, 30).forEach(([key, val]) => {
            const low = key.toLowerCase();
            if (low.includes('token') || low.includes('cookie') || low.includes('authorization') || low.includes('password') || low.includes('secret')) {
                clean[key] = '[REDACTED]';
            } else {
                clean[key] = sanitizeContext(val);
            }
        });
        return clean;
    }
    return String(value);
}

function isValidSeverity(severity: string): severity is ErrorSeverity {
    return severity === 'warning' || severity === 'error' || severity === 'fatal';
}

function isValidSource(source: string): source is SourceType {
    return source === 'client' || source === 'server';
}

function normalizeString(value: unknown, maxLength: number): string {
    if (typeof value !== 'string') return '';
    return mask(value.trim()).slice(0, maxLength);
}

function hashSha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

function getBucketStart(date: Date, minutesWindow: number): string {
    const ms = minutesWindow * 60_000;
    const bucket = Math.floor(date.getTime() / ms) * ms;
    return new Date(bucket).toISOString();
}

function validatePayload(raw: unknown): { ok: true; payload: ErrorPayload } | { ok: false; reason: string } {
    if (!raw || typeof raw !== 'object') return { ok: false, reason: 'Payload inválido' };
    const data = raw as Record<string, unknown>;

    const severity = normalizeString(data.severity, 10);
    const source = normalizeString(data.source, 10);
    const route = normalizeString(data.route, MAX_ROUTE_LENGTH);
    const action = normalizeString(data.action, MAX_ACTION_LENGTH);
    const message = normalizeString(data.message, MAX_MESSAGE_LENGTH);

    if (!isValidSeverity(severity)) return { ok: false, reason: 'Severity inválida' };
    if (!isValidSource(source)) return { ok: false, reason: 'Source inválido' };
    if (!route) return { ok: false, reason: 'Route requerida' };
    if (!action) return { ok: false, reason: 'Action requerida' };
    if (!message) return { ok: false, reason: 'Message requerido' };

    const payload: ErrorPayload = {
        severity,
        source,
        route,
        action,
        message,
        stack: normalizeString(data.stack, MAX_STACK_LENGTH) || undefined,
        timestamp: normalizeString(data.timestamp, 40) || undefined,
        env: normalizeString(data.env, MAX_ENV_LENGTH) || undefined,
        release: normalizeString(data.release, MAX_RELEASE_LENGTH) || undefined,
        sessionId: normalizeString(data.sessionId, 120) || undefined,
        context: sanitizeContext(data.context ?? {}) as Record<string, unknown>,
        critical: Boolean(data.critical),
        forcePersist: Boolean(data.forcePersist),
    };

    return { ok: true, payload };
}

function applyMemoryRateLimit(key: string): boolean {
    const now = Date.now();
    const current = memoryRateLimit.get(key);
    if (!current || current.resetAt < now) {
        memoryRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (current.count >= RATE_LIMIT_MAX) {
        return false;
    }

    current.count += 1;
    memoryRateLimit.set(key, current);
    return true;
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        if (!rawBody || rawBody.length > MAX_PAYLOAD_BYTES) {
            return NextResponse.json({ ok: false, reason: 'Payload demasiado grande' }, { status: 400 });
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ ok: false, reason: 'JSON inválido' }, { status: 400 });
        }

        const validation = validatePayload(parsed);
        if (!validation.ok) {
            return NextResponse.json({ ok: false, reason: validation.reason }, { status: 400 });
        }

        const payload = validation.payload;

        const headerStore = await headers();
        const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? headerStore.get('x-real-ip')
            ?? 'unknown';

        const actorSeed = `${ip}:${payload.sessionId ?? 'no-session'}:${payload.source}`;
        const actorHash = hashSha256(actorSeed);

        if (!applyMemoryRateLimit(actorHash)) {
            return NextResponse.json({ ok: true, skipped: 'rate_limited' }, { status: 202 });
        }

        const fingerprintBase = `${payload.message}|${payload.stack ?? ''}|${payload.route}|${payload.action}`;
        const fingerprint = hashSha256(fingerprintBase);
        const now = new Date();
        const bucketStart = getBucketStart(now, DEDUPE_MINUTES);

        const shouldPersist =
            payload.forcePersist
            || (
                payload.env === 'production'
                && (payload.severity === 'error' || payload.severity === 'fatal' || payload.critical)
            );

        if (!shouldPersist) {
            return NextResponse.json({ ok: true, skipped: 'non_critical_non_prod' }, { status: 202 });
        }

        const sb = getSupabaseAdminClient();

        const { error } = await sb.rpc('upsert_error_fallback', {
            p_fingerprint: fingerprint,
            p_bucket_inicio: bucketStart,
            p_severidad: payload.severity,
            p_fuente: payload.source,
            p_ruta: payload.route,
            p_accion: payload.action,
            p_mensaje: payload.message,
            p_stack: payload.stack ?? null,
            p_entorno: payload.env ?? null,
            p_release_build: payload.release ?? null,
            p_contexto: payload.context ?? {},
            p_actor_hash: actorHash,
        });

        if (error) {
            return NextResponse.json(
                {
                    ok: false,
                    reason: 'DB error',
                    detail: IS_PROD ? undefined : error.message,
                    code: IS_PROD ? undefined : error.code,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                ok: false,
                reason: 'Unhandled error',
                detail: IS_PROD
                    ? undefined
                    : (err instanceof Error ? err.message : 'Error desconocido'),
            },
            { status: 500 },
        );
    }
}
