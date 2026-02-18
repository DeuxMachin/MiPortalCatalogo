import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/src/shared/lib/supabaseAdmin';
import { requireAdminFromBearerToken } from '@/src/shared/lib/adminRouteAuth';

export const runtime = 'nodejs';

type CreateAdminUserBody = {
    email?: string;
    password?: string;
    nombre?: string;
};

type UpdateAdminUserBody = {
    id?: string;
    nombre?: string;
    email?: string;
    password?: string;
    action?: 'disable' | 'enable' | 'update';
};

function computeUserStatus(user: { banned_until?: string | null; deleted_at?: string | null }) {
    if (user.deleted_at) return 'eliminado';
    if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) return 'deshabilitado';
    return 'activo';
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): string | null {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una mayúscula.';
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una minúscula.';
    if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número.';
    return null;
}

async function writeAudit(
    actor: { id: string; email: string },
    table: string,
    registroId: string,
    descripcion: string,
    accion: 'CREAR' | 'ELIMINAR' = 'CREAR',
) {
    try {
        const supabase = getSupabaseAdminClient();
        await supabase
            .from('auditoria')
            .insert({
                accion,
                tabla: table,
                registro_id: registroId,
                descripcion,
                usuario_id: actor.id,
                usuario_email: actor.email,
            });
    } catch {
        // no-op
    }
}

export async function GET(request: Request) {
    const auth = await requireAdminFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
        return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status });
    }

    let supabase;
    try {
        supabase = getSupabaseAdminClient();
    } catch {
        return NextResponse.json(
            {
                ok: false,
                reason: 'Falta SUPABASE_SERVICE_ROLE_KEY en entorno activo. No se pueden listar usuarios.',
            },
            { status: 500 },
        );
    }

    const perPage = 200;
    const users: any[] = [];
    let page = 1;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) {
            return NextResponse.json(
                { ok: false, reason: error.message ?? 'No se pudieron listar los usuarios.' },
                { status: 500 },
            );
        }

        const batch = data?.users ?? [];
        users.push(...batch);
        if (batch.length < perPage) break;
        page += 1;
    }

    const ids = users.map((user) => user.id);
    const profilesById = new Map<string, { nombre?: string; rol?: string }>();

    if (ids.length > 0) {
        const { data: profiles } = await supabase
            .from('perfiles')
            .select('id, nombre, rol')
            .in('id', ids);

        (profiles ?? []).forEach((profile: any) => {
            profilesById.set(String(profile.id), {
                nombre: profile.nombre ?? undefined,
                rol: profile.rol ?? undefined,
            });
        });
    }

    const items = users.map((user) => {
        const profile = profilesById.get(user.id);
        return {
            id: user.id,
            email: user.email ?? '',
            nombre: profile?.nombre ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Sin nombre',
            rol: profile?.rol ?? 'admin',
            estado: computeUserStatus({ banned_until: user.banned_until, deleted_at: user.deleted_at }),
            createdAt: user.created_at ?? null,
            lastSignInAt: user.last_sign_in_at ?? null,
            bannedUntil: user.banned_until ?? null,
            deletedAt: user.deleted_at ?? null,
        };
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
}

export async function POST(request: Request) {
    const auth = await requireAdminFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
        return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status });
    }

    let body: CreateAdminUserBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, reason: 'Body JSON inválido.' }, { status: 400 });
    }

    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const nombre = String(body.nombre ?? '').trim();

    if (!email || !isValidEmail(email)) {
        return NextResponse.json({ ok: false, reason: 'Debes ingresar un correo válido.' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return NextResponse.json({ ok: false, reason: passwordError }, { status: 400 });
    }

    let supabase;
    try {
        supabase = getSupabaseAdminClient();
    } catch {
        return NextResponse.json(
            { ok: false, reason: 'Falta SUPABASE_SERVICE_ROLE_KEY en entorno activo.' },
            { status: 500 },
        );
    }

    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name: nombre || email.split('@')[0],
        },
    });

    if (createError || !createdUser?.user?.id) {
        return NextResponse.json(
            { ok: false, reason: createError?.message ?? 'No se pudo crear el usuario en Supabase Auth.' },
            { status: 400 },
        );
    }

    const newUserId = createdUser.user.id;

    const { error: profileError } = await supabase
        .from('perfiles')
        .upsert({
            id: newUserId,
            rol: 'admin',
            nombre: nombre || email.split('@')[0],
        });

    if (profileError) {
        return NextResponse.json(
            { ok: false, reason: `Usuario creado en Auth, pero falló creación de perfil: ${profileError.message}` },
            { status: 500 },
        );
    }

    await writeAudit(auth.actor, 'auth.users', newUserId, `CREAR usuario admin ${email}`, 'CREAR');

    return NextResponse.json(
        {
            ok: true,
            user: {
                id: newUserId,
                email,
                nombre: nombre || email.split('@')[0],
                rol: 'admin',
            },
        },
        { status: 201 },
    );
}

