import * as Sentry from '@sentry/nextjs';

export type ErrorSeverity = 'warning' | 'error' | 'fatal';
export type ErrorSource = 'client' | 'server';

type ErrorTrackingPayload = {
    severity: ErrorSeverity;
    source: ErrorSource;
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

const TOKEN_REGEX = /(?:bearer\s+)?[a-z0-9-_]{20,}\.[a-z0-9-_]{20,}\.[a-z0-9-_]{10,}|(?:sk|pk)_[a-z0-9]{12,}|eyJ[a-zA-Z0-9_-]{10,}/gi;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function maskString(value: string): string {
    return value
        .replace(TOKEN_REGEX, '[REDACTED_TOKEN]')
        .replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
}

function sanitizeUnknown(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return maskString(value).slice(0, 2000);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 20).map(sanitizeUnknown);
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const clean: Record<string, unknown> = {};
        Object.entries(obj).slice(0, 30).forEach(([k, v]) => {
            const keyLower = k.toLowerCase();
            if (
                keyLower.includes('password')
                || keyLower.includes('token')
                || keyLower.includes('cookie')
                || keyLower.includes('authorization')
                || keyLower.includes('secret')
            ) {
                clean[k] = '[REDACTED]';
                return;
            }
            clean[k] = sanitizeUnknown(v);
        });
        return clean;
    }
    return String(value);
}

function resolveEnvironment() {
    return process.env.NEXT_PUBLIC_APP_ENV
        ?? process.env.APP_ENV
        ?? process.env.NODE_ENV
        ?? 'development';
}

function resolveRelease() {
    return process.env.NEXT_PUBLIC_APP_RELEASE
        ?? process.env.APP_RELEASE
        ?? process.env.VERCEL_GIT_COMMIT_SHA
        ?? 'local';
}

function levelForSeverity(severity: ErrorSeverity): Sentry.SeverityLevel {
    if (severity === 'fatal') return 'fatal';
    if (severity === 'warning') return 'warning';
    return 'error';
}

function fallbackEndpointUrl(): string {
    if (typeof window !== 'undefined') return '/api/log-error';
    const base = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/api/log-error`;
}

function getClientSessionId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        const key = 'app_error_session_id';
        const existing = window.sessionStorage.getItem(key);
        if (existing) return existing;
        const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
        window.sessionStorage.setItem(key, created);
        return created;
    } catch {
        return undefined;
    }
}

export async function reportError(
    input: {
        error: unknown;
        severity?: ErrorSeverity;
        source?: ErrorSource;
        route?: string;
        action?: string;
        context?: Record<string, unknown>;
        critical?: boolean;
    },
): Promise<void> {
    const severity = input.severity ?? 'error';
    const source = input.source ?? (typeof window === 'undefined' ? 'server' : 'client');
    const route = input.route ?? (typeof window !== 'undefined' ? window.location.pathname : 'server');
    const action = input.action ?? 'unhandled';
    const env = resolveEnvironment();
    const release = resolveRelease();

    const errorObj = input.error instanceof Error
        ? input.error
        : new Error(typeof input.error === 'string' ? input.error : 'Error desconocido');

    const payload: ErrorTrackingPayload = {
        severity,
        source,
        route,
        action,
        message: maskString(errorObj.message || 'Error sin mensaje').slice(0, 500),
        stack: errorObj.stack ? maskString(errorObj.stack).slice(0, 8000) : undefined,
        timestamp: new Date().toISOString(),
        env,
        release,
        context: sanitizeUnknown(input.context ?? {}) as Record<string, unknown>,
        sessionId: getClientSessionId(),
        critical: Boolean(input.critical),
    };

    let glitchtipAvailable = false;
    try {
        Sentry.withScope((scope) => {
            scope.setLevel(levelForSeverity(severity));
            scope.setTag('source', source);
            scope.setTag('route', route);
            scope.setTag('action', action);
            scope.setTag('env', env);
            scope.setTag('release', release);
            scope.setContext('safe_context', (payload.context ?? {}) as Record<string, unknown>);
            Sentry.captureException(errorObj);
        });
        glitchtipAvailable = Boolean(process.env.NEXT_PUBLIC_GLITCHTIP_DSN || process.env.GLITCHTIP_DSN);
    } catch {
        glitchtipAvailable = false;
    }

    const shouldFallback =
        !glitchtipAvailable
        || (env === 'production' && (severity === 'error' || severity === 'fatal'))
        || Boolean(input.critical);

    payload.forcePersist = !glitchtipAvailable;

    if (!shouldFallback) return;

    try {
        await fetch(fallbackEndpointUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
            cache: 'no-store',
        });
    } catch {
        // Evitar throw para no romper UX por falla de tracking
    }
}
