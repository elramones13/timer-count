# 📖 Cómo Usar Timer Count

## ¿Qué es esto?

**Timer Count es una aplicación NATIVA de macOS** - como cualquier otra app que tienes instalada en tu Mac (Safari, Mail, etc.). NO es una página web, funciona 100% offline y local.

## 🚀 Iniciar la aplicación

```bash
npm run dev
```

Esto abrirá una **ventana de aplicación en tu Mac**. Verás la interfaz de Timer Count como una app normal de escritorio.

---

## ✅ Flujo de Uso (3 pasos simples)

### 1️⃣ Crear un Proyecto

Antes de poder trackear tiempo, necesitas crear al menos un proyecto:

1. Abre la app (`npm run dev`)
2. En el menú lateral, click en **"Projects"**
3. Click en el botón azul **"New Project"**
4. Rellena:
   - **Nombre**: (requerido) Ej: "Proyecto Cliente ABC"
   - Descripción: (opcional)
   - Color: para identificarlo fácilmente
5. Click en **"Create"**

### 2️⃣ Iniciar el Cronómetro

1. Ve al **Dashboard** (pantalla principal)
2. Verás todos tus proyectos como tarjetas
3. Click en el botón **▶️ Play verde** del proyecto donde vas a trabajar
4. **¡Listo!** El cronómetro empieza a contar automáticamente

**Puedes tener múltiples cronómetros corriendo a la vez** - útil si cambias entre tareas.

### 3️⃣ Detener y Guardar

Cuando termines de trabajar en ese proyecto:

1. Click en el botón **⏹️ Stop azul**
2. (Opcional) Escribe notas sobre lo que hiciste
3. Click en **"Stop & Save"**
4. ✅ **Se guarda automáticamente** en tu base de datos local

El registro incluye:
- Fecha
- Hora de inicio
- Hora de fin
- Duración total
- Notas (si agregaste)

---

## 📊 Ver tus registros

Todos los registros se guardan automáticamente en:
```
~/Library/Application Support/com.timercount.app/timer_count.db
```

Es una base de datos SQLite local en tu Mac.

**Próximamente**: Las vistas de Reports y Calendar mostrarán todos tus registros con gráficos.

---

## 💡 Consejos

- **Crea proyectos por tarea/cliente**: "Cliente X - Frontend", "Cliente Y - Bug fixes", etc.
- **Usa colores**: Facilita identificar proyectos rápidamente
- **Agrega notas**: Cuando detienes el timer, anota qué hiciste exactamente
- **Clientes opcionales**: Si trabajas para varios clientes, crea clientes primero y asigna proyectos a cada uno

---

## 🆘 Problemas comunes

### "No veo ningún proyecto en el Dashboard"
➡️ Primero debes crear proyectos en la sección "Projects"

### "Los inputs están en blanco"
➡️ Ya está arreglado - los inputs ahora tienen texto negro sobre fondo blanco

### "¿Dónde se guardan mis datos?"
➡️ Todo se guarda localmente en tu Mac en una base de datos SQLite
➡️ Ruta: `~/Library/Application Support/com.timercount.app/timer_count.db`

### "¿Funciona sin internet?"
➡️ ✅ Sí, 100% offline. Es una app local de escritorio.

---

## 🔜 Próximas funcionalidades

- [ ] Vista de Reports con gráficos de tiempo por proyecto
- [ ] Vista de Calendar con historial de todas las sesiones
- [ ] Exportar datos a CSV/Excel
- [ ] Notificaciones y recordatorios
