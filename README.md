# Catálogo de Productos de Construcción

Catálogo digital de productos para materiales y suministros de construcción. Ofrece una interfaz pública para navegar el catálogo con búsqueda y filtros, y un panel administrativo completo para gestionar productos, categorías e imágenes.

## Características principales

**Interfaz pública**
- Navegación por categorías con popularidad ordenada
- Búsqueda y filtros avanzados
- Detalle de producto con especificaciones técnicas, variantes y recursos descargables
- Galería de imágenes (hasta 2 por producto, convertidas a WebP automáticamente)
- Diseño responsivo con Tailwind CSS

**Panel administrativo**
- Creación y edición de productos con formulario multi-paso
- Gestión de categorías
- Carga, reorden y recorte de imágenes con política de validación estricta
- Control de visibilidad (publicar / despublicar / precio visible)
- Historial de auditoría de acciones administrativas
- Autenticación segura vía Supabase Auth

**Alcance técnico**
- Capacidad inicial: ~100 productos
- Imágenes: máx. 2 por producto · máx. 2 MB por archivo · formatos JPG, PNG, WebP
- Sin e-commerce: solo visualización de información

---

## Arquitectura

El proyecto combina **Feature-Sliced Design (FSD)** con un enfoque de **Arquitectura en Capas** dentro de cada feature (`domain → application → infrastructure`), sobre Next.js 16 con App Router.

### Estructura real del proyecto

```
app/                        # Next.js App Router (rutas)
│   ├── admin/              # Panel administrativo (products, categories, users, history)
│   ├── catalog/            # Catálogo público con rutas dinámicas [id]
│   ├── api/                # Route Handlers (Next.js API)
│   └── login/              # Autenticación
│
src/
├── app/
│   ├── providers/          # Proveedores globales de React (ProductContext, AuthContext)
│   └── styles/             # Estilos globales
│
├── entities/               # Tipos y modelos de dominio puros
│   ├── product/model/      # types.ts — interfaz Product, ProductVariant
│   └── category/model/     # types.ts — interfaz Category
│
├── features/               # Módulos de negocio autocontenidos
│   ├── product-management/
│   │   ├── domain/         # Contratos (interfaces) y política de imágenes
│   │   │   ├── ProductRepository.ts       # Interfaz completa (Read + Write)
│   │   │   ├── ProductReadRepository.ts   # Contrato solo lectura
│   │   │   ├── ProductWriteRepository.ts  # Contrato solo escritura
│   │   │   └── imagePolicy.ts             # Reglas de validación de imágenes
│   │   ├── application/    # Use-cases y DTOs/schemas de validación
│   │   │   ├── adminProductSchemas.ts     # DTOs + validadores (sin dependencias externas)
│   │   │   ├── CreateProduct.ts           # Use-case: crear producto
│   │   │   ├── PublishProduct.ts          # Use-case: publicar/despublicar
│   │   │   ├── ReorderImages.ts           # Use-case: reordenar imágenes
│   │   │   └── DeleteProduct.ts           # Use-case: eliminar producto
│   │   ├── infrastructure/ # Implementación concreta (Supabase)
│   │   │   └── SupabaseProductRepository.ts
│   │   └── model/          # Estado React + hook useProducts (ProductContext)
│   │
│   ├── category-management/
│   │   ├── domain/         # CategoryRepository.ts
│   │   ├── application/    # adminCategorySchemas.ts, use-cases CRUD
│   │   └── infrastructure/ # SupabaseCategoryRepository.ts
│   │
│   ├── auth/               # AuthContext + LoginForm
│   ├── product-filter/     # FilterPanel — UI de filtros
│   ├── product-search/     # SearchBar
│   └── product-interaction/# Tracking de popularidad e interacciones
│
├── shared/
│   ├── config/             # constants.ts
│   ├── lib/                # formatters, supabase client, errorTracking, adminAudit,
│   │                       # popularityScore, categoryPopularityOrder, errorPolicy
│   ├── types/              # common.ts — StockStatus y tipos compartidos
│   └── ui/                 # ErrorState, LoadingOverlay, Logo, MaintenanceState
│
├── views/                  # Vistas completas (componen widgets + features)
│   ├── admin/ui/           # ProductFormView (formulario admin completo)
│   ├── catalog/ui/         # CatalogView, CatalogViewWithModal
│   ├── categories/ui/      # CategoriesView
│   └── product-detail/ui/  # ProductDetailView
│
└── widgets/                # Bloques UI reutilizables
    ├── header/, footer/
    ├── product-card/
    ├── product-gallery/
    ├── category-nav/
    └── related-products-carousel/
```

