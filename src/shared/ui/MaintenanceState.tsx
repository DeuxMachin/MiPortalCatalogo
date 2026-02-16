'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Link from 'next/link';

const MAINTENANCE_LOTTIE = 'https://lottie.host/7e991f6a-e984-40fc-a600-43e127a622fb/E9VMe80o2b.lottie';

export default function MaintenanceState() {
    return (
        <section className="min-h-[70vh] w-full flex items-center justify-center px-4 py-10">
            <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
                <div className="w-full max-w-md mx-auto mb-6">
                    <DotLottieReact
                        src={MAINTENANCE_LOTTIE}
                        loop
                        autoplay
                        style={{ width: '100%', height: '260px' }}
                    />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Estamos trabajando en esta parte de la página web
                </h1>
                <p className="text-slate-600 mb-6">
                    Estamos mejorando esta sección para entregarte una mejor experiencia.
                </p>

                <Link
                    href="/catalog"
                    className="inline-flex px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors"
                >
                    Volver al catálogo
                </Link>
            </div>
        </section>
    );
}
