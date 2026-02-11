/** Estado de disponibilidad del producto. */
export type StockStatus = 'EN STOCK' | 'A PEDIDO' | 'DISPONIBLE' | 'AGOTADO';

/** Rol del usuario en la plataforma. */
export type UserRole = 'admin' | 'viewer';

/** Datos de sesión del usuario autenticado. */
export interface AuthUser {
    name: string;
    email: string;
    role: UserRole;
}
