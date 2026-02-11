/**
 * Formatea un precio numérico al formato chileno (CLP).
 * @example formatPrice(12450) → "12.450"
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL').format(price);
}

/**
 * Genera un slug URL-safe a partir de un string.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
