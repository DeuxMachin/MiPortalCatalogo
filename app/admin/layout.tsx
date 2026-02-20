'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/features/auth';
import Logo from '@/src/shared/ui/Logo';
import { Package, LogOut, ArrowLeft, Layers, History, UserPlus, Menu, X } from 'lucide-react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* Close mobile menu on route change */
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);
    /* eslint-enable react-hooks/set-state-in-effect */

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
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 text-slate-600 hover:text-orange-600 transition-colors"
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        {user?.name?.charAt(0) ?? 'U'}
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Drawer panel */}
                    <aside className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-[slideInRight_0.2s_ease-out]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">Panel Admin</p>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Cerrar menú"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                            {ADMIN_NAV.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isActive
                                            ? 'text-orange-600 bg-orange-50'
                                            : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Actions */}
                        <div className="p-3 space-y-1 border-t border-gray-100">
                            <button
                                onClick={() => { setMobileMenuOpen(false); router.push('/catalog'); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
                            </button>
                            <button
                                onClick={() => { setMobileMenuOpen(false); void handleLogout(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        </div>

                        {/* User info */}
                        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {user?.name?.charAt(0) ?? 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Content */}
            <main className="flex-1 p-4 lg:p-8 lg:overflow-y-auto lg:min-h-0">{children}</main>
        </div>
    );
}
