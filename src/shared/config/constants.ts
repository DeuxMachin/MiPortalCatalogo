// --- Branding ---
export const APP_NAME = 'MiPortalVentas';
export const APP_LOGO_INITIALS = 'MP';
export const APP_TAGLINE = 'Catálogo Digital de Productos de Construcción';
export const APP_VERSION = 'V2.1.0';

// --- Navigation ---
export const NAV_LINKS = [
    { label: 'Materiales', href: '/catalog?cat=materiales' },
    { label: 'Herramientas', href: '/catalog?cat=herramientas' },
    { label: 'Seguridad', href: '/catalog?cat=seguridad' },
] as const;

// --- Auth ---
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_SECONDS = 60;

// --- Catalog ---
export const PRODUCTS_PER_PAGE = 12;
export const MAX_PRODUCT_IMAGES = 4;
