/** Subcategoría dentro de una categoría del catálogo. */
export interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

/** Categoría del catálogo con subcategorías. */
export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    productCount: number;
    subcategories: SubCategory[];
}
