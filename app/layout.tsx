import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/src/features/auth';
import { ProductProvider } from '@/src/features/product-management';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MiPortalVentas — Catálogo de Productos de Construcción',
  description:
    'Catálogo digital de materiales y productos de construcción. Explora productos con especificaciones técnicas, precios e imágenes detalladas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider><ProductProvider>{children}</ProductProvider></AuthProvider>
      </body>
    </html>
  );
}
