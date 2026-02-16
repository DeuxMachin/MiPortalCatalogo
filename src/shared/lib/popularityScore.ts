export interface PopularityWeights {
    viewWeight: number;
    clickWeight: number;
    favoriteWeight: number;
}

export interface PopularitySignals {
    views30d: number;
    clicks30d: number;
    favorites30d: number;
}

export function calculatePopularityScore(
    signals: PopularitySignals,
    weights: PopularityWeights = {
        viewWeight: 1,
        clickWeight: 2,
        favoriteWeight: 3,
    },
): number {
    return (
        signals.views30d * weights.viewWeight
        + signals.clicks30d * weights.clickWeight
        + signals.favorites30d * weights.favoriteWeight
    );
}
