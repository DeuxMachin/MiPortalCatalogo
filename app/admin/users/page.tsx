'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ShieldPlus,
    UserPlus,
    Search,
    RefreshCw,
    UserCog,
    Ban,
    CheckCircle2,
    Trash2,
    ChevronDown,
    Eye,
    EyeOff,
    AlertTriangle,
    X,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

type AdminUser = {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    estado: 'activo' | 'deshabilitado' | 'eliminado';
    createdAt: string | null;
    lastSignInAt: string | null;
    bannedUntil: string | null;
    deletedAt: string | null;
};

export default function AdminUsersPage() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [filter, setFilter] = useState<'todos' | 'activo' | 'deshabilitado' | 'eliminado'>('todos');
    const [query, setQuery] = useState('');
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editNombre, setEditNombre] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ user: AdminUser; action: 'disable' | 'enable' | 'delete' } | null>(null);

    const withAdminToken = useCallback(async () => {
        const sb = getSupabaseBrowserClient();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData.session?.access_token;
        return token ?? null;
    }, []);

    const loadUsers = useCallback(async () => {
        setMessage(null);
        const token = await withAdminToken();
        if (!token) {
            setMessage({ type: 'error', text: 'Sesión no disponible. Inicia sesión nuevamente.' });
            return;
        }

        const response = await fetch('/api/admin/users', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json.ok) {
            setMessage({ type: 'error', text: json.reason ?? 'No se pudo cargar el listado de usuarios.' });
            return;
        }

        setUsers((json.items ?? []) as AdminUser[]);
    }, [withAdminToken]);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleCreateAdminUser = async () => {
        setMessage(null);

        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Debes ingresar un correo.' });
            return;
        }

        if (!password) {
            setMessage({ type: 'error', text: 'Debes ingresar una contraseña.' });
            return;
        }

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'La confirmación de contraseña no coincide.' });
            return;
        }

        setSaving(true);

        const token = await withAdminToken();

        if (!token) {
            setSaving(false);
            setMessage({ type: 'error', text: 'Sesión no disponible. Inicia sesión nuevamente.' });
            return;
        }

        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                nombre: nombre.trim(),
                email: email.trim(),
                password,
            }),
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.ok) {
            setSaving(false);
            setMessage({ type: 'error', text: json.reason ?? 'No se pudo crear el usuario administrador.' });
            return;
        }

        setSaving(false);
        setNombre('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowCreatePanel(false);
        setMessage({ type: 'success', text: 'Usuario administrador creado correctamente.' });
        void loadUsers();
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setEditNombre(user.nombre || '');
        setEditEmail(user.email || '');
        setEditPassword('');
        setEditConfirmPassword('');
        setShowEditPassword(false);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        if (editPassword && editPassword !== editConfirmPassword) {
            setMessage({ type: 'error', text: 'La confirmación de la nueva contraseña no coincide.' });
            return;
        }

        setSaving(true);
        const token = await withAdminToken();
        if (!token) {
            setSaving(false);
            setMessage({ type: 'error', text: 'Sesión no disponible. Inicia sesión nuevamente.' });
            return;
        }

        const response = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                id: editingUser.id,
                action: 'update',
                nombre: editNombre.trim(),
                email: editEmail.trim(),
                password: editPassword,
            }),
        });

        const json = await response.json().catch(() => ({}));
        setSaving(false);

        if (!response.ok || !json.ok) {
            setMessage({ type: 'error', text: json.reason ?? 'No se pudo actualizar el usuario.' });
            return;
        }

        setEditingUser(null);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
        void loadUsers();
    };

    const handleStateAction = async (
        userId: string,
        action: 'disable' | 'enable',
    ) => {
        setSaving(true);
        const token = await withAdminToken();
        if (!token) {
            setSaving(false);
            setMessage({ type: 'error', text: 'Sesión no disponible. Inicia sesión nuevamente.' });
            return;
        }

        const response = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId, action }),
        });

        const json = await response.json().catch(() => ({}));
        setSaving(false);

        if (!response.ok || !json.ok) {
            setMessage({ type: 'error', text: json.reason ?? 'No se pudo actualizar el estado del usuario.' });
            return;
        }

        setMessage({ type: 'success', text: action === 'disable' ? 'Usuario deshabilitado.' : 'Usuario habilitado.' });
        void loadUsers();
    };

    const handleDeleteUser = async (userId: string) => {
        setSaving(true);
        const token = await withAdminToken();
        if (!token) {
            setSaving(false);
            setMessage({ type: 'error', text: 'Sesión no disponible. Inicia sesión nuevamente.' });
            return;
        }

        const response = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        const json = await response.json().catch(() => ({}));
        setSaving(false);

        if (!response.ok || !json.ok) {
            setMessage({ type: 'error', text: json.reason ?? 'No se pudo eliminar el usuario.' });
            return;
        }

        setMessage({ type: 'success', text: 'Usuario eliminado correctamente.' });
        void loadUsers();
    };

    const stats = useMemo(() => {
        const active = users.filter((user) => user.estado === 'activo').length;
        const disabled = users.filter((user) => user.estado === 'deshabilitado').length;
        const deleted = users.filter((user) => user.estado === 'eliminado').length;
        return { active, disabled, deleted };
    }, [users]);

    const visibleUsers = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((user) => {
            const statusOk = filter === 'todos' ? true : user.estado === filter;
            if (!statusOk) return false;

            if (!q) return true;
            return user.email.toLowerCase().includes(q) || user.nombre.toLowerCase().includes(q);
        });
    }, [users, filter, query]);

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Usuarios administradores</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Aquí puedes administrar cuentas del panel: ver estado, editar y crear nuevas cuando sea necesario.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Los usuarios creados aquí tendrán acceso completo al panel de administración. Crea cuentas solo cuando sea necesario.
            </div>

            {message && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <section className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard label="Activos" value={stats.active} tone="slate" />
                    <StatCard label="Deshabilitados" value={stats.disabled} tone="amber" />
                    <StatCard label="Eliminados" value={stats.deleted} tone="rose" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar por nombre o correo..."
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { key: 'todos', label: 'Todos' },
                            { key: 'activo', label: 'Activos' },
                            { key: 'deshabilitado', label: 'Deshabilitados' },
                            { key: 'eliminado', label: 'Eliminados' },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.key as typeof filter)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === item.key
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => void loadUsers()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Refrescar
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {visibleUsers.length === 0 ? (
                        <div className="px-4 py-8 text-sm text-slate-500">
                            No hay usuarios para mostrar con el filtro actual.
                        </div>
                    ) : (
                        visibleUsers.map((user) => (
                            <article key={user.id} className="px-4 py-3">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{user.nombre}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <UserStateBadge estado={user.estado} />
                                            <span className="text-[11px] text-slate-500">Creado: {formatDate(user.createdAt)}</span>
                                            <span className="text-[11px] text-slate-500">Último acceso: {formatDate(user.lastSignInAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {user.estado !== 'eliminado' && (
                                            <button
                                                type="button"
                                                onClick={() => openEdit(user)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            >
                                                <UserCog className="w-3.5 h-3.5" /> Editar
                                            </button>
                                        )}

                                        {user.estado === 'activo' && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmAction({ user, action: 'disable' })}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            >
                                                <Ban className="w-3.5 h-3.5" /> Deshabilitar
                                            </button>
                                        )}

                                        {user.estado === 'deshabilitado' && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmAction({ user, action: 'enable' })}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Habilitar
                                            </button>
                                        )}

                                        {user.estado !== 'eliminado' && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmAction({ user, action: 'delete' })}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>

            <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <button
                    type="button"
                    onClick={() => setShowCreatePanel((prev) => !prev)}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                    <div>
                        <p className="text-sm font-semibold text-slate-800">Crear nueva cuenta admin</p>
                        <p className="text-xs text-slate-500 mt-0.5">Solo ábrelo cuando necesites crear un usuario.</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showCreatePanel ? 'rotate-180' : ''}`} />
                </button>

                {showCreatePanel && (
                    <div className="space-y-4 pt-1">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre (opcional)</label>
                            <input
                                value={nombre}
                                onChange={(event) => setNombre(event.target.value)}
                                placeholder="Ej: Juan Pérez"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Correo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="usuario@empresa.cl"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Mínimo 8 caracteres"
                                        className="w-full pr-10 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirmar contraseña</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Repite la contraseña"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>
                        </div>

                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={handleCreateAdminUser}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-60"
                            >
                                {saving ? <ShieldPlus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                {saving ? 'Creando usuario...' : 'Crear usuario admin'}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-black/50" onClick={() => setEditingUser(null)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-3">
                        <h2 className="text-lg font-bold text-slate-900">Editar usuario</h2>
                        <p className="text-xs text-slate-500">{editingUser.email}</p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                            <input
                                value={editNombre}
                                onChange={(event) => setEditNombre(event.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Correo</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(event) => setEditEmail(event.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nueva contraseña (opcional)</label>
                                <div className="relative">
                                    <input
                                        type={showEditPassword ? 'text' : 'password'}
                                        value={editPassword}
                                        onChange={(event) => setEditPassword(event.target.value)}
                                        placeholder="Dejar vacío para no cambiar"
                                        className="w-full pr-10 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                        aria-label={showEditPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Confirmar nueva contraseña</label>
                                <input
                                    type={showEditPassword ? 'text' : 'password'}
                                    value={editConfirmPassword}
                                    onChange={(event) => setEditConfirmPassword(event.target.value)}
                                    placeholder="Repite la nueva contraseña"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleUpdateUser()}
                                disabled={saving}
                                className="py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for Disable / Enable / Delete */}
            {confirmAction && (() => {
                const { user: targetUser, action } = confirmAction;
                const config = {
                    disable: {
                        title: 'Deshabilitar usuario',
                        description: `El usuario ${targetUser.nombre || targetUser.email} no podrá iniciar sesión ni acceder al panel de administración hasta que sea habilitado nuevamente.`,
                        confirmLabel: 'Sí, deshabilitar',
                        iconBg: 'bg-amber-100',
                        iconColor: 'text-amber-700',
                        Icon: Ban,
                        btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
                    },
                    enable: {
                        title: 'Habilitar usuario',
                        description: `El usuario ${targetUser.nombre || targetUser.email} recuperará el acceso completo al panel de administración y podrá iniciar sesión nuevamente.`,
                        confirmLabel: 'Sí, habilitar',
                        iconBg: 'bg-emerald-100',
                        iconColor: 'text-emerald-700',
                        Icon: CheckCircle2,
                        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                    },
                    delete: {
                        title: 'Eliminar usuario',
                        description: `El usuario ${targetUser.nombre || targetUser.email} será eliminado del sistema. No podrá acceder al panel y su cuenta quedará marcada como eliminada.`,
                        confirmLabel: 'Sí, eliminar',
                        iconBg: 'bg-red-100',
                        iconColor: 'text-red-600',
                        Icon: AlertTriangle,
                        btnClass: 'bg-red-600 hover:bg-red-700 text-white',
                    },
                } as const;

                const c = config[action];

                const handleConfirm = async () => {
                    setConfirmAction(null);
                    if (action === 'delete') {
                        await handleDeleteUser(targetUser.id);
                    } else {
                        await handleStateAction(targetUser.id, action);
                    }
                };

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                        <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`${c.iconBg} p-2.5 rounded-xl`}>
                                    <c.Icon className={`w-5 h-5 ${c.iconColor}`} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                            </div>

                            <p className="text-sm text-slate-600 mb-3">{c.description}</p>

                            <p className="text-sm font-semibold text-slate-800 mb-6 bg-slate-50 rounded-lg p-3">
                                {targetUser.email}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => void handleConfirm()}
                                    disabled={saving}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${c.btnClass}`}
                                >
                                    {c.confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('es-CL');
}

function UserStateBadge({ estado }: { estado: AdminUser['estado'] }) {
    if (estado === 'activo') {
        return <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Activo</span>;
    }

    if (estado === 'deshabilitado') {
        return <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Deshabilitado</span>;
    }

    return <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Eliminado</span>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'amber' | 'rose' }) {
    const tones = {
        slate: 'text-slate-700 bg-slate-50 border-slate-200',
        amber: 'text-slate-700 bg-slate-50 border-slate-200',
        rose: 'text-slate-700 bg-slate-50 border-slate-200',
    } as const;

    return (
        <div className={`rounded-xl border px-3 py-3 ${tones[tone]}`}>
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-xl font-extrabold mt-0.5">{value}</p>
        </div>
    );
}
