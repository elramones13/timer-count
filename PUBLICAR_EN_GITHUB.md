# Guía para Publicar Timer Count en GitHub

Esta guía te ayudará a publicar tu aplicación en GitHub y configurar actualizaciones automáticas.

## 📋 Tabla de Contenidos

1. [Preparación Inicial](#preparación-inicial)
2. [Generar Claves de Firma](#generar-claves-de-firma)
3. [Publicar en GitHub](#publicar-en-github)
4. [Crear un Release](#crear-un-release)
5. [Actualizar la Aplicación](#actualizar-la-aplicación)

---

## 🛠️ Preparación Inicial

### 1. Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Nómbralo `timer-count` (o el nombre que prefieras)
3. Hazlo **público** para que la gente pueda descargarlo
4. **NO** inicialices con README (ya tienes uno)

### 2. Inicializar Git localmente

```bash
# En la carpeta del proyecto
cd /Users/user/Desktop/personal/timer-count

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Initial commit: Timer Count v0.1.0"

# Agregar el repositorio remoto (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/timer-count.git

# Subir al repositorio
git push -u origin main
```

---

## 🔐 Generar Claves de Firma

Las actualizaciones deben estar firmadas para seguridad. Necesitas generar un par de claves.

### 1. Generar el par de claves

```bash
# Instalar la herramienta de Tauri (si no la tienes)
npm install -g @tauri-apps/cli

# Generar las claves
npx tauri signer generate -w ~/.tauri/timer-count.key
```

Esto generará:
- **Clave privada**: `~/.tauri/timer-count.key` (archivo guardado localmente)
- **Clave pública**: Se mostrará en la terminal

### 2. Copiar la clave pública

La clave pública se verá así:
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFBQUFBQUFBQUFBQUE...
```

### 3. Actualizar tauri.conf.json

1. Abre `src-tauri/tauri.conf.json`
2. Busca la línea:
   ```json
   "pubkey": "REEMPLAZAR_CON_CLAVE_PUBLICA",
   ```
3. Reemplázala con tu clave pública:
   ```json
   "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFBQUFBQUFBQUFBQUE...",
   ```

### 4. Actualizar el endpoint

1. En el mismo archivo, busca:
   ```json
   "endpoints": [
     "https://github.com/TU_USUARIO/timer-count/releases/latest/download/latest.json"
   ],
   ```
2. Reemplaza `TU_USUARIO` con tu usuario de GitHub

### 5. Guardar y hacer commit

```bash
git add src-tauri/tauri.conf.json
git commit -m "Configure updater with public key"
git push
```

**⚠️ IMPORTANTE**:
- **NUNCA** subas la clave privada (`~/.tauri/timer-count.key`) a GitHub
- Guárdala en un lugar seguro
- La necesitarás para firmar cada actualización

---

## 📦 Publicar en GitHub

### 1. Construir la aplicación

```bash
# Construir para producción (tarda unos minutos)
npm run build
```

Esto creará los instaladores en `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` y `.app` en `dmg/` y `macos/`
  - `timer-count_0.1.0_aarch64.dmg` (Apple Silicon M1/M2/M3)
  - `timer-count_0.1.0_x64.dmg` (Intel Mac)
- **Windows**: `.exe` y `.msi` en `msi/` y `nsis/`
- **Linux**: `.deb`, `.AppImage` en sus respectivas carpetas

**IMPORTANTE:** El `.dmg` es lo que la gente descargará. Es un instalador completo que:
- Contiene toda la aplicación compilada
- NO requiere que el usuario instale Node.js, npm, Rust ni nada
- Se instala arrastrando a la carpeta Aplicaciones
- Funciona como cualquier otra app de macOS

Ver `COMO_GENERAR_DMG.md` para más detalles.

### 2. Firmar las actualizaciones

Tauri genera automáticamente archivos `.sig` junto a cada instalador. Estos son necesarios para las actualizaciones.

---

## 🚀 Crear un Release

### 1. Crear un tag de versión

```bash
# Asegúrate de que todo esté commiteado
git add .
git commit -m "Release v0.1.0"

# Crear un tag
git tag v0.1.0

# Subir el tag
git push origin v0.1.0
```

### 2. Crear el release en GitHub

1. Ve a tu repositorio en GitHub
2. Haz clic en "Releases" → "Create a new release"
3. Selecciona el tag `v0.1.0`
4. Título: `Timer Count v0.1.0`
5. Descripción (changelog):
   ```markdown
   ## ✨ Características principales

   - ⏱️ Temporizador de múltiples proyectos simultáneos
   - 📊 Gestión de proyectos y clientes
   - 📈 Estadísticas y reportes
   - 📅 Vista de calendario
   - 💾 Exportación de datos (JSON y PDF)
   - 🔔 Notificaciones y alarmas
   - 🎨 Interfaz moderna y personalizable

   ## 🆕 Primera versión

   Esta es la versión inicial de Timer Count.
   ```

### 3. Subir los archivos

Arrastra y suelta estos archivos en el release:

**Para macOS:**
- `timer-count_0.1.0_aarch64.dmg` (Apple Silicon)
- `timer-count_0.1.0_aarch64.dmg.sig`
- `timer-count_0.1.0_x64.dmg` (Intel Mac)
- `timer-count_0.1.0_x64.dmg.sig`

**Para Windows:**
- `timer-count_0.1.0_x64_en-US.msi`
- `timer-count_0.1.0_x64_en-US.msi.sig`
- `timer-count_0.1.0_x64-setup.exe`
- `timer-count_0.1.0_x64-setup.exe.sig`

**Para Linux:**
- `timer-count_0.1.0_amd64.deb`
- `timer-count_0.1.0_amd64.deb.sig`
- `timer-count_0.1.0_amd64.AppImage`
- `timer-count_0.1.0_amd64.AppImage.sig`

### 4. Crear el archivo latest.json

Crea un archivo llamado `latest.json` con este contenido:

```json
{
  "version": "0.1.0",
  "notes": "Características principales:\n- Temporizador de múltiples proyectos\n- Gestión de proyectos y clientes\n- Estadísticas y reportes\n- Exportación de datos",
  "pub_date": "2025-12-01T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "CONTENIDO_DEL_ARCHIVO_.dmg.sig_PARA_AARCH64",
      "url": "https://github.com/TU_USUARIO/timer-count/releases/download/v0.1.0/timer-count_0.1.0_aarch64.dmg"
    },
    "darwin-x86_64": {
      "signature": "CONTENIDO_DEL_ARCHIVO_.dmg.sig_PARA_X64",
      "url": "https://github.com/TU_USUARIO/timer-count/releases/download/v0.1.0/timer-count_0.1.0_x64.dmg"
    },
    "windows-x86_64": {
      "signature": "CONTENIDO_DEL_ARCHIVO_.msi.sig",
      "url": "https://github.com/TU_USUARIO/timer-count/releases/download/v0.1.0/timer-count_0.1.0_x64_en-US.msi"
    },
    "linux-x86_64": {
      "signature": "CONTENIDO_DEL_ARCHIVO_.AppImage.sig",
      "url": "https://github.com/TU_USUARIO/timer-count/releases/download/v0.1.0/timer-count_0.1.0_amd64.AppImage"
    }
  }
}
```

**Cómo obtener las firmas:**
```bash
# Para cada archivo .sig, copia su contenido
cat src-tauri/target/release/bundle/dmg/timer-count_0.1.0_aarch64.dmg.sig
```

### 5. Subir latest.json

Sube también el archivo `latest.json` al release.

### 6. Publicar el release

Haz clic en "Publish release".

---

## 🔄 Actualizar la Aplicación

Cuando quieras publicar una nueva versión:

### 1. Actualizar la versión

Edita estos archivos:

**package.json:**
```json
{
  "version": "0.2.0"
}
```

**src-tauri/tauri.conf.json:**
```json
{
  "version": "0.2.0"
}
```

**src-tauri/Cargo.toml:**
```toml
[package]
version = "0.2.0"
```

**src/views/Settings.tsx:**
```tsx
const [currentVersion] = useState('0.2.0');
```

### 2. Hacer commit y build

```bash
# Commit de los cambios
git add .
git commit -m "Bump version to 0.2.0"
git push

# Construir la nueva versión
npm run build
```

### 3. Crear nuevo release

Repite el proceso de creación de release con:
- Tag: `v0.2.0`
- Título: `Timer Count v0.2.0`
- Archivos: Los nuevos instaladores y archivos `.sig`
- Actualizar `latest.json` con la nueva versión y URLs

### 4. Probar la actualización

1. Abre la aplicación anterior (v0.1.0)
2. Ve a Configuración
3. Haz clic en "Buscar actualizaciones"
4. Debería detectar la v0.2.0 y mostrar los cambios
5. Haz clic en "Instalar actualización"

---

## 📝 Script Automatizado (Opcional)

Puedes crear un script para simplificar el proceso:

**scripts/release.sh:**
```bash
#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh VERSION"
  echo "Example: ./scripts/release.sh 0.2.0"
  exit 1
fi

echo "🚀 Creating release v$VERSION"

# Update versions
npm version $VERSION --no-git-tag-version
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i '' "s/version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml

# Build
echo "📦 Building..."
npm run build

# Commit and tag
git add .
git commit -m "Release v$VERSION"
git tag v$VERSION
git push origin main
git push origin v$VERSION

echo "✅ Release v$VERSION created!"
echo "📋 Next steps:"
echo "  1. Go to GitHub and create a new release for tag v$VERSION"
echo "  2. Upload the installers and signatures from src-tauri/target/release/bundle/"
echo "  3. Create and upload latest.json"
echo "  4. Publish the release"
```

Uso:
```bash
chmod +x scripts/release.sh
./scripts/release.sh 0.2.0
```

---

## ✅ Checklist de Publicación

Antes de publicar, verifica:

- [ ] El `.gitignore` está actualizado
- [ ] No hay datos sensibles en el código
- [ ] CSP está habilitado en `tauri.conf.json`
- [ ] La clave pública está en `tauri.conf.json`
- [ ] El endpoint apunta a tu repositorio de GitHub
- [ ] Has generado y guardado la clave privada
- [ ] La versión está actualizada en todos los archivos
- [ ] Hiciste `npm run build` exitosamente
- [ ] Creaste el tag de versión
- [ ] Subiste todos los instaladores y archivos `.sig`
- [ ] Creaste el archivo `latest.json` correcto
- [ ] Publicaste el release en GitHub

---

## 🆘 Solución de Problemas

### Error: "Failed to verify signature"
- Verifica que la clave pública en `tauri.conf.json` es correcta
- Asegúrate de que los archivos `.sig` corresponden a los instaladores

### Error: "Update not found"
- Verifica que `latest.json` está en la URL correcta
- Comprueba que el endpoint en `tauri.conf.json` apunta al archivo correcto

### Error al construir
- Ejecuta `cargo clean` en `src-tauri/`
- Ejecuta `npm install` de nuevo
- Verifica que tienes Rust instalado: `rustc --version`

---

## 📚 Recursos Adicionales

- [Documentación de Tauri](https://tauri.app)
- [Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [GitHub Releases](https://docs.github.com/es/repositories/releasing-projects-on-github)

---

## 🎉 ¡Listo!

Tu aplicación ahora está publicada en GitHub y los usuarios pueden:
1. Descargar el instalador desde GitHub Releases
2. Instalar la aplicación
3. Recibir actualizaciones automáticas cuando publiques nuevas versiones

¡Felicidades! 🎊
