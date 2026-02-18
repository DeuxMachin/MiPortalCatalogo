import { getSupabaseAdminClient } from '@/src/shared/lib/supabaseAdmin';

export interface AdminActor {
    id: string;
    email: string;
}

export interface AdminAuthSuccess {
    ok: true;
    actor: AdminActor;
    accessToken: string;
}

export async function requireAdminFromBearerToken(
    authHeader: string | null,
): Promise<AdminAuthSuccess | { ok: false; status: number; reason: string }> {
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return { ok: false, status: 401, reason: 'Token de autorización requerido.' };
    }

    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
        return { ok: false, status: 401, reason: 'Token de autorización inválido.' };
    }

    const supabase = getSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData?.user?.id) {
        return { ok: false, status: 401, reason: 'Sesión inválida o expirada.' };
    }

    const actorId = userData.user.id;
    const actorEmail = userData.user.email ?? '';

    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', actorId)
        .maybeSingle();

    if (profileError) {
        return { ok: false, status: 500, reason: 'No se pudo validar el perfil del usuario.' };
    }

    if (!profile || profile.rol !== 'admin') {
        return { ok: false, status: 403, reason: 'Acceso denegado: solo administradores.' };
    }

    return {
        ok: true,
        actor: {
            id: actorId,
            email: actorEmail,
        },
        accessToken,
    };
}
