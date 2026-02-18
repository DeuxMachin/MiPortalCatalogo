import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/src/shared/lib/supabaseAdmin';
import { requireAdminFromBearerToken } from '@/src/shared/lib/adminRouteAuth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const auth = await requireAdminFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
        return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status });
    }

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get('limit') ?? 50);
    const limit = Number.isFinite(limitRaw)
        ? Math.max(10, Math.min(200, Math.floor(limitRaw)))
        : 50;

    try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
            .from('auditoria')
            .select('id, accion, tabla, registro_id, descripcion, usuario_id, usuario_email, creado_en')
            .order('creado_en', { ascending: false })
            .limit(limit);

        if (!error) {
            return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
        }
    } catch {
        // fallback below
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        return NextResponse.json(
            { ok: false, reason: 'No se pudo cargar el historial: configuración de Supabase incompleta.' },
            { status: 500 },
        );
    }

    const fallbackClient = createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${auth.accessToken}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    const { data, error } = await fallbackClient
        .from('auditoria')
        .select('id, accion, tabla, registro_id, descripcion, usuario_id, usuario_email, creado_en')
        .order('creado_en', { ascending: false })
        .limit(limit);

    if (error) {
        return NextResponse.json(
            { ok: false, reason: error.message || 'No se pudo cargar el historial.' },
            { status: 500 },
        );
    }

    return NextResponse.json({ ok: true, items: data ?? [] }, { status: 200 });
}
