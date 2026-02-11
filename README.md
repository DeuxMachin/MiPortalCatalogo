# Catálogo de Productos de Construcción

Una aplicación moderna de catálogo digital diseñada para mostrar productos de construcción con información detallada, especificaciones e imágenes. Esta plataforma proporciona una interfaz pública para navegar productos y un panel administrativo para la gestión de contenido.

## Descripción del Proyecto

Esta aplicación funciona como un catálogo integral de productos para materiales y suministros de construcción. Permite a los clientes explorar productos disponibles con especificaciones detalladas, información de precios, medidas y referencias visuales, mientras proporciona a los administradores herramientas para gestionar el inventario de productos y la categorización.

### Características Principales

**Interfaz de Catálogo Público**
- Navegar productos organizados por categorías
- Capacidades avanzadas de búsqueda y filtrado
- Páginas de productos detalladas con especificaciones técnicas
- Galerías de imágenes con soporte para hasta cuatro imágenes por producto
- Diseño responsivo para visualización óptima en todos los dispositivos

**Panel Administrativo**
- Creación y edición de productos
- Gestión de categorías
- Carga y ordenamiento de imágenes (hasta 4 imágenes por producto)
- Controles de visibilidad para publicar/despublicar productos
- Autenticación y autorización seguras

### Alcance Técnico

- Capacidad inicial: Aproximadamente 100 productos
- Soporte multi-imagen: Hasta 4 imágenes por producto
- Sin funcionalidad de comercio electrónico: Solo visualización de información
- Enfoque en rendimiento, mantenibilidad y seguridad

## Arquitectura

Este proyecto sigue la metodología **Feature-Sliced Design (FSD)**, un enfoque arquitectónico moderno que organiza el código por características de negocio y capas técnicas. Esta estructura promueve escalabilidad, mantenibilidad y clara separación de responsabilidades.

### Patrones de Diseño

**Patrón Repository**
El patrón Repository abstrae la lógica de acceso a datos, proporcionando una interfaz limpia entre la lógica de negocio y las fuentes de datos. Este enfoque ofrece varias ventajas:
- Lógica de acceso a datos centralizada
- Pruebas más fáciles mediante inyección de dependencias
- Flexibilidad para cambiar fuentes de datos sin afectar la lógica de negocio
- API consistente para operaciones de datos en toda la aplicación

**Módulos de Características**
Las características están organizadas como módulos independientes y autocontenidos que encapsulan capacidades de negocio específicas. Este enfoque modular permite:
- Desarrollo y pruebas independientes de características
- Límites claros entre diferentes funcionalidades
- Navegación y mantenimiento de código más fácil
- Acoplamiento reducido entre componentes

**Inyección de Dependencias**
Implementamos inyección de dependencias para gestionar las dependencias de componentes, lo que proporciona:
- Mejor capacidad de prueba mediante inyección de mocks
- Acoplamiento débil entre componentes
- Mejor organización y reutilización del código
- Mantenimiento y refactorización simplificados

### Estructura del Proyecto

La aplicación sigue la arquitectura en capas de FSD, organizada desde abstracciones de bajo nivel hasta alto nivel:

```
src/
├── app/                    # Capa de inicialización de la aplicación
│   ├── providers/          # Proveedores globales (enrutamiento, estado, tema)
│   └── styles/             # Estilos globales y tokens de diseño
│
├── processes/              # Procesos de negocio complejos (opcional)
│   └── [nombre-proceso]/   # Flujos de trabajo multi-paso que abarcan características
│
├── pages/                  # Componentes a nivel de página (enrutamiento)
│   ├── catalog/            # Página del catálogo de productos
│   ├── product-detail/     # Página de detalle de producto individual
│   └── admin/              # Panel administrativo
│
├── widgets/                # Bloques de UI compuestos
│   ├── product-card/       # Tarjeta de visualización de producto
│   ├── product-gallery/    # Componente de galería de imágenes
│   ├── category-nav/       # Navegación de categorías
│   └── admin-panel/        # Panel de control administrativo
│
├── features/               # Interacciones de usuario y características de negocio
│   ├── product-search/     # Funcionalidad de búsqueda de productos
│   ├── product-filter/     # Capacidades de filtrado
│   ├── product-management/ # Operaciones CRUD para productos
│   ├── category-management/# Administración de categorías
│   └── image-upload/       # Manejo y carga de imágenes
│
├── entities/               # Entidades de negocio y modelos de dominio
│   ├── product/            # Entidad de producto
│   │   ├── model/          # Tipos de producto, esquemas, estado
│   │   ├── api/            # Repositorio de productos y llamadas API
│   │   └── ui/             # Primitivos UI específicos de producto
│   └── category/           # Entidad de categoría
│       ├── model/          # Tipos de categoría y estado
│       ├── api/            # Repositorio de categorías
│       └── ui/             # Componentes UI de categoría
│
└── shared/                 # Infraestructura y utilidades reutilizables
    ├── api/                # Configuración de API y servicios base
    │   ├── repositories/   # Clases base de repositorio
    │   ├── services/       # Cliente HTTP y utilidades de API
    │   └── interceptors/   # Interceptores de petición/respuesta
    ├── ui/                 # Componentes UI compartidos (botones, inputs, etc.)
    ├── lib/                # Funciones de utilidad y helpers
    ├── config/             # Configuración de la aplicación
    └── types/              # Tipos e interfaces TypeScript compartidos
```

