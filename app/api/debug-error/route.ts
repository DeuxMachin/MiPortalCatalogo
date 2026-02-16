import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ ok: false, reason: 'Not found' }, { status: 404 });
    }

    const debugError = new Error('DEBUG_GLITCHTIP_TEST: error de prueba controlado');
    const eventId = Sentry.captureException(debugError, {
        tags: {
            debug: 'true',
            channel: 'glitchtip',
        },
        extra: {
            route: '/api/debug-error',
            action: 'manual_glitchtip_test',
        },
    });

    await Sentry.flush(2000);

    return NextResponse.json({
        ok: true,
        channel: 'glitchtip',
        eventId,
        message: 'Evento de prueba enviado a GlitchTip.',
    });
}
