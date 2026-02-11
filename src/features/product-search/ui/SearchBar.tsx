'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = 'Buscar productos (SKU, material, marca)...',
}: SearchBarProps) {
    return (
        <div className="flex-1 max-w-xl relative hidden sm:block">
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm
          focus:ring-2 focus:ring-orange-500 focus:bg-white
          transition-all placeholder:text-slate-400 font-medium"
            />
            <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
        </div>
    );
}
