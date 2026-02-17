'use client';

import { useMemo, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ProductGalleryProps {
    images: string[];
    title: string;
    stockLabel?: string;
}

export default function ProductGallery({ images, title, stockLabel }: ProductGalleryProps) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [hoverZoom, setHoverZoom] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [open, setOpen] = useState(false);
    const LENS_SIZE = 180;
    const LENS_ZOOM = 2.4;

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
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setZoomPos({
                        x: Math.max(0, Math.min(rect.width, x)),
                        y: Math.max(0, Math.min(rect.height, y)),
                        width: rect.width,
                        height: rect.height,
                    });
                }}
                onDoubleClick={() => setOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
                aria-label="Expandir imagen"
            >
                <img
                    src={activeSrc}
                    alt={`${title} - imagen ${activeIdx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                />

                {hoverZoom && !!activeSrc && (
                    <div
                        className="pointer-events-none absolute rounded-full border-2 border-white/90 shadow-2xl hidden md:block"
                        style={{
                            width: `${LENS_SIZE}px`,
                            height: `${LENS_SIZE}px`,
                            left: `${zoomPos.x - LENS_SIZE / 2}px`,
                            top: `${zoomPos.y - LENS_SIZE / 2}px`,
                            backgroundImage: `url(${activeSrc})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: `${zoomPos.width * LENS_ZOOM}px ${zoomPos.height * LENS_ZOOM}px`,
                            backgroundPosition: `${-(zoomPos.x * LENS_ZOOM - LENS_SIZE / 2)}px ${-(zoomPos.y * LENS_ZOOM - LENS_SIZE / 2)}px`,
                        }}
                    />
                )}
                {stockLabel && (
                    <div className="absolute top-5 left-5">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            {stockLabel}
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    className="absolute top-5 right-5 bg-black/55 hover:bg-black/70 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-sm inline-flex items-center gap-2 transition-colors"
                    aria-label="Expandir imagen"
                    title="Expandir imagen"
                >
                    <Maximize2 className="w-4 h-4" /> Expandir
                </button>
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