### Patrones de diseño implementados

**Repository Pattern — segregado en Read/Write**
Los contratos de acceso a datos están separados en `ProductReadRepository` (queries) y `ProductWriteRepository` (commands), siguiendo el principio de segregación de interfaces (ISP). `ProductRepository` los compone para la implementación concreta.

```
ProductReadRepository  ──┐
                          ├── ProductRepository ← SupabaseProductRepository
ProductWriteRepository ──┘
```

Beneficios directos:
- Los use-cases que solo escriben (`CreateProduct`, `PublishProduct`) tipan su dependencia como `ProductWriteRepository`, nunca acceden a queries.
- Los tests inyectan mocks mínimos sin implementar la interfaz completa.
- Cambiar de Supabase a otra fuente de datos no toca ningún use-case.

**Use-Cases (Application Services)**
Cada acción de negocio vive en su propio archivo bajo `application/`:

| Use-case | Responsabilidad |
|---|---|
| `createProductUseCase` | Valida DTO + imágenes, delega a repositorio |
| `publishProductUseCase` | Valida ID, actualiza `isPublished` |
| `reorderImagesUseCase` | Valida ID, trunca al límite de política |
| `deleteProductUseCase` | Valida ID, elimina producto |

**DTO Validation (contratos de entrada del admin)**
`adminProductSchemas.ts` define interfaces DTO y funciones de validación puras (sin dependencias de frameworks), usables tanto en server como en client:

- `AdminProductInputDTO` + `validateAdminProductInput`
- `AdminUploadImageDTO` + `validateAdminUploadImage` + `validateAdminUploadImageList`

**Domain Policy — `imagePolicy.ts`**
Fuente única de verdad para las reglas de imágenes. Las constantes (`IMAGE_POLICY_MAX_COUNT`, `IMAGE_POLICY_MAX_BYTES`, etc.) son importadas tanto por los use-cases como por la UI del formulario, garantizando consistencia.

**Dependency Injection vía Context**
`ProductContext` inyecta el repositorio concreto (`SupabaseProductRepository`) al árbol de componentes. Los use-cases reciben el repositorio como parámetro, nunca lo instancian directamente.

**Audit Logging**
`adminAudit.ts` registra todas las acciones administrativas en Supabase (`auditoria` table) con usuario, acción, entidad y timestamp.

---

## Stack tecnológico real

| Área | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19 |
| Estilos | Tailwind CSS 4 |
| Backend / DB | Supabase (PostgreSQL + Storage + Auth) |
| Validación | Funciones puras TypeScript (sin Zod) |
| Gestión de estado | React Context + hooks |
| Testing | Vitest 4 + @vitest/coverage-v8 |
| Linting | ESLint 9 + eslint-config-next |
| Error tracking | @sentry/nextjs → GlitchTip + fallback Supabase |
| CI/CD | GitHub Actions |

---

## Primeros pasos

### Prerequisitos

- Node.js 20 o superior
- npm (el proyecto usa `npm ci` en CI)

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Pruebas unitarias en modo watch
npm run test

# Pruebas unitarias (una sola corrida, usado en CI)
npm run test:run

# Reporte de cobertura (genera /coverage/index.html)
npm run test:coverage
```

### Variables de entorno

Crear `.env.local` en la raíz:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<url_proyecto_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Error tracking
NEXT_PUBLIC_GLITCHTIP_DSN=<dsn_glitchtip>
GLITCHTIP_DSN=<dsn_glitchtip>
NEXT_PUBLIC_APP_ENV=development|staging|production
APP_ENV=development|staging|production
NEXT_PUBLIC_APP_RELEASE=<version_o_commit>
APP_RELEASE=<version_o_commit>
INTERNAL_APP_URL=http://localhost:3000
```

