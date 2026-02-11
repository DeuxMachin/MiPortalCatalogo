import type { Category } from './types';

export const MOCK_CATEGORIES: Category[] = [
    {
        id: 1,
        name: 'Barras de Acero',
        slug: 'barras-de-acero',
        description: 'Barras de refuerzo, mallas y fierros para estructuras de hormigón armado.',
        icon: '🔩',
        productCount: 42,
        subcategories: [
            { id: 11, name: 'Barras Lisas', slug: 'barras-lisas' },
            { id: 12, name: 'Barras Corrugadas', slug: 'barras-corrugadas' },
            { id: 13, name: 'Barras Estriadas', slug: 'barras-estriadas' },
        ],
    },
    {
        id: 2,
        name: 'Vigas I',
        slug: 'vigas-i',
        description: 'Vigas de acero doble T para estructuras metálicas e industriales.',
        icon: '🏗️',
        productCount: 18,
        subcategories: [
            { id: 21, name: 'Perfiles W', slug: 'perfiles-w' },
            { id: 22, name: 'Perfiles IPE', slug: 'perfiles-ipe' },
        ],
    },
    {
        id: 3,
        name: 'Hormigones y Cementos',
        slug: 'hormigones-y-cementos',
        description: 'Cementos, morteros, hormigones premezclados y aditivos para obras.',
        icon: '🧱',
        productCount: 31,
        subcategories: [
            { id: 31, name: 'Cemento Portland', slug: 'cemento-portland' },
            { id: 32, name: 'Hormigón Premezclado', slug: 'hormigon-premezclado' },
            { id: 33, name: 'Morteros', slug: 'morteros' },
            { id: 34, name: 'Aditivos', slug: 'aditivos' },
        ],
    },
    {
        id: 4,
        name: 'Mallas Electrosoldadas',
        slug: 'mallas-electrosoldadas',
        description: 'Mallas de refuerzo para losas, radieres y muros de hormigón.',
        icon: '🔗',
        productCount: 15,
        subcategories: [
            { id: 41, name: 'Mallas Estándar', slug: 'mallas-estandar' },
            { id: 42, name: 'Mallas Especiales', slug: 'mallas-especiales' },
        ],
    },
    {
        id: 5,
        name: 'Planchas de Metal',
        slug: 'planchas-de-metal',
        description: 'Planchas de acero, galvanizadas y de aluminio en diversos espesores.',
        icon: '📐',
        productCount: 22,
        subcategories: [
            { id: 51, name: 'Planchas Laminadas', slug: 'planchas-laminadas' },
            { id: 52, name: 'Planchas Galvanizadas', slug: 'planchas-galvanizadas' },
            { id: 53, name: 'Planchas Inoxidables', slug: 'planchas-inoxidables' },
        ],
    },
];
