import { ArrowRight } from 'lucide-react';
import Logo from '@/src/shared/ui/Logo';
import { APP_NAME } from '@/src/shared/config/constants';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-14 mt-12">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Brand */}
                <div className="space-y-4">
                    <Logo size="md" showText={false} />
                    <p className="font-bold text-white text-lg">{APP_NAME}</p>
                    <p className="text-sm leading-relaxed">
                        Catálogo digital de materiales y productos de construcción. Información clara, detallada
                        y actualizada para tu proyecto.
                    </p>
                </div>

                {/* Categorías */}
                <div>
                    <h4 className="text-sm font-bold text-white mb-5">
                        Categorías
                    </h4>
                    <ul className="text-sm space-y-3 font-medium">
                        {['Acero y Refuerzo', 'Hormigones y Mezclas', 'Maderas de Obra', 'Protección Personal'].map((item) => (
                            <li key={item} className="hover:text-orange-500 cursor-pointer transition-colors">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Soporte */}
                <div>
                    <h4 className="text-sm font-bold text-white mb-5">
                        Soporte Técnico
                    </h4>
                    <ul className="text-sm space-y-3 font-medium">
                        {['Fichas de Seguridad', 'Cálculo de Materiales', 'Logística', 'Contacto'].map((item) => (
                            <li key={item} className="hover:text-orange-500 cursor-pointer transition-colors">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className="text-sm font-bold text-white mb-5">
                        Boletín Técnico
                    </h4>
                    <p className="text-sm mb-4">Recibe actualizaciones sobre nuevos productos y materiales.</p>
                    <div className="flex">
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            className="bg-slate-800 border-none rounded-l-xl px-4 py-2.5 text-sm w-full focus:ring-1 focus:ring-orange-500 placeholder:text-slate-500"
                        />
                        <button
                            className="bg-orange-600 text-white px-4 py-2.5 rounded-r-xl hover:bg-orange-700 transition-colors"
                            aria-label="Suscribirse"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
                </p>
                <p className="text-xs font-semibold text-slate-600">v1.0.0</p>
            </div>
        </footer>
    );
}
