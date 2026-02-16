'use client';

import { useEffect } from 'react';
import ErrorState from '@/src/shared/ui/ErrorState';
import { reportError } from '@/src/shared/lib/errorTracking';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        void reportError({
            error,
            severity: 'error',
            source: 'client',
            route: '/admin',
            action: 'admin_boundary',
            context: { digest: error.digest },
            critical: true,
        });
    }, [error]);

    return (
        <ErrorState
            variant="unexpected"
            message="No pudimos cargar el módulo administrativo."
            onRetry={reset}
        />
    );
}