### Responsabilidades de las Capas

**Capa App**
Inicializa la aplicación, configura proveedores globales, configuración de enrutamiento y aplica estilos globales. Esta capa orquesta todo el arranque de la aplicación.

**Capa Processes** (Opcional)
Contiene procesos de negocio complejos que abarcan múltiples características. Para aplicaciones más simples, esta capa puede permanecer vacía, con la lógica distribuida entre las características.

**Capa Pages**
Define componentes a nivel de ruta que componen widgets y características en páginas completas. Cada página corresponde a una URL distinta en la aplicación.

**Capa Widgets**
Componentes UI compuestos que combinan múltiples características y entidades. Los widgets son bloques autocontenidos que pueden reutilizarse en diferentes páginas.

**Capa Features**
Encapsula interacciones de usuario específicas y capacidades de negocio. Cada característica es independiente y se enfoca en una única pieza de funcionalidad.

**Capa Entities**
Define entidades de negocio centrales con sus modelos de datos, interacciones API y representaciones UI básicas. Las entidades representan el modelo de dominio de la aplicación.

**Capa Shared**
Proporciona infraestructura reutilizable, utilidades y componentes UI que pueden usarse en todas las demás capas. Esta capa no tiene dependencias de lógica de negocio.

### Reglas de Dependencias

FSD aplica reglas estrictas de dependencias para mantener la integridad arquitectónica:

- Las capas solo pueden importar desde capas inferiores (ej., pages puede importar desde widgets, features, entities y shared)
- Los módulos dentro de la misma capa no pueden importarse directamente entre sí
- La capa shared no puede importar desde ninguna otra capa
- La comunicación entre características ocurre a través de la capa entities o mediante composición en capas superiores

## Stack Tecnológico

- **Framework Frontend**: React con TypeScript
- **Herramienta de Build**: Vite
- **Estilos**: CSS Modules / Tailwind CSS
- **Gestión de Estado**: Por determinar según complejidad
- **Comunicación API**: Axios con patrón repository
- **Enrutamiento**: React Router
- **Manejo de Formularios**: React Hook Form
- **Validación**: Zod

## Primeros Pasos

### Prerequisitos

- Node.js (versión 18 o superior)
- Gestor de paquetes npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

### Flujo de Trabajo de Desarrollo

1. Crear ramas de características desde `main`
2. Implementar características siguiendo la estructura FSD
3. Escribir pruebas unitarias para la lógica de negocio
4. Enviar pull requests para revisión de código
5. Fusionar a `main` después de aprobación

## Objetivos del Proyecto

- **Rendimiento**: Tiempos de carga rápidos y experiencia de usuario fluida
- **Mantenibilidad**: Código limpio y bien organizado que es fácil de entender y modificar
- **Seguridad**: Autenticación, autorización y validación de datos adecuadas
- **Escalabilidad**: Arquitectura que puede crecer con las necesidades del negocio
- **Experiencia de Usuario**: Interfaces intuitivas tanto para usuarios públicos como administradores

## Contribución

Al contribuir a este proyecto, por favor sigue estas directrices:

1. Adherirse a la estructura FSD al agregar nuevas características
2. Colocar componentes en la capa apropiada según su responsabilidad
3. Usar el patrón repository para todas las operaciones de acceso a datos
4. Escribir mensajes de commit significativos
5. Incluir pruebas para nueva funcionalidad
6. Actualizar la documentación según sea necesario

## Licencia

Este proyecto es propietario y confidencial.
