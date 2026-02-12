'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, X, ChevronDown, Settings, User } from 'lucide-react';
import Logo from '@/src/shared/ui/Logo';
import SearchBar from '@/src/features/product-search/ui/SearchBar';
import { useAuth } from '@/src/features/auth';
import { useCategories } from '@/src/features/category-management';

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { activeCategories } = useCategories();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const [mobileCatOpen, setMobileCatOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setCatDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/catalog');
    };

    const navigateTo = (path: string) => {
        router.push(path);
        setMobileMenuOpen(false);
        setCatDropdownOpen(false);
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo + Nav */}
                <div className="flex items-center gap-6">
                    <Logo size="md" showText onClick={() => navigateTo('/catalog')} />
                    <nav className="hidden lg:flex items-center gap-1">
                        <Link
                            href="/catalog"
                            className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        >
                            Catálogo
                        </Link>

                        {/* Categories dropdown */}
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all
                  ${catDropdownOpen ? 'text-orange-600 bg-orange-50' : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'}`}
                            >
                                Categorías
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {catDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-72 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <button
                                            onClick={() => navigateTo('/catalog/categories')}
                                            className="text-sm font-semibold text-orange-600 hover:underline"
                                        >
                                            Ver todas las categorías →
                                        </button>
                                    </div>
                                    {activeCategories.map((cat) => (
                                        <div key={cat.id} className="group">
                                            <button
                                                onClick={() => navigateTo(`/catalog?cat=${cat.id}`)}
                                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <span className="block">{cat.nombre}</span>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Admin link — only for admin users */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-1.5"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Search */}
                <SearchBar value={search} onChange={setSearch} />

                {/* User area */}
                <div className="flex items-center gap-3">
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {isAuthenticated ? (
                        /* Logged-in user area */
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-800 leading-none">
                                    {user?.name ?? 'Usuario'}
                                </p>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 ml-auto mt-0.5"
                                >
                                    <LogOut className="w-3 h-3" /> Cerrar Sesión
                                </button>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {user?.name?.charAt(0) ?? 'U'}
                            </div>
                        </div>
                    ) : (
                        /* Guest login button */
                        <Link
                            href="/login"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/20"
                        >
                            <User className="w-4 h-4" />
                            Iniciar Sesión
                        </Link>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        className="lg:hidden p-2 text-slate-600 hover:text-orange-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
                    <Link
                        href="/catalog"
                        className="block px-4 py-3 rounded-lg text-sm font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Catálogo
                    </Link>

                    {/* Mobile categories accordion */}
                    <div>
                        <button
                            onClick={() => setMobileCatOpen(!mobileCatOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all
                ${mobileCatOpen ? 'text-orange-600 bg-orange-50' : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'}`}
                        >
                            Categorías
                            <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {mobileCatOpen && (
                            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-orange-100 pl-3">
                                <Link
                                    href="/catalog/categories"
                                    className="block px-3 py-2 text-sm font-semibold text-orange-600"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Ver todas →
                                </Link>
                                {activeCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => navigateTo(`/catalog?cat=${cat.id}`)}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-orange-600 font-medium"
                                    >
                                        {cat.nombre}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Admin link mobile */}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Settings className="w-4 h-4" /> Admin
                        </Link>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                        {isAuthenticated ? (
                            <>
                                <div className="px-4 py-2">
                                    <p className="text-sm font-semibold text-slate-800">{user?.name ?? 'Usuario'}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg w-full"
                                >
                                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 mx-4 py-3 text-sm font-semibold bg-orange-600 text-white rounded-xl hover:bg-orange-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User className="w-4 h-4" /> Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