---

## Pruebas unitarias

Las pruebas cubren lógica de negocio pura, sin dependencias de DOM ni de Supabase.

### Suites actuales (6 archivos · ~52 tests)

| Archivo | Qué valida |
|---|---|
| `domain/imagePolicy.test.ts` | Política de imágenes: límite de cantidad, peso máximo, MIME permitidos |
| `application/adminProductSchemas.test.ts` | Validación de DTOs de producto e imagen (casos válidos e inválidos) |
| `application/createProductUseCase.test.ts` | Use-case de creación: validación, truncado de imágenes, llamadas al repositorio mockeado |
| `shared/lib/popularityScore.test.ts` | Cálculo de score de popularidad con pesos configurables |
| `shared/lib/categoryPopularityOrder.test.ts` | Ordenamiento de categorías por popularidad |
| `shared/lib/errorPolicy.test.ts` | Clasificación de errores: esperados vs inesperados, severidad |

### Ejecutar solo un archivo

```bash
npx vitest run src/features/product-management/domain/imagePolicy.test.ts
```

### Cobertura

```bash
npm run test:coverage
# Reporte en: coverage/index.html
```

---

## Pipeline CI/CD

Definido en `.github/workflows/ci.yml`. Se ejecuta automáticamente en cada `push` y `pull_request` a `main` / `master`.

```
push / pull_request → main
         │
         ▼
   1. checkout
   2. setup Node 20
   3. npm ci
   4. npm run lint       ← bloquea si hay errores ESLint
   5. npm run test:run   ← bloquea si falla cualquier test
   6. npm run build      ← bloquea si el build de producción falla
```

Cualquier paso fallido bloquea el merge. No hay deploy automático configurado actualmente.

---

## Error Tracking

La app usa `@sentry/nextjs` apuntando a una instancia de **GlitchTip** (compatible con la API de Sentry).

- `sentry.client.config.ts` — configuración cliente (browser)
- `sentry.server.config.ts` — configuración servidor (Node.js)
- `sentry.edge.config.ts` — configuración edge runtime
- `instrumentation.ts` / `instrumentation-client.ts` — hooks de OpenTelemetry de Next.js

**Fallback a Supabase:** si GlitchTip no está disponible o el error ocurre en `production` sin DSN configurado, los errores críticos se persisten en la tabla `error_registros_fallback` de Supabase mediante `src/shared/lib/errorTracking.ts`.

**Verificación rápida:**
1. Levantar app con `npm run dev`
2. Navegar a `/debug/error-lab` para forzar errores controlados
3. Confirmar que aparecen en GlitchTip con `environment` y `release` correctos

---

## Migraciones de base de datos

Las migraciones de Supabase están versionadas en `supabase/migrations/`:

| Migración | Descripción |
|---|---|
| `001` | Campo `precio_visible` en productos |
| `002` | Tabla de auditoría |
| `003` | Soporte especificación variada |
| `004` | Contenido detallado de producto |
| `005` | Corrección función `es_admin` |
| `006` | Bucket storage `catalogo-productos` |
| `007` | Lectura pública del catálogo |
| `008` | Ranking de popularidad |
| `009` | Fallback de error tracking |
| `010` | Vistas seguras de errores |
| `011` | TTL y limpieza de auditoría |
| `012` | Campo `nombre_formato` en variantes |
| `013` | Corrección `es_admin` para incluir owner |

---

## Guía de contribución

1. **Ramas**: crear desde `main` con prefijo `feat/`, `fix/` o `chore/`
2. **FSD**: respetar la capa correcta para cada tipo de código (ver estructura arriba)
3. **Capas internas de feature**: `domain` no importa de `application`; `application` no importa de `infrastructure`
4. **Repository**: toda lectura/escritura de datos pasa por una implementación de repositorio — nunca llamar a Supabase directamente desde un componente
5. **Use-cases**: las acciones del admin van en `application/`, reciben el repositorio como parámetro
6. **Tests**: nueva lógica de negocio → nuevo archivo `.test.ts` en la misma carpeta
7. **Commits**: mensajes descriptivos en español o inglés, consistente por PR

---

## Licencia

Proyecto propietario y confidencial.
