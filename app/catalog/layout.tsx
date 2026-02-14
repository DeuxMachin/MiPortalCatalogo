'use client';

import type { ReactNode } from 'react';
import Header from '@/src/widgets/header/ui/Header';
import Footer from '@/src/widgets/footer/ui/Footer';

export default function CatalogLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
        </div>
    );
}
