'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/features/auth';
import Logo from '@/src/shared/ui/Logo';
import { Package, LogOut, ArrowLeft, Layers, History, UserPlus } from 'lucide-react';

interface AdminNavItem {
    label: string;
    href: string;
    icon: typeof Package;
}

const ADMIN_NAV: AdminNavItem[] = [
    { label: 'Categorías', href: '/admin/categories', icon: Layers },
    { label: 'Productos', href: '/admin/products', icon: Package },
    { label: 'Historial', href: '/admin/history', icon: History },
    { label: 'Usuarios', href: '/admin/users', icon: UserPlus },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, isInitialising, user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isInitialising && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isInitialising, router]);

    if (isInitialising) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-sm font-semibold text-slate-500">Cargando sesión...</div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 flex flex-col lg:flex-row">
            {/* Sidebar — desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                {/* Logo */}
                <div className="p-5 border-b border-gray-100">
                    <Logo size="md" showText onClick={() => router.push('/catalog')} />
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Panel de Administración</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {ADMIN_NAV.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const cls = `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                                ? 'text-orange-600 bg-orange-50'
                                : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'}`;
                        const inner = (
                            <>
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </>
                        );
                        return <Link key={item.label} href={item.href} className={cls}>{inner}</Link>;
                    })}
                </nav>

                {/* Back + Logout */}
                <div className="p-3 space-y-1 border-t border-gray-100">
                    <button
                        onClick={() => router.push('/catalog')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>

                {/* User */}
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <Logo size="sm" showText onClick={() => router.push('/catalog')} />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push('/catalog')}
                        className="p-2 text-slate-500 hover:text-orange-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {user?.name?.charAt(0) ?? 'U'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto lg:min-h-0">{children}</main>
        </div>
    );
}
