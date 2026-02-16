'use client';

import { useEffect } from 'react';
import ErrorState from '@/src/shared/ui/ErrorState';
import { reportError } from '@/src/shared/lib/errorTracking';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        void reportError({
            error,
            severity: 'error',
            source: 'client',
            route: 'app/error',
            action: 'render_error_boundary',
            context: { digest: error.digest },
            critical: true,
        });
    }, [error]);

    return (
        <ErrorState
            variant="unexpected"
            message="Hubo un problema al renderizar la página."
            onRetry={reset}
        />
    );
}
