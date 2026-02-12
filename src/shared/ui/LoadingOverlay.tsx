'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoadingOverlayProps {
    /** Whether to show the loading overlay */
    visible: boolean;
    /** Optional message below the animation */
    message?: string;
}

/**
 * Full-screen loading overlay with blur backdrop and Lottie animation.
 * Used during initial page load and lazy content loading.
 */
export default function LoadingOverlay({ visible, message = 'Cargando catálogo...' }: LoadingOverlayProps) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md transition-opacity duration-500">
            <div className="flex flex-col items-center gap-4">
                <div className="w-48 h-48">
                    <DotLottieReact
                        src="https://lottie.host/55ded4de-95f5-4bc9-a039-ddd71ee56ffd/NipXT6TdA1.lottie"
                        loop
                        autoplay
                    />
                </div>
                <p className="text-sm font-semibold text-slate-500 animate-pulse">
                    {message}
                </p>
            </div>
        </div>
    );
}
