'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';

type ErrorVariant = 'not-found' | 'unexpected';

interface ErrorStateProps {
    variant: ErrorVariant;
    title?: string;
    message?: string;
    onRetry?: () => void;
}

const ERROR_LOTTIE = 'https://lottie.host/b7fae9bf-0295-4e88-8de1-ced18ca8836f/ZRNQkP7Zfw.lottie';

export default function ErrorState({ variant, title, message, onRetry }: ErrorStateProps) {
    const isNotFound = variant === 'not-found';

    const defaultTitle = isNotFound ? 'No encontramos esta página' : 'Ocurrió un error inesperado';
    const defaultMessage = isNotFound
        ? 'La ruta solicitada no existe o fue movida.'
        : 'Estamos teniendo un problema temporal. Intenta nuevamente.';

    return (
        <section className="min-h-[70vh] w-full flex items-center justify-center px-4 py-8">
            <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
                <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-6 p-2">
                    <DotLottieReact
                        src={ERROR_LOTTIE}
                        loop
                        autoplay
                        style={{ width: '100%', height: '260px' }}
                    />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title ?? defaultTitle}</h1>
                <p className="text-slate-600 mb-6">{message ?? defaultMessage}</p>

                <div className="flex items-center justify-center gap-3">
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors"
                        >
                            Reintentar
                        </button>
                    )}
                    <Link
                        href="/catalog"
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Ir al catálogo
                    </Link>
                </div>
            </div>
        </section>
    );
}
