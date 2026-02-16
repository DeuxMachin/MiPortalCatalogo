export type ErrorSeverity = 'warning' | 'error' | 'fatal';

export function classifyHttpStatus(status: number): ErrorSeverity | null {
    if (status === 404) return null;
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return null;
}

export function shouldReportUnexpectedError(params: {
    status?: number;
    isUnhandledException?: boolean;
    timeoutCount?: number;
}): boolean {
    if (params.isUnhandledException) return true;
    if (typeof params.status === 'number') {
        if (params.status >= 500) return true;
        if (params.status === 404) return false;
    }
    if ((params.timeoutCount ?? 0) >= 3) return true;
    return false;
}

export function severityFromContext(params: {
    status?: number;
    appBroken?: boolean;
    actionFailed?: boolean;
}): ErrorSeverity {
    if (params.appBroken) return 'fatal';
    if (typeof params.status === 'number' && params.status >= 500) return 'error';
    if (params.actionFailed) return 'error';
    return 'warning';
}
