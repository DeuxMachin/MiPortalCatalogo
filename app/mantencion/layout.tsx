import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'MiPortalVentas — En Mantención',
    description: 'Estamos realizando mejoras. Volveremos pronto.',
};

export default function MantencionLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
