# Horario CPW: Planificador de Turnos de Empleados

Horario CPW es una aplicación web construida con Next.js y React para la gestión y visualización de horarios de trabajo de empleados. Permite generar rotaciones de turnos complejas de manera automática, adaptándose dinámicamente al número de empleados activos.

## Características Principales

-   **Generación Automática de Horarios**: Crea un calendario de turnos mensual basado en un conjunto de reglas de rotación predefinidas.
-   **Rotación Dinámica**: La lógica se adapta automáticamente si hay 8 o 7 empleados, deshabilitando turnos específicos para optimizar la cobertura.
-   **Interfaz Interactiva**: Permite modificar los turnos manualmente y filtrar la vista por empleado.
-   **Diseño Responsivo**: La interfaz está optimizada para su uso tanto en computadores de escritorio como en dispositivos móviles.
-   **Exportación de Datos**: Permite exportar el horario actual a formato CSV.

---

## Mapa Conceptual del Proyecto

A continuación se muestra la estructura de carpetas y archivos completa del proyecto, junto con una breve descripción de su propósito.

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
│   │   ├── ui/             # Componentes de UI preconstruidos de ShadCN.
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   ¡   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   │
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
├── .gitignore              # Archivos y carpetas ignorados por Git.
├── components.json         # Configuración para la CLI de ShadCN/UI.
├── next.config.ts          # Configuración principal de Next.js.
├── package-lock.json       # Lockfile de las dependencias de NPM.
├── package.json            # Lista de dependencias y scripts del proyecto.
├── postcss.config.js       # Configuración de PostCSS.
├── README.md               # Este archivo.
├── tailwind.config.ts      # Configuración del framework de estilos Tailwind CSS.
└── tsconfig.json           # Configuración del compilador de TypeScript.
```
