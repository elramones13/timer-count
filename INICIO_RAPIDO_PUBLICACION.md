# 🚀 Inicio Rápido - Publicar en GitHub

## Lo más importante primero

**Tu app es un .dmg que la gente descarga y usa directamente.**
- ❌ NO necesitan instalar Node.js, npm, Rust, etc.
- ❌ NO necesitan hacer `npm run dev`
- ✅ Solo descargan el .dmg
- ✅ Lo arrastran a Aplicaciones
- ✅ ¡Funciona!

---

## 📝 Pasos en orden (5 minutos)

### 1️⃣ Generar las claves de firma

```bash
npx tauri signer generate -w ~/.tauri/timer-count.key
```

**Salida:**
```
Your keypair was generated successfully!
Public key: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFBQUFBQUFBQUFBQUE...
Private key: ~/.tauri/timer-count.key
```

**→ Copia la clave pública** (todo el texto largo)

---

### 2️⃣ Actualizar la configuración

**Edita:** `src-tauri/tauri.conf.json`

Busca la línea 44:
```json
"pubkey": "REEMPLAZAR_CON_CLAVE_PUBLICA",
```

Reemplázala con tu clave pública:
```json
"pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFBQUFBQUFBQUFBQUE...",
```

Busca la línea 46:
```json
"https://github.com/TU_USUARIO/timer-count/releases/latest/download/latest.json"
```

Reemplaza `TU_USUARIO` con tu usuario de GitHub:
```json
"https://github.com/juan123/timer-count/releases/latest/download/latest.json"
```

**Guarda el archivo.**

---

### 3️⃣ Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `timer-count`
3. Público ✅
4. NO marques "Add a README"
5. Crear repositorio

**GitHub te mostrará comandos.** Cópialos y ejecútalos:

```bash
# En la carpeta del proyecto
cd /Users/user/Desktop/personal/timer-count

git init
git add .
git commit -m "Initial commit: Timer Count v0.1.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/timer-count.git
git push -u origin main
```

---

### 4️⃣ Generar el .dmg

```bash
npm run build
```

**Esto tarda 3-5 minutos.** Verás:
```
    Finished release [optimized] target(s) in 2m 34s
    Bundling timer-count.app (/Users/user/Desktop/personal/timer-count/src-tauri/target/release/bundle/macos)
    Bundling timer-count_0.1.0_aarch64.dmg (/Users/user/Desktop/personal/timer-count/src-tauri/target/release/bundle/dmg)
```

**El .dmg está en:** `src-tauri/target/release/bundle/dmg/`

---

### 5️⃣ Crear el Release en GitHub

**A) Crear tag:**
```bash
git tag v0.1.0
git push origin v0.1.0
```

**B) Ir a GitHub:**
1. Tu repositorio → Releases → "Create a new release"
2. Choose tag: `v0.1.0`
3. Release title: `Timer Count v0.1.0`
4. Descripción:

```markdown
## 🎉 Primera versión de Timer Count

Aplicación nativa para macOS que te permite rastrear tiempo en múltiples proyectos.

### ✨ Características

- ⏱️ Temporizadores simultáneos para múltiples proyectos
- 📊 Gestión completa de proyectos y clientes
- 💾 Exportación de datos (JSON y PDF)
- 🔄 Actualizaciones automáticas
- 🎨 Interfaz moderna

### 📥 Instalación

**Mac con Apple Silicon (M1/M2/M3):**
Descarga `timer-count_0.1.0_aarch64.dmg`

**Mac con Intel:**
Descarga `timer-count_0.1.0_x64.dmg`

**Cómo instalar:**
1. Abre el .dmg
2. Arrastra Timer Count a Aplicaciones
3. Abre desde Aplicaciones

### ⚠️ Primera apertura

macOS puede mostrar un aviso de seguridad:
- Click derecho en Timer Count
- "Abrir"
- Confirma en el diálogo
```

