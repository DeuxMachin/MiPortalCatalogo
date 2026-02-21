import { NextResponse, type NextRequest } from 'next/server';

// ┌─────────────────────────────────────────────────┐
// │  MODO MANTENCIÓN                                │
// │  Cambiar a `true` para activar mantención.     │
// │  Cambiar a `false` para desactivar.            │
// └─────────────────────────────────────────────────┘
const MAINTENANCE_MODE = true;

export function middleware(request: NextRequest) {
    if (!MAINTENANCE_MODE) return NextResponse.next();

    const { pathname } = request.nextUrl;

    // Permitir acceso a la propia página de mantención y recursos estáticos
    if (
        pathname === '/mantencion' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname === '/favicon.ico' ||
        pathname === '/logo.webp'
    ) {
        return NextResponse.next();
    }

    // Redirigir todo lo demás a /mantencion
    const url = request.nextUrl.clone();
    url.pathname = '/mantencion';
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image).*)'],
};
