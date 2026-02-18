export interface AdminCategoryInputDTO {
    nombre: string;
    slug?: string;
}

export interface AdminCategoryUpdateDTO {
    id: string;
    nombre?: string;
    slug?: string;
    activo?: boolean;
}

export interface AdminCategoryDeleteDTO {
    id: string;
}

export function validateAdminCategoryInput(input: Partial<AdminCategoryInputDTO>): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.nombre?.trim()) {
        errors.push('El nombre de la categoría es obligatorio.');
    }

    return { ok: errors.length === 0, errors };
}

export function validateAdminCategoryUpdateInput(input: Partial<AdminCategoryUpdateDTO>): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.id?.trim()) {
        errors.push('El identificador de la categoría es obligatorio.');
    }

    if (
        input.nombre !== undefined
        && !input.nombre.trim()
    ) {
        errors.push('El nombre de la categoría no puede estar vacío.');
    }

    return { ok: errors.length === 0, errors };
}

export function validateAdminCategoryDeleteInput(input: Partial<AdminCategoryDeleteDTO>): {
    ok: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!input.id?.trim()) {
        errors.push('El identificador de la categoría es obligatorio.');
    }

    return { ok: errors.length === 0, errors };
}