**C) Subir archivos:**

Arrastra estos archivos desde `src-tauri/target/release/bundle/dmg/`:
- `timer-count_0.1.0_aarch64.dmg`
- `timer-count_0.1.0_aarch64.dmg.sig`
- `timer-count_0.1.0_x64.dmg` (si existe)
- `timer-count_0.1.0_x64.dmg.sig` (si existe)

**D) Crear latest.json:**

Crea un archivo `latest.json` con:

```json
{
  "version": "0.1.0",
  "notes": "Primera versión de Timer Count\n\n✨ Características:\n- Temporizadores simultáneos\n- Gestión de proyectos y clientes\n- Exportación de datos\n- Actualizaciones automáticas",
  "pub_date": "2025-12-01T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "AQUI_VA_EL_CONTENIDO_DEL_.dmg.sig",
      "url": "https://github.com/TU_USUARIO/timer-count/releases/download/v0.1.0/timer-count_0.1.0_aarch64.dmg"
    }
  }
}
```

**Para obtener la signature:**
```bash
cat src-tauri/target/release/bundle/dmg/timer-count_0.1.0_aarch64.dmg.sig
```

Copia TODO el contenido y pégalo en el campo `signature`.

**Reemplaza `TU_USUARIO`** con tu usuario de GitHub.

**Sube** `latest.json` al release también.

**E) Publicar:**

Click en **"Publish release"**

---

## ✅ ¡Listo!

Tu app ya está publicada. El link de descarga es:

```
https://github.com/TU_USUARIO/timer-count/releases/latest
```

**Comparte ese link** y la gente podrá:
1. Descargar el .dmg
2. Instalarlo
3. Usar Timer Count

---

## 🔄 Para publicar actualizaciones

### Cuando hagas cambios:

1. **Actualizar versión** en 3 archivos:
   - `package.json` → `"version": "0.2.0"`
   - `src-tauri/tauri.conf.json` → `"version": "0.2.0"`
   - `src-tauri/Cargo.toml` → `version = "0.2.0"`
   - `src/views/Settings.tsx` → `const [currentVersion] = useState('0.2.0')`

2. **Commit y build:**
   ```bash
   git add .
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push origin main
   git push origin v0.2.0
   npm run build
   ```

3. **Crear nuevo release** en GitHub con tag `v0.2.0`

4. **Subir los nuevos .dmg y .dmg.sig**

5. **Actualizar latest.json** con la nueva versión

6. **Publicar**

**→ Los usuarios abrirán la app → Configuración → Buscar actualizaciones → ¡Verán v0.2.0!**

---

## 📚 Documentación completa

- `COMO_GENERAR_DMG.md` - Todo sobre el .dmg
- `PUBLICAR_EN_GITHUB.md` - Guía detallada completa
- `README.md` - Información del proyecto

---

## 🆘 Problemas comunes

**"No se encuentra el .dmg después de npm run build"**
→ Revisa `src-tauri/target/release/bundle/dmg/`

**"El build falla"**
→ Ejecuta: `cd src-tauri && cargo clean && cd .. && npm run build`

**"macOS dice que la app está dañada"**
→ Normal sin certificado de Apple ($99/año)
→ El usuario debe: click derecho → Abrir → Confirmar

**"Las actualizaciones no funcionan"**
→ Verifica que `latest.json` está en la URL correcta
→ Verifica que la clave pública está bien copiada

---

## 🎯 Resumen ultra rápido

```bash
# 1. Generar claves
npx tauri signer generate -w ~/.tauri/timer-count.key

# 2. Copiar clave pública a src-tauri/tauri.conf.json

# 3. Subir a GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/timer-count.git
git push -u origin main

# 4. Generar .dmg
npm run build

# 5. Crear release en GitHub y subir archivos
git tag v0.1.0
git push origin v0.1.0
# Luego crear release en la web de GitHub
```

**¡Eso es todo!** 🎉
