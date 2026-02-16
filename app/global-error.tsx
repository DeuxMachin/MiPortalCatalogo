'use client';

import { useEffect } from 'react';
import ErrorState from '@/src/shared/ui/ErrorState';
import { reportError } from '@/src/shared/lib/errorTracking';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        void reportError({
            error,
            severity: 'fatal',
            source: 'client',
            route: 'app/global-error',
            action: 'render_global_error_boundary',
            context: { digest: error.digest },
            critical: true,
        });
    }, [error]);

    return (
        <html lang="es">
            <body>
                <ErrorState
                    variant="unexpected"
                    title="Error crítico"
                    message="La aplicación no pudo continuar."
                    onRetry={reset}
                />
            </body>
        </html>
    );
}
