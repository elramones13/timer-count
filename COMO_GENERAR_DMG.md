# 📦 Cómo Generar el .DMG para Distribución

## Lo que la gente descargará

Cuando hagas el build, obtendrás un archivo `.dmg` que la gente puede:
1. **Descargar desde GitHub**
2. **Hacer doble clic en el .dmg**
3. **Arrastrar la app a la carpeta Aplicaciones**
4. **Usar la app** (sin necesidad de instalar nada más)

**NO necesitan:**
- Node.js
- npm
- Rust
- Hacer `npm run dev`
- Nada técnico

---

## 🚀 Generar el .DMG

### Paso 1: Construir la aplicación

```bash
# En la carpeta del proyecto
cd /Users/user/Desktop/personal/timer-count

# Generar el .dmg (tarda unos minutos)
npm run build
```

Esto:
- Compila todo el código
- Crea el instalador `.dmg`
- Lo coloca en la carpeta de distribución

### Paso 2: Encontrar el .dmg

El `.dmg` estará en:

```
src-tauri/target/release/bundle/dmg/
```

**En tu Mac (Apple Silicon):**
```
timer-count_0.1.0_aarch64.dmg  (para Macs M1/M2/M3)
timer-count_0.1.0_x64.dmg      (para Macs Intel)
```

### Paso 3: Probar el .dmg localmente

**Antes de subirlo a GitHub, pruébalo:**

```bash
# Abrir la carpeta donde está el .dmg
open src-tauri/target/release/bundle/dmg/
```

1. Haz doble clic en el `.dmg`
2. Se abre una ventana
3. Arrastra el ícono de Timer Count a Aplicaciones
4. Abre la app desde Aplicaciones
5. **¡Funciona sin necesidad de terminal!**

---

## 📤 Publicar en GitHub

### Opción 1: Manual (Recomendado para empezar)

1. **Ve a GitHub** → Tu repositorio → Releases
2. **Click en "Create a new release"**
3. **Tag version:** `v0.1.0`
4. **Release title:** `Timer Count v0.1.0`
5. **Descripción:**
   ```markdown
   ## 🎉 Primera versión de Timer Count

   ### ✨ Características principales

   - ⏱️ Temporizador de múltiples proyectos simultáneos
   - 📊 Gestión de proyectos y clientes
   - 💾 Exportación de datos (JSON y PDF)
   - 🔄 Actualizaciones automáticas
   - 🔔 Notificaciones y alarmas

   ### 📥 Instalación

   **Para Mac M1/M2/M3 (Apple Silicon):**
   - Descarga `timer-count_0.1.0_aarch64.dmg`

   **Para Mac Intel:**
   - Descarga `timer-count_0.1.0_x64.dmg`

   **Cómo instalar:**
   1. Abre el .dmg descargado
   2. Arrastra Timer Count a Aplicaciones
   3. Abre Timer Count desde Aplicaciones
   4. ¡Listo!

   ### 🔐 Seguridad en macOS

   La primera vez que abras la app, macOS puede mostrar un aviso de seguridad:
   1. Ve a Preferencias del Sistema → Privacidad y Seguridad
   2. Click en "Abrir de todas formas"
   3. Confirma que quieres abrir Timer Count
   ```

6. **Arrastra los archivos:**
   - `timer-count_0.1.0_aarch64.dmg`
   - `timer-count_0.1.0_aarch64.dmg.sig`
   - `timer-count_0.1.0_x64.dmg`
   - `timer-count_0.1.0_x64.dmg.sig`
   - `latest.json` (créalo según PUBLICAR_EN_GITHUB.md)

7. **Publish release**

---

## 👥 Lo que verá el usuario

### Descarga desde GitHub:

```
Tu usuario descarga: timer-count_0.1.0_aarch64.dmg (50-80 MB)
```

### Instalación:

1. **Doble clic en el .dmg**
   - Se monta una imagen de disco
   - Aparece una ventana con el ícono de Timer Count

2. **Arrastrar a Aplicaciones**
   - Arrastra el ícono a la carpeta Aplicaciones
   - Se copia la app (unos segundos)

3. **Abrir la app**
   - Ir a Aplicaciones
   - Doble clic en Timer Count
   - **¡La app se abre y funciona!**

### Primera ejecución en macOS:

macOS Gatekeeper mostrará un aviso porque la app no está firmada con certificado de Apple Developer (cuesta $99/año).

**El usuario debe:**
1. Click derecho en Timer Count
2. Seleccionar "Abrir"
3. Click en "Abrir" en el diálogo
4. **O ir a Preferencias del Sistema → Privacidad y Seguridad → "Abrir de todas formas"**

