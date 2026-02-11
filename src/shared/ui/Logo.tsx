'use client';

import { APP_NAME } from '@/src/shared/config/constants';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    onClick?: () => void;
}

const sizeMap = {
    sm: { box: 'w-7 h-7 text-xs', text: 'text-sm' },
    md: { box: 'w-9 h-9 text-sm', text: 'text-lg' },
    lg: { box: 'w-11 h-11 text-base', text: 'text-xl' },
};

export default function Logo({ size = 'md', showText = true, onClick }: LogoProps) {
    const s = sizeMap[size];

    return (
        <div
            className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            <div
                className={`bg-orange-600 text-white rounded-lg font-black ${s.box} flex items-center justify-center leading-none
          ${onClick ? 'group-hover:scale-105 transition-transform duration-200' : ''}`}
            >
                MP
            </div>
            {showText && (
                <span className={`font-extrabold tracking-tight text-slate-800 ${s.text}`}>
                    {APP_NAME}
                </span>
            )}
        </div>
    );
}
