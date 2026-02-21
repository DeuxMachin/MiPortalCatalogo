'use client';

import Image from 'next/image';
import { APP_NAME } from '@/src/shared/config/constants';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const sizeMap = {
    sm: { imgH: 40, imgW: 100 },
    md: { imgH: 48, imgW: 120 },
    lg: { imgH: 56, imgW: 140 },
};

export default function Logo({ size = 'md', onClick }: LogoProps) {
    const s = sizeMap[size];

    return (
        <div
            className={`flex items-center select-none ${onClick ? 'cursor-pointer group' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            <div
                className={`relative flex-shrink-0 ${onClick ? 'group-hover:scale-105 transition-transform duration-200' : ''}`}
                style={{ width: s.imgW, height: s.imgH }}
            >
                <Image
                    src="/logo.webp"
                    alt={`${APP_NAME} logo`}
                    fill
                    className="object-contain object-left"
                    priority
                    sizes={`${s.imgW}px`}
                />
            </div>
        </div>
    );
}

