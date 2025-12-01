# Timer Count ⏱️

**Una aplicación NATIVA de escritorio para macOS** - NO es un navegador web, es una app real instalada localmente en tu Mac.

Rastrea el tiempo que dedicas a cada proyecto de trabajo con cronómetros simples.

## Características

### ✅ Implementadas

- **Timer Manual**: Inicia y pausa timers para múltiples proyectos simultáneamente
- **Sesiones Separadas**: Cada play/pause crea una sesión independiente con inicio, fin y notas
- **Gestión de Proyectos**: CRUD completo con:
  - Clientes/Empresas
  - Prioridades (Low, Medium, High, Urgent)
  - Estados (Active, Paused, Completed, Archived)
  - Estimaciones de horas totales
  - Objetivos de horas por día/semana
  - Fechas límite
  - Colores personalizados
- **Gestión de Clientes**: Organiza proyectos por clientes
- **Dashboard en Tiempo Real**: Ve todos tus timers activos
- **Exportación de Datos**:
  - Backups en formato JSON
  - Reportes PDF con resumen visual
  - Exportación por día, mes o rango personalizado
- **Actualizaciones Automáticas**:
  - Buscar nuevas versiones con un clic
  - Ver changelog antes de actualizar
  - Instalación automática y segura

### 🚧 Por Implementar

- **Reportes y Estadísticas**:
  - Tiempo total por proyecto
  - Gráficos y visualizaciones (recharts)
  - Comparación tiempo real vs estimado
  - Exportación a CSV/Excel
- **Vista Calendario**: Historial de sesiones en formato calendario
- **Notificaciones**: Recordatorios para iniciar/pausar timers
- **Modo Oscuro**: Tema oscuro para la aplicación

## Stack Tecnológico

- **Backend**: Rust con Tauri
- **Frontend**: React + TypeScript + Vite
- **Estilos**: Tailwind CSS 4
- **Base de datos**: SQLite (rusqlite)
- **Estado**: Zustand
- **Iconos**: Lucide React
- **Routing**: React Router DOM

## 🚀 Instalación y Uso

### Primera vez

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Lanzar la aplicación de escritorio
npm run dev
```

**Importante**: Cuando ejecutes `npm run dev`, se abrirá una **ventana de aplicación nativa de macOS** (no un navegador). Es una app de escritorio real que funciona 100% offline y local en tu Mac.

### Cómo usar la app

#### **Flujo Básico (lo más importante):**

1. **Crear un Proyecto**:
   - Ve a "Projects" en el menú lateral
   - Click en "New Project"
   - Dale un nombre (ej: "Proyecto Cliente X")
   - Guarda

2. **Iniciar Cronómetro**:
   - Ve al Dashboard (pantalla principal)
   - Busca tu proyecto
   - Click en el botón **▶️ Play** verde
   - El cronómetro empieza a contar automáticamente

3. **Detener y Guardar**:
   - Click en el botón **⏹️ Stop** azul
   - (Opcional) Agrega notas sobre lo que hiciste
   - Click en "Stop & Save"
   - ✅ **Se guarda automáticamente** el registro con fecha, hora de inicio, hora de fin, duración y notas

#### **Características Extra:**

- ✅ **Múltiples cronómetros**: Puedes tener varios proyectos corriendo simultáneamente
- ✅ **Clientes**: Organiza proyectos por cliente (opcional)
- ✅ **Estimaciones**: Define cuántas horas esperas dedicar a cada proyecto
- ✅ **Prioridades y Estados**: Organiza tus proyectos
- ✅ **Todos los registros se guardan**: Cada sesión queda almacenada en tu base de datos local (SQLite)

## Estructura del Proyecto

```
timer-count/
├── src/                      # Frontend React
│   ├── components/          # Componentes reutilizables
│   ├── views/              # Vistas/páginas
│   ├── store/              # Zustand store
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Utilidades
├── src-tauri/              # Backend Rust
│   └── src/
│       ├── commands/       # Comandos Tauri
│       ├── models/         # Modelos de datos
│       └── database/       # Gestión de SQLite
└── package.json
```

## Base de Datos

La aplicación usa SQLite con tres tablas principales:

- **clients**: Información de clientes
- **projects**: Proyectos con estimaciones y deadlines
- **time_sessions**: Sesiones de tiempo con inicio, fin, duración y notas

## Próximos Pasos

- [ ] Implementar vista de Reportes con gráficos (recharts)
- [ ] Implementar vista de Calendario
- [ ] Sistema de notificaciones con tauri-plugin-notification
- [ ] Exportación de datos a CSV/Excel
- [ ] Settings y configuración de la app
- [ ] Mejorar el Dashboard con estadísticas en tiempo real
- [ ] Añadir filtros y búsqueda en proyectos
- [ ] Tema oscuro

## Licencia

MIT
