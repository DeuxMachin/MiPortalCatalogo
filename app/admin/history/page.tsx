'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

type AuditRow = {
    id: string;
    accion: 'CREAR' | 'ELIMINAR';
    tabla: string;
    registro_id: string;
    descripcion: string | null;
    usuario_id: string;
    usuario_email: string | null;
    creado_en: string;
};

export default function AdminHistoryPage() {
    const [items, setItems] = useState<AuditRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError(null);

        const sb = getSupabaseBrowserClient();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
            setLoading(false);
            setError('Sesión no disponible. Inicia sesión nuevamente.');
            return;
        }

        const response = await fetch('/api/admin/history?limit=120', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json.ok) {
            setLoading(false);
            setError(json.reason ?? 'No se pudo cargar el historial.');
            return;
        }

        setItems((json.items ?? []) as AuditRow[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return items;

        return items.filter((item) => (
            item.tabla.toLowerCase().includes(normalized)
            || item.registro_id.toLowerCase().includes(normalized)
            || (item.usuario_email ?? '').toLowerCase().includes(normalized)
            || (item.descripcion ?? '').toLowerCase().includes(normalized)
            || item.accion.toLowerCase().includes(normalized)
        ));
    }, [items, query]);

    return (
        <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Historial de actividad</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Vista solo lectura para revisar quién hizo cambios y cuándo.
                    </p>
                </div>
                <button
                    onClick={() => void loadHistory()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
                >
                    <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Consejo: usa el buscador para encontrar acciones por usuario, tabla o descripción.
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por tabla, acción, email o descripción..."
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 border border-red-200 text-red-700">
                    {error}
                </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-slate-700">
                    <History className="w-4 h-4" />
                    <span className="text-sm font-semibold">{filtered.length} registro{filtered.length === 1 ? '' : 's'}</span>
                </div>

                {loading ? (
                    <div className="px-4 py-10 text-sm text-slate-500">Cargando historial...</div>
                ) : filtered.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-slate-500">No hay registros para mostrar.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((item) => (
                            <article key={item.id} className="px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                                            {item.accion}
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                            {item.tabla}
                                        </span>
                                    </div>
                                    <time className="text-xs text-slate-500">
                                        {new Date(item.creado_en).toLocaleString('es-CL')}
                                    </time>
                                </div>

                                <p className="text-sm text-slate-800 mt-2">
                                    <span className="font-semibold text-slate-600">Qué pasó:</span> {item.descripcion ?? 'Sin descripción'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 break-all">
                                    <span className="font-semibold">Registro:</span> {item.registro_id}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 break-all">
                                    <span className="font-semibold">Usuario:</span> {item.usuario_email ?? item.usuario_id}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
