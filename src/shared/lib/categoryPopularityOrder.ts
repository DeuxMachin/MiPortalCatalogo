export const POPULAR_CATEGORY_ORDER = [
    'SEPARADORES PLÁSTICOS Y HORMIGÓN',
    'FUNDACIONES',
    'PAVIMENTOS',
    'CURADORES Y RETARDANTES DE FRAGUADO',
    'EPÓXICOS',
    'DESMOLDANTES',
    'IMPERMEABILIZANTES',
    'PROMOTORES DE ADHERENCIA',
    'MORTEROS DE REPARACIÓN',
    'NIVELANTES Y AUTONIVELANTES',
    'MONTAJES Y ANCLAJES',
    'MAQUILLAJES Y PINTURAS',
    'EIFS – ENVOLVENTE TÉRMICO',
    'PEGAMENTO PARA PISO',
    'PEGAMENTOS PARA PIEDRA',
    'SELLOS, SILICONAS Y POLIURETANOS',
    'FRAGÜES',
    'FERRETERÍA',
    'HERRAMIENTAS Y ACCESORIOS',
    'POSVENTA',
    'ASEO, LIMPIEZA Y DESINFECCIÓN',
] as const;

function normalizeCategoryName(name: string): string {
    return name
        .normalize('NFD')
        // remove accents/diacritics
        .replace(/\p{Diacritic}/gu, '')
        // unify dashes
        .replace(/[–—-]/g, ' ')
        // remove punctuation
        .replace(/[.,:;()\[\]{}'"´`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

const ORDER_RANK: Map<string, number> = new Map(
    POPULAR_CATEGORY_ORDER.map((name, idx) => [normalizeCategoryName(name), idx]),
);

export function getCategoryPopularityRank(categoryName?: string | null): number {
    if (!categoryName) return Number.POSITIVE_INFINITY;
    const rank = ORDER_RANK.get(normalizeCategoryName(categoryName));
    return rank ?? Number.POSITIVE_INFINITY;
}

export function compareByPopularityCategoryName(aName?: string | null, bName?: string | null): number {
    const aRank = getCategoryPopularityRank(aName);
    const bRank = getCategoryPopularityRank(bName);
    if (aRank !== bRank) return aRank - bRank;

    // Both unranked or same rank: fallback to locale compare for stability
    return String(aName ?? '').localeCompare(String(bName ?? ''), 'es', { sensitivity: 'base' });
}
