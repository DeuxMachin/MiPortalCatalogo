'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth';
import Header from '@/src/widgets/header/ui/Header';
import Footer from '@/src/widgets/footer/ui/Footer';

export default function CatalogLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // --- Medida de seguridad: protección de ruta ---
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
            <Footer />
        </div>
    );
}
