'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/features/auth';
import Logo from '@/src/shared/ui/Logo';
import { Package, LayoutDashboard, LogOut, ArrowLeft } from 'lucide-react';

interface AdminNavItem {
    label: string;
    href: string;
    icon: typeof Package;
    active?: boolean;
    disabled?: boolean;
}

const ADMIN_NAV: AdminNavItem[] = [
    { label: 'Productos', href: '/admin', icon: Package, active: true },
    { label: 'Categorías', href: '#', icon: LayoutDashboard, disabled: true },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            {/* Sidebar — desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
                {/* Logo */}
                <div className="p-5 border-b border-gray-100">
                    <Logo size="md" showText onClick={() => router.push('/catalog')} />
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Panel de Administración</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {ADMIN_NAV.map((item) => {
                        const Icon = item.icon;
                        const cls = `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                  ${item.disabled
                                ? 'text-slate-300 cursor-not-allowed'
                                : item.active
                                    ? 'text-orange-600 bg-orange-50'
                                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'}`;
                        const inner = (
                            <>
                                <Icon className="w-4 h-4" />
                                {item.label}
                                {item.disabled && (
                                    <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                                        Pronto
                                    </span>
                                )}
                            </>
                        );
                        return item.disabled ? (
                            <span key={item.label} className={cls}>{inner}</span>
                        ) : (
                            <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
                        );
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

            {/* Tab bar mobile */}
            <div className="lg:hidden bg-white border-b border-gray-100 px-4 flex gap-1">
                {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const cls = `flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all
                ${item.disabled
                            ? 'text-slate-300 border-transparent cursor-not-allowed'
                            : item.active
                                ? 'text-orange-600 border-orange-600'
                                : 'text-slate-500 border-transparent hover:text-orange-600'}`;
                    const inner = (<><Icon className="w-4 h-4" />{item.label}</>);
                    return item.disabled ? (
                        <span key={item.label} className={cls}>{inner}</span>
                    ) : (
                        <Link key={item.label} href={item.href} className={cls}>{inner}</Link>
                    );
                })}
            </div>

            {/* Content */}
            <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
    );
}
