'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, History, RefreshCw, Search } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

const PAGE_SIZE = 30;

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
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page on search change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setCurrentPage(1); }, [query]);

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

        const response = await fetch('/api/admin/history?limit=500', {
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
        setCurrentPage(1);
        setLoading(false);
    }, []);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);
    /* eslint-enable react-hooks/set-state-in-effect */

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

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
                Aquí puedes ver un registro de todas las acciones realizadas en el panel.
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar por acción, sección, usuario o detalle..."
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
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 text-slate-700">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                            {filtered.length} registro{filtered.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    {totalPages > 1 && (
                        <span className="text-xs text-slate-400 font-semibold">
                            Página {safePage} de {totalPages}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="px-4 py-10 text-sm text-slate-500">Cargando historial...</div>
                ) : filtered.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-slate-500">No hay registros para mostrar.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {paginated.map((item) => (
                            <article key={item.id} className="px-4 py-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                                            {item.accion}
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                            {item.tabla === 'productos' ? 'Productos' : item.tabla === 'categorias' ? 'Categorías' : item.tabla}
                                        </span>
                                    </div>
                                    <time className="text-xs text-slate-500">
                                        {new Date(item.creado_en).toLocaleString('es-CL')}
                                    </time>
                                </div>

                                <p className="text-sm text-slate-800 mt-2">
                                    <span className="font-semibold text-slate-600">Detalle:</span> {item.descripcion ?? 'Sin información adicional'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 break-all">
                                    <span className="font-semibold">Referencia:</span> {item.registro_id}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 break-all">
                                    <span className="font-semibold">Usuario:</span> {item.usuario_email ?? item.usuario_id}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    <span className="text-sm font-semibold text-slate-500">
                        Página <span className="text-slate-900">{safePage}</span> de <span className="text-slate-900">{totalPages}</span>
                    </span>

                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
