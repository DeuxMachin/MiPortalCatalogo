/**
 * Mapea errores técnicos de Supabase/storage a mensajes legibles para el usuario.
 *
 * El administrador nunca debería ver mensajes técnicos como:
 *   "duplicate key value violates unique constraint productos_slug_key"
 * sino algo comprensible como:
 *   "Ya existe un producto con ese nombre o SKU. Intenta con un nombre diferente."
 */

interface ErrorRule {
    /** Patrón a buscar en el mensaje técnico. */
    pattern: RegExp;
    /** Mensaje en español para el usuario. */
    message: string;
}

const ERROR_RULES: ErrorRule[] = [
    /* ── Duplicados / restricciones únicas ─────────────────────────── */
    {
        pattern: /duplicate key.*productos_slug_key/i,
        message: 'Ya existe un producto con ese nombre o SKU. Intenta con un nombre diferente.',
    },
    {
        pattern: /duplicate key.*sku/i,
        message: 'Ya existe un producto con ese SKU. Por favor usa un código SKU diferente.',
    },
    {
        pattern: /duplicate key.*already exists/i,
        message: 'Ya existe un registro con esos datos. Verifica el nombre y el SKU del producto.',
    },
    {
        pattern: /duplicate key/i,
        message: 'Ya existe un producto con esa información. Revisa el nombre y el SKU.',
    },
    {
        pattern: /unique.*constraint/i,
        message: 'Ya existe un registro con esos datos. Verifica el nombre y el SKU del producto.',
    },

    /* ── Permisos / seguridad ───────────────────────────────────────── */
    {
        pattern: /row.level security|new row violates row-level/i,
        message: 'No tienes permiso para realizar esta acción. Verifica que tu sesión de administrador esté activa.',
    },
    {
        pattern: /permission denied/i,
        message: 'Acceso denegado. No tienes los permisos necesarios para completar esta operación.',
    },
    {
        pattern: /security.*policy|policy.*violat/i,
        message: 'No se puede completar la operación por una restricción de seguridad. Contacta al administrador.',
    },
    {
        pattern: /not authenticated|unauthenticated/i,
        message: 'Tu sesión no está activa. Recarga la página e inicia sesión nuevamente.',
    },
    {
        pattern: /jwt.*expired|token.*expired/i,
        message: 'Tu sesión expiró. Recarga la página e inicia sesión nuevamente.',
    },
    {
        pattern: /invalid.*jwt|invalid.*token/i,
        message: 'Tu sesión no es válida. Recarga la página e inicia sesión nuevamente.',
    },

    /* ── Relaciones / claves foráneas ───────────────────────────────── */
    {
        pattern: /foreign key.*categoria|violates foreign key.*categoria/i,
        message: 'La categoría seleccionada no existe o fue eliminada. Por favor selecciona otra.',
    },
    {
        pattern: /foreign key constraint/i,
        message: 'Uno de los datos del formulario hace referencia a un registro que ya no existe. Revisa la categoría.',
    },

    /* ── Datos obligatorios / valores inválidos ─────────────────────── */
    // Nota: los errores NOT NULL se procesan antes de este array con extractNotNullField().
    {
        pattern: /check constraint/i,
        message: 'Uno de los valores ingresados no es válido. Verifica que los campos numéricos sean correctos.',
    },
    {
        pattern: /value too long/i,
        message: 'Uno de los campos es demasiado largo. Reduce el texto e intenta nuevamente.',
    },
    {
        pattern: /invalid input syntax/i,
        message: 'Uno de los campos contiene un valor no válido. Revisa los campos numéricos.',
    },

    /* ── Red / conectividad ─────────────────────────────────────────── */
    {
        pattern: /fetch failed|failed to fetch/i,
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
    },
    {
        pattern: /abort|time.?out/i,
        message: 'La operación tardó demasiado tiempo. Verifica tu conexión e intenta nuevamente.',
    },
    {
        pattern: /ECONNREFUSED|ENOTFOUND/i,
        message: 'No hay conexión con la base de datos. Espera unos minutos e intenta de nuevo.',
    },
    {
        pattern: /network/i,
        message: 'Problema de red. Verifica tu conexión a internet e intenta nuevamente.',
    },

    /* ── Almacenamiento / imágenes ──────────────────────────────────── */
    {
        pattern: /payload too large|storage.*limit|file.*too large/i,
        message: 'La imagen es demasiado grande. El límite es 5 MB por imagen. Comprime el archivo e intenta nuevamente.',
    },
    {
        pattern: /invalid.*mime|unsupported.*type|invalid.*type/i,
        message: 'Formato de imagen no permitido. Usa archivos JPG, PNG o WebP.',
    },
    {
        pattern: /object not found/i,
        message: 'La imagen que intentas reutilizar ya no está disponible. Sube una imagen nueva.',
    },
    {
        pattern: /bucket not found/i,
        message: 'Error de configuración en el almacenamiento de imágenes. Contacta al administrador del sistema.',
    },

    /* ── Errores internos del sistema ───────────────────────────────── */
    {
        pattern: /relation.*does not exist|column.*does not exist|table.*does not exist/i,
        message: 'Error interno del sistema. Contacta al administrador del portal.',
    },
    {
        pattern: /syntax error/i,
        message: 'Error interno del sistema al procesar los datos. Contacta al administrador.',
    },
    {
        pattern: /max_rows|statement timeout/i,
        message: 'El servidor tardó demasiado en responder. Intenta nuevamente en unos momentos.',
    },
];