Después de esto, la app abrirá normalmente siempre.

---

## 🔐 Firmar la App (Opcional pero Recomendado)

Para evitar el mensaje de seguridad, necesitas:

### Opción 1: Certificado de Apple Developer ($99/año)

```bash
# Requiere cuenta de Apple Developer
# Configura en src-tauri/tauri.conf.json:
{
  "bundle": {
    "macOS": {
      "signingIdentity": "TU_IDENTIDAD_DE_FIRMA"
    }
  }
}
```

### Opción 2: Documentar en el README

Explica a los usuarios cómo abrir apps de "desarrolladores no identificados":

```markdown
## ⚠️ Aviso de Seguridad en macOS

macOS puede mostrar un aviso la primera vez porque Timer Count es una app gratuita
sin certificado de Apple Developer ($99/año).

**Cómo abrir Timer Count de forma segura:**

1. Click derecho en Timer Count.app
2. Selecciona "Abrir"
3. Click en "Abrir" en el diálogo

O bien:

1. Ve a Preferencias del Sistema
2. Privacidad y Seguridad
3. Click en "Abrir de todas formas" junto a Timer Count
```

---

## 📊 Tamaño de los archivos

**Aproximado:**
- `.dmg` para Apple Silicon: ~50-80 MB
- `.dmg` para Intel: ~50-80 MB

Esto incluye:
- La aplicación completa
- SQLite embebido
- Todas las dependencias
- Assets (imágenes, sonidos)

**El usuario solo descarga el .dmg de su arquitectura** (50-80 MB)

---

## 🔄 Actualizaciones Automáticas

Una vez que el usuario instala la app:

1. **La app está instalada y funciona**
2. **Cuando publiques v0.2.0 en GitHub:**
   - El usuario abre Timer Count
   - Va a Configuración → Actualizaciones
   - Click en "Buscar actualizaciones"
   - **Ve que hay v0.2.0 disponible**
   - Click en "Instalar actualización"
   - **Se descarga el nuevo .dmg automáticamente**
   - **Se instala y reinicia**

**El usuario NO necesita:**
- Volver a GitHub
- Descargar el .dmg manualmente
- Reinstalar nada

---

## ✅ Checklist Rápido

Para distribuir tu app:

- [ ] `npm run build` → Genera el .dmg
- [ ] Probar el .dmg localmente
- [ ] Subir .dmg y .dmg.sig a GitHub Release
- [ ] Crear latest.json
- [ ] Publicar el release
- [ ] Compartir el link del release

**Link de descarga será:**
```
https://github.com/TU_USUARIO/timer-count/releases/latest
```

Los usuarios hacen clic en el .dmg y lo descargan.

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────┐
│  1. TÚ: npm run build               │
│     └─> Genera .dmg                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. TÚ: Subes .dmg a GitHub Release │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. USUARIO: Descarga .dmg          │
│     └─> 1 archivo (50-80 MB)        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. USUARIO: Doble clic en .dmg     │
│     └─> Arrastra a Aplicaciones     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. USUARIO: Abre la app            │
│     └─> ¡FUNCIONA! ✅               │
└─────────────────────────────────────┘
```

---

## 💡 Preguntas Frecuentes

### ¿El usuario necesita instalar algo más?
**No.** El .dmg incluye todo lo necesario.

### ¿Funciona en cualquier Mac?
- `.dmg` con `aarch64`: Macs M1/M2/M3/M4 (Apple Silicon)
- `.dmg` con `x64`: Macs Intel

### ¿Cuánto pesa la descarga?
~50-80 MB por .dmg

### ¿Necesito certificado de Apple?
**No es obligatorio**, pero sin él:
- macOS muestra aviso de seguridad la primera vez
- El usuario debe hacer click derecho → Abrir
- Después funciona normal

Con certificado ($99/año):
- No hay avisos
- Instalación más profesional

### ¿Puedo distribuir gratis?
**Sí**, GitHub permite:
- Releases ilimitados
- Archivos hasta 2 GB cada uno
- Descargas ilimitadas

---

## 🚀 ¡Listo!

Tu aplicación está lista para distribuir. Los usuarios descargarán un solo archivo (.dmg),
lo instalarán arrastrando a Aplicaciones, y tendrán una app nativa de macOS funcionando
sin necesidad de Node, npm, Rust ni nada técnico.

**Siguiente paso:** Construye tu .dmg con `npm run build` y pruébalo tú mismo.
