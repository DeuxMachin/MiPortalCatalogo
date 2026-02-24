/** Estado de disponibilidad del producto. */
export type StockStatus = 'EN STOCK' | 'SIN STOCK' | 'A PEDIDO' | 'BAJO STOCK';

/** Rol del usuario en la plataforma. */
export type UserRole = 'admin' | 'owner' | 'viewer';

/** Datos de sesión del usuario autenticado. */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}
