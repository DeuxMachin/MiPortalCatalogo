'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import ErrorState from '@/src/shared/ui/ErrorState';

export default function ErrorLabPage() {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    const [showErrorCard, setShowErrorCard] = useState(false);
    const [throwBoundaryError, setThrowBoundaryError] = useState(false);

    if (throwBoundaryError) {
        throw new Error('DEBUG_ERROR_LAB: error forzado para probar cartel y tracking');
    }

    if (showErrorCard) {
        return (
            <ErrorState
                variant="unexpected"
                title="Cartel de error de prueba"
                message="Este es un debug visual del cartel de error con botón de reintento."
                onRetry={() => setShowErrorCard(false)}
            />
        );
    }

    return (
        <section className="min-h-[70vh] w-full flex items-center justify-center px-4 py-10">
            <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Laboratorio de errores</h1>
                <p className="text-slate-600 mb-6">
                    Usa estas acciones para validar el cartel de error y la captura por error boundary.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => setShowErrorCard(true)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Ver cartel de error
                    </button>
                    <button
                        type="button"
                        onClick={() => setThrowBoundaryError(true)}
                        className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors"
                    >
                        Forzar error boundary
                    </button>
                </div>
            </div>
        </section>
    );
}
