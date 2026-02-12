'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface ProductGalleryProps {
    images: string[];
    title: string;
    stockLabel?: string;
}

export default function ProductGallery({ images, title, stockLabel }: ProductGalleryProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [hoverZoom, setHoverZoom] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [open, setOpen] = useState(false);

    const activeSrc = images[activeIdx];
    const safeImages = useMemo(() => (images ?? []).filter(Boolean).slice(0, 4), [images]);

    return (
        <div className="space-y-4">
            {/* Imagen principal */}
            <div
                className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-100 group relative shadow-xl cursor-zoom-in"
                onMouseEnter={() => setHoverZoom(true)}
                onMouseLeave={() => setHoverZoom(false)}
                onMouseMove={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                }}
                onClick={() => setOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
                aria-label="Expandir imagen"
            >
                <img
                    src={activeSrc}
                    alt={`${title} - imagen ${activeIdx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
                    style={{
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: hoverZoom ? 'scale(1.8)' : 'scale(1)',
                    }}
                    loading="eager"
                />
                {stockLabel && (
                    <div className="absolute top-5 left-5">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            {stockLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* Miniaturas */}
            <div className="grid grid-cols-4 gap-3">
                {safeImages.map((img, i) => (
                    <button
                        key={i}
                        className={`aspect-square rounded-2xl overflow-hidden border-3 transition-all cursor-pointer shadow-sm relative
              ${i === activeIdx
                                ? 'border-orange-500 ring-2 ring-orange-500/20'
                                : 'border-white hover:border-orange-200'}`}
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Ver imagen ${i + 1}`}
                    >
                        <img
                            src={img}
                            alt={`${title} miniatura ${i + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                        />
                    </button>
                ))}
            </div>

            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="relative max-w-5xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute -top-10 right-0 text-white/90 hover:text-white flex items-center gap-2 text-sm font-semibold"
                        >
                            <X className="w-5 h-5" /> Cerrar
                        </button>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative w-full aspect-[4/3] bg-black">
                                <img
                                    src={activeSrc}
                                    alt={`${title} - imagen expandida ${activeIdx + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    loading="eager"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
