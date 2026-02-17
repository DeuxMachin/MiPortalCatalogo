import Link from 'next/link';
import { ArrowRight, LayoutGrid, Layers, ShieldCheck } from 'lucide-react';
import Logo from '@/src/shared/ui/Logo';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/src/shared/config/constants';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 mt-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <Logo size="md" showText={false} />
                        <p className="font-bold text-white text-lg">{APP_NAME}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {APP_TAGLINE}. Información técnica clara y actualizada para productos de construcción.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white mb-4">Explorar</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/catalog" className="inline-flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors">
                                    <LayoutGrid className="w-4 h-4" /> Catálogo
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog/categories" className="inline-flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors">
                                    <Layers className="w-4 h-4" /> Categorías
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="inline-flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors">
                                    <ShieldCheck className="w-4 h-4" /> Panel administrador
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white mb-4">Acceso rápido</h4>
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                        >
                            Ir al catálogo <ArrowRight className="w-4 h-4" />
                        </Link>
                        <p className="text-xs text-slate-500 mt-4">
                            Plataforma informativa sin venta directa en línea.
                        </p>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
                    </p>
                    <p className="text-xs font-semibold text-slate-500">{APP_VERSION}</p>
                </div>
            </div>
        </footer>
    );
}