export async function PATCH(request: Request) {
    const auth = await requireAdminFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
        return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status });
    }

    let body: UpdateAdminUserBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, reason: 'Body JSON inválido.' }, { status: 400 });
    }

    const id = String(body.id ?? '').trim();
    if (!id) {
        return NextResponse.json({ ok: false, reason: 'ID de usuario requerido.' }, { status: 400 });
    }

    let supabase;
    try {
        supabase = getSupabaseAdminClient();
    } catch {
        return NextResponse.json(
            { ok: false, reason: 'Falta SUPABASE_SERVICE_ROLE_KEY en entorno activo.' },
            { status: 500 },
        );
    }

    const action = body.action ?? 'update';

    if (action === 'disable') {
        const { error } = await supabase.auth.admin.updateUserById(id, {
            ban_duration: '876000h',
        });

        if (error) {
            return NextResponse.json({ ok: false, reason: error.message ?? 'No se pudo deshabilitar el usuario.' }, { status: 400 });
        }

        await writeAudit(auth.actor, 'auth.users', id, `DESHABILITAR usuario ${id}`, 'CREAR');
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (action === 'enable') {
        const { error } = await supabase.auth.admin.updateUserById(id, {
            ban_duration: 'none',
        });

        if (error) {
            return NextResponse.json({ ok: false, reason: error.message ?? 'No se pudo habilitar el usuario.' }, { status: 400 });
        }

        await writeAudit(auth.actor, 'auth.users', id, `HABILITAR usuario ${id}`, 'CREAR');
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    const payload: Record<string, unknown> = {};
    const nextEmail = body.email?.trim().toLowerCase();
    const nextPassword = body.password ?? '';
    const nextNombre = body.nombre?.trim();

    if (nextEmail) {
        if (!isValidEmail(nextEmail)) {
            return NextResponse.json({ ok: false, reason: 'Correo inválido.' }, { status: 400 });
        }
        payload.email = nextEmail;
    }

    if (nextPassword) {
        const validation = validatePassword(nextPassword);
        if (validation) {
            return NextResponse.json({ ok: false, reason: validation }, { status: 400 });
        }
        payload.password = nextPassword;
    }

    if (nextNombre) {
        payload.user_metadata = { name: nextNombre };
    }

    if (Object.keys(payload).length > 0) {
        const { error } = await supabase.auth.admin.updateUserById(id, payload);
        if (error) {
            return NextResponse.json({ ok: false, reason: error.message ?? 'No se pudo actualizar el usuario.' }, { status: 400 });
        }
    }

    if (nextNombre) {
        await supabase
            .from('perfiles')
            .update({ nombre: nextNombre })
            .eq('id', id);
    }

    await writeAudit(auth.actor, 'auth.users', id, `EDITAR usuario ${id}`, 'CREAR');
    return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: Request) {
    const auth = await requireAdminFromBearerToken(request.headers.get('authorization'));
    if (!auth.ok) {
        return NextResponse.json({ ok: false, reason: auth.reason }, { status: auth.status });
    }

    const url = new URL(request.url);
    const id = (url.searchParams.get('id') ?? '').trim();

    if (!id) {
        return NextResponse.json({ ok: false, reason: 'ID de usuario requerido.' }, { status: 400 });
    }

    let supabase;
    try {
        supabase = getSupabaseAdminClient();
    } catch {
        return NextResponse.json(
            { ok: false, reason: 'Falta SUPABASE_SERVICE_ROLE_KEY en entorno activo.' },
            { status: 500 },
        );
    }

    const { error } = await supabase.auth.admin.deleteUser(id, true);
    if (error) {
        return NextResponse.json({ ok: false, reason: error.message ?? 'No se pudo eliminar el usuario.' }, { status: 400 });
    }

    await writeAudit(auth.actor, 'auth.users', id, `ELIMINAR usuario ${id}`, 'ELIMINAR');
    return NextResponse.json({ ok: true }, { status: 200 });
}
