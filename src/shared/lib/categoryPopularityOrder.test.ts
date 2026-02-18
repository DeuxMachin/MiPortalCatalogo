import { describe, expect, it } from 'vitest';
import {
    compareByPopularityCategoryName,
    getCategoryPopularityRank,
} from '@/src/shared/lib/categoryPopularityOrder';

describe('categoryPopularityOrder', () => {
    it('asigna menor rank a categorías más prioritarias', () => {
        const rankFundaciones = getCategoryPopularityRank('FUNDACIONES');
        const rankHerramientas = getCategoryPopularityRank('HERRAMIENTAS Y ACCESORIOS');

        expect(rankFundaciones).toBeLessThan(rankHerramientas);
    });

    it('normaliza tildes y guiones en el ranking', () => {
        const rankExpected = getCategoryPopularityRank('EIFS – ENVOLVENTE TÉRMICO');
        const rankVariant = getCategoryPopularityRank('eifs - envolvente termico');

        expect(rankVariant).toBe(rankExpected);
    });

    it('ordena por nombre cuando ambas categorías no tienen rank', () => {
        const result = compareByPopularityCategoryName('Zeta', 'Alfa');
        expect(result).toBeGreaterThan(0);
    });

    it('prioriza el orden de negocio solicitado para categorías principales', () => {
        const categories = [
            'TERMINACIONES',
            'FERRETERIA',
            'FUNDACIONES',
            'OBRA GRUESA',
            'IMPERMEABILIZANTES',
            'EIFS ENVOLVENTE TERMICO',
        ];

        const sorted = [...categories].sort((a, b) => compareByPopularityCategoryName(a, b));

        expect(sorted).toEqual([
            'FUNDACIONES',
            'OBRA GRUESA',
            'IMPERMEABILIZANTES',
            'EIFS ENVOLVENTE TERMICO',
            'TERMINACIONES',
            'FERRETERIA',
        ]);
    });
});
