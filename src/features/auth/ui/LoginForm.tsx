'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, Package, BarChart3 } from 'lucide-react';
import { useAuth } from '@/src/features/auth/model/AuthContext';
import { APP_NAME } from '@/src/shared/config/constants';

export default function LoginForm() {
    const { login, isLoading, error } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-950">
            {/* ====== PANEL IZQUIERDO — Branding ====== */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12">
                {/* Fondo degradado */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500" />
                {/* Overlay patrón */}
                <div className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                {/* Círculos decorativos */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl" />

                {/* Logo superior */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white text-orange-600 w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                            MP
                        </div>
                        <span className="text-white font-black text-2xl tracking-tight">{APP_NAME}</span>
                    </div>
                </div>

                {/* Contenido central */}
                <div className="relative z-10 space-y-8 max-w-md">
                    <h2 className="text-white text-5xl font-black leading-[1.1] tracking-tight">
                        Tu catálogo de{' '}
                        <span className="text-amber-200">construcción</span>{' '}
                        en un solo lugar
                    </h2>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Gestiona productos, categorías e imágenes desde un panel centralizado.
                        Información clara para tus clientes, control total para tu equipo.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-col gap-4 pt-4">
                        {[
                            { icon: <Package className="w-5 h-5" />, text: 'Catálogo de hasta 100+ productos' },
                            { icon: <BarChart3 className="w-5 h-5" />, text: 'Fichas técnicas detalladas' },
                            { icon: <ShieldCheck className="w-5 h-5" />, text: 'Panel de administración seguro' },
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-4 text-white/90">
                                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    {feat.icon}
                                </div>
                                <span className="text-sm font-semibold">{feat.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} {APP_NAME}
                    </span>
                    <span className="text-white/30 text-[10px] font-black tracking-widest uppercase">
                        v1.0.0
                    </span>
                </div>
            </div>

            {/* ====== PANEL DERECHO — Formulario ====== */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Gradiente decorativo sutil */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="w-full max-w-md relative z-10">
                    {/* Logo móvil */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="bg-orange-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                            MP
                        </div>
                        <span className="text-white font-black text-xl tracking-tight">{APP_NAME}</span>
                    </div>

                    {/* Encabezado */}
                    <div className="mb-10">
                        <h1 className="text-white text-3xl font-black tracking-tight mb-2">
                            Bienvenido de vuelta
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Ingresa tus credenciales para acceder al panel de gestión.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail className="w-[18px] h-[18px] text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl py-3.5 pl-12 pr-4
                    text-white text-sm font-medium placeholder:text-slate-600
                    focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30
                    hover:border-slate-700 transition-all outline-none"
                                    placeholder="usuario@correo.cl"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-[18px] h-[18px] text-slate-600 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl py-3.5 pl-12 pr-12
                    text-white text-sm font-medium placeholder:text-slate-600
                    focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30
                    hover:border-slate-700 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl
                text-sm tracking-wide transition-all active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-orange-600/25 hover:shadow-orange-500/30
                flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Iniciar Sesión <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to catalog */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/catalog"
                            className="text-slate-500 hover:text-orange-400 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver al catálogo
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
