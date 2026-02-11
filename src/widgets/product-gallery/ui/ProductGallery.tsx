'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
    images: string[];
    title: string;
    stockLabel?: string;
}

export default function ProductGallery({ images, title, stockLabel }: ProductGalleryProps) {
    const [activeIdx, setActiveIdx] = useState(0);

    return (
        <div className="space-y-4">
            {/* Imagen principal */}
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-100 group relative shadow-xl">
                <Image
                    src={images[activeIdx]}
                    alt={`${title} - imagen ${activeIdx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
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
                {images.map((img, i) => (
                    <button
                        key={i}
                        className={`aspect-square rounded-2xl overflow-hidden border-3 transition-all cursor-pointer shadow-sm relative
              ${i === activeIdx
                                ? 'border-orange-500 ring-2 ring-orange-500/20'
                                : 'border-white hover:border-orange-200'}`}
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Ver imagen ${i + 1}`}
                    >
                        <Image src={img} alt={`${title} miniatura ${i + 1}`} fill className="object-cover" sizes="100px" />
                    </button>
                ))}
            </div>
        </div>
    );
}
