import { describe, expect, it } from 'vitest';
import { calculatePopularityScore } from '@/src/shared/lib/popularityScore';

describe('calculatePopularityScore', () => {
    it('usa pesos por defecto (1,2,3)', () => {
        const score = calculatePopularityScore({ views30d: 10, clicks30d: 5, favorites30d: 2 });
        expect(score).toBe(26);
    });

    it('admite pesos configurables', () => {
        const score = calculatePopularityScore(
            { views30d: 10, clicks30d: 5, favorites30d: 2 },
            { viewWeight: 1, clickWeight: 4, favoriteWeight: 5 },
        );
        expect(score).toBe(40);
    });
});
