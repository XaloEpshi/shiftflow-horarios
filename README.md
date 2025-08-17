# ShiftFlow: Planificador de Turnos de Empleados

ShiftFlow es una aplicación web construida con Next.js y React para la gestión y visualización de horarios de trabajo de empleados. Permite generar rotaciones de turnos complejas de manera automática, adaptándose dinámicamente al número de empleados activos.

## Características Principales

-   **Generación Automática de Horarios**: Crea un calendario de turnos mensual basado en un conjunto de reglas de rotación predefinidas.
-   **Rotación Dinámica**: La lógica se adapta automáticamente si hay 8 o 7 empleados, deshabilitando turnos específicos para optimizar la cobertura.
-   **Interfaz Interactiva**: Permite modificar los turnos manualmente y filtrar la vista por empleado.
-   **Diseño Responsivo**: La interfaz está optimizada para su uso tanto en computadores de escritorio como en dispositivos móviles.
-   **Exportación de Datos**: Permite exportar el horario actual a formato CSV.

---

## Mapa Conceptual del Proyecto

A continuación se muestra la estructura de carpetas y archivos más importantes del proyecto, junto con una breve descripción de su propósito.

```
/
├── public/
│   └── (Archivos estáticos como imágenes o fuentes)
│
├── src/
│   ├── app/
│   │   ├── globals.css     # Hoja de estilos global y variables de tema (ShadCN).
│   │   ├── layout.tsx      # Layout principal de la aplicación.
│   │   └── page.tsx        # Componente de la página de inicio que renderiza el planificador.
│   │
│   ├── components/
│   │   ├── ui/             # Componentes de UI preconstruidos de ShadCN (Botones, Cards, etc.).
│   │   ├── icons.tsx       # Definición de iconos personalizados para la aplicación.
│   │   └── schedule-view.tsx # Componente principal que contiene toda la lógica de la interfaz.
│   │
│   ├── hooks/
│   │   ├── use-mobile.ts   # Hook para detectar si la app se visualiza en un dispositivo móvil.
│   │   └── use-toast.ts    # Hook para gestionar la visualización de notificaciones (toasts).
│   │
│   ├── lib/
│   │   ├── data.ts         # Contiene la lógica central para generar los horarios de los empleados.
│   │   └── utils.ts        # Funciones de utilidad (ej. `cn` para fusionar clases de Tailwind).
│   │
│   └── types/
│       └── index.ts        # Definiciones de tipos de TypeScript para el proyecto (Employee, ShiftType, etc.).
│
├── tailwind.config.ts      # Configuración del framework de estilos Tailwind CSS.
└── next.config.ts          # Configuración principal de Next.js.
```
