import { describe, expect, it } from 'vitest';
import {
    classifyHttpStatus,
    severityFromContext,
    shouldReportUnexpectedError,
} from '@/src/shared/lib/errorPolicy';

describe('errorPolicy', () => {
    it('trata 404 como caso esperado (no reportable)', () => {
        expect(classifyHttpStatus(404)).toBeNull();
        expect(shouldReportUnexpectedError({ status: 404 })).toBe(false);
    });

    it('marca 500 como error reportable', () => {
        expect(classifyHttpStatus(500)).toBe('error');
        expect(shouldReportUnexpectedError({ status: 500 })).toBe(true);
    });

    it('eleva a fatal cuando la app queda rota', () => {
        expect(severityFromContext({ appBroken: true })).toBe('fatal');
    });

    it('eleva timeout repetido como error inesperado', () => {
        expect(shouldReportUnexpectedError({ timeoutCount: 3 })).toBe(true);
    });
});