/**
 * Mapeo de nombres de columna BD → etiqueta legible en español.
 * Se usa para personalizar mensajes de error NOT NULL.
 */
const COLUMN_LABELS: Record<string, string> = {
    // tabla productos
    nombre: 'el nombre del producto',
    slug: 'el identificador único del producto (nombre/SKU)',
    categoria_id: 'la categoría',
    descripcion: 'la descripción',
    activo: 'el estado de publicación',
    precio_visible: 'la visibilidad del precio',
    nota_tecnica: 'la nota técnica',
    recursos: 'los recursos',
    // tabla producto_variantes
    precio: 'el precio del formato',
    sku: 'el código SKU del formato',
    estado_stock: 'el estado de stock',
    moneda: 'la moneda',
    especificacion_variada: 'las especificaciones técnicas',
    quick_specs: 'las especificaciones rápidas',
    activo_variante: 'el estado del formato',
    // tabla producto_imagenes
    path_storage: 'la ruta de la imagen',
    orden: 'el orden de la imagen',
    producto_id: 'la referencia al producto',
};

/**
 * Si el mensaje es un error NOT NULL de PostgreSQL, extrae el nombre de columna
 * y lo convierte en un mensaje legible. Retorna null si no aplica.
 *
 * Formato PostgreSQL: `null value in column "X" of relation "Y" violates not-null constraint`
 */
function extractNotNullMessage(message: string): string | null {
    const match = message.match(/null value in column\s+["']?([\w_]+)["']?/i);
    if (!match) {
        // Formato alternativo: `violates not-null constraint on column X`
        const alt = message.match(/not-null constraint.*column\s+["']?([\w_]+)["']?/i);
        if (!alt?.[1]) return null;
        const col = alt[1].toLowerCase();
        const label = COLUMN_LABELS[col];
        return label
            ? `El campo "${label}" es obligatorio y no puede quedar vacío.`
            : 'Falta completar un campo obligatorio. Revisa el formulario.';
    }
    const col = match[1].toLowerCase();
    const label = COLUMN_LABELS[col];
    return label
        ? `El campo "${label}" es obligatorio y no puede quedar vacío.`
        : 'Falta completar un campo obligatorio. Revisa el formulario.';
}

/**
 * Recibe un error (string, Error, objeto de Supabase, etc.) y retorna
 * un mensaje en español comprensible para un usuario no técnico.
 *
 * @param raw - El error tal como viene de Supabase u otra fuente técnica.
 * @param fallback - Mensaje genérico cuando ninguna regla coincide.
 */
export function toUserFriendlyError(
    raw: unknown,
    fallback = 'Ocurrió un error inesperado al guardar. Intenta nuevamente o contacta al administrador.',
): string {
    if (!raw) return fallback;

    let message = '';
    let details = '';

    if (typeof raw === 'string') {
        message = raw;
    } else if (raw instanceof Error) {
        if (raw.name === 'AbortError') {
            return 'La operación tardó demasiado tiempo. Verifica tu conexión e intenta nuevamente.';
        }
        message = raw.message ?? '';
    } else if (typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        // Supabase PostgrestError shape: { message, code, details, hint }
        message = String(obj['message'] ?? obj['error_description'] ?? obj['error'] ?? '');
        details = String(obj['details'] ?? '');
    }

    if (!message) return fallback;

    // Detectar errores NOT NULL de PostgreSQL y extraer el campo específico.
    // Supabase incluye el nombre de columna en `message`: null value in column "precio" ...
    // Y a veces en `details`. Concatenamos ambos para mayor cobertura.
    if (/not-null constraint|violates not-null/i.test(message)) {
        const notNullMsg = extractNotNullMessage(message) ?? (details ? extractNotNullMessage(details) : null);
        if (notNullMsg) return notNullMsg;
        return 'Falta completar un campo obligatorio. Revisa que todos los campos requeridos estén completos.';
    }

    for (const rule of ERROR_RULES) {
        if (rule.pattern.test(message)) {
            return rule.message;
        }
    }

    // Si el mensaje no parece técnico (no contiene palabras en inglés ni términos de BD),
    // se puede mostrar tal cual. De lo contrario, usamos el fallback.
    const TECHNICAL_INDICATORS = [
        /\b(constraint|violates|key|syntax|relation|column|null|fetch|ECONN|jwt|rls|policy|uuid|oid)\b/i,
        /error.*code:\s*\d+/i,
    ];
    const looksHuman = !TECHNICAL_INDICATORS.some((re) => re.test(message));
    if (looksHuman && message.length < 200) return message;

    return fallback;
}
