# 🎨 GUÍA DE CREACIÓN DE LOGOS CGC

**Versión**: 1.0
**Fecha**: 7 Diciembre 2025
**Estado**: Instrucciones para crear logos en dimensiones requeridas

Made by mbxarts.com The Moon in a Box property

---

## 📋 DIMENSIONES REQUERIDAS

Para el listing en CoinGecko y BaseScan, necesitamos logos en las siguientes dimensiones:

### CoinGecko Requirements:
- **32x32 pixels** (PNG) - Small logo
- **200x200 pixels** (PNG) - Large logo

### Opcional (recomendado):
- **64x64 pixels** (PNG) - Favicon
- **256x256 pixels** (PNG) - High quality
- **512x512 pixels** (PNG) - Extra high quality
- **SVG** - Vector format (scalable)

---

## 🔧 MÉTODOS PARA CREAR/REDIMENSIONAR LOGOS

### OPCIÓN 1: Usar herramientas online (MÁS FÁCIL)

#### A. Con Photopea (Editor similar a Photoshop, gratis)
**URL**: https://www.photopea.com/

1. Abrir Photopea en tu navegador
2. Arrastrar tu logo actual (CGC icon PNG.png o similar)
3. Ir a: `Image` → `Image Size`
4. Cambiar dimensiones a 32x32 o 200x200
5. **IMPORTANTE**: Activar "Resample" y seleccionar "Bicubic (smooth)"
6. Guardar como PNG: `File` → `Export As` → `PNG`
7. Repetir para cada dimensión

#### B. Con Squoosh (Compresión y redimensionamiento)
**URL**: https://squoosh.app/

1. Abrir Squoosh
2. Arrastrar tu logo
3. En panel derecho, sección "Resize"
4. Cambiar Width y Height a las dimensiones deseadas
5. Método: "Lanczos3" (mejor calidad)
6. Descargar imagen optimizada

#### C. Con Pixlr (Editor online)
**URL**: https://pixlr.com/x/

1. Abrir Pixlr Editor
2. Abrir tu logo: `Open Image` → Seleccionar archivo
3. Ir a: `Image` → `Image Size`
4. Cambiar Width y Height
5. Mantener "Constrain Proportions" activado
6. Guardar: `File` → `Save`

---

### OPCIÓN 2: Con Paint (Windows - Simple)

1. Abrir Paint (Windows + R → `mspaint`)
2. Abrir tu logo: `File` → `Open`
3. Click en `Resize` (Redimensionar) en la barra superior
4. Seleccionar "Pixels"
5. **DESMARCAR** "Maintain aspect ratio" si quieres dimensiones exactas
6. Ingresar Width: 32 y Height: 32 (o 200x200)
7. Guardar como PNG: `File` → `Save As` → `PNG picture`

**Repetir para cada dimensión necesaria.**

---

### OPCIÓN 3: Con PowerPoint/Google Slides (Creative Hack)

#### PowerPoint:
1. Crear nuevo slide
2. Ir a `Design` → `Slide Size` → `Custom Slide Size`
3. Configurar:
   - Width: 32 pixels (o 0.44 inches)
   - Height: 32 pixels (o 0.44 inches)
4. Insertar tu logo: `Insert` → `Pictures`
5. Ajustar para llenar el slide completo
6. Exportar: `File` → `Export` → `Change File Type` → `PNG`

#### Google Slides:
1. Crear presentación nueva
2. `File` → `Page Setup` → `Custom`
3. Configurar 32x32 pixels
4. Insertar imagen del logo
5. Exportar como PNG: `File` → `Download` → `PNG image`

---

### OPCIÓN 4: Con herramientas de línea de comandos (Avanzado)

#### A. Con ImageMagick (Windows/Mac/Linux)
```bash
# Instalar ImageMagick primero
# Windows: https://imagemagick.org/script/download.php

# Redimensionar a 32x32
magick convert "CGC icon PNG.png" -resize 32x32 "cgc-logo-32x32.png"

# Redimensionar a 200x200
magick convert "CGC icon PNG.png" -resize 200x200 "cgc-logo-200x200.png"

# Crear todas las dimensiones de una vez
magick convert "CGC icon PNG.png" -resize 32x32 "cgc-logo-32x32.png"
magick convert "CGC icon PNG.png" -resize 64x64 "cgc-logo-64x64.png"
magick convert "CGC icon PNG.png" -resize 200x200 "cgc-logo-200x200.png"
magick convert "CGC icon PNG.png" -resize 256x256 "cgc-logo-256x256.png"
magick convert "CGC icon PNG.png" -resize 512x512 "cgc-logo-512x512.png"
```

#### B. Con ffmpeg (si lo tienes instalado)
```bash
ffmpeg -i "CGC icon PNG.png" -vf scale=32:32 "cgc-logo-32x32.png"
ffmpeg -i "CGC icon PNG.png" -vf scale=200:200 "cgc-logo-200x200.png"
```

---

## 📁 ORGANIZACIÓN DE ARCHIVOS

Una vez creados, organizar así:

```
public/
├── metadata/
│   ├── cgc-logo-32x32.png      ← CoinGecko small
│   ├── cgc-logo-64x64.png      ← Favicon
│   ├── cgc-logo-200x200.png    ← CoinGecko large
│   ├── cgc-logo-256x256.png    ← High quality
│   ├── cgc-logo-512x512.png    ← Extra high
│   └── cgc-logo.svg            ← Vector (si disponible)
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de crear los logos, verificar:

- [ ] **32x32 PNG** existe y tiene exactamente 32x32 pixels
- [ ] **200x200 PNG** existe y tiene exactamente 200x200 pixels
- [ ] **Fondo transparente** en todos los logos PNG
- [ ] **Formato PNG** (no JPG ni WebP)
- [ ] **Tamaño de archivo razonable** (menos de 100KB cada uno)
- [ ] **Nombres correctos**: `cgc-logo-32x32.png` y `cgc-logo-200x200.png`
- [ ] **Ubicación correcta**: `public/metadata/`

---

## 🔍 VERIFICAR DIMENSIONES

### Método 1: Propiedades del archivo (Windows)
1. Click derecho en el archivo PNG
2. Seleccionar `Properties`
3. Ir a la pestaña `Details`
4. Ver "Dimensions" - debe decir "32 x 32" o "200 x 200"

### Método 2: Abrir en Paint
1. Abrir logo en Paint
2. Ver en la esquina inferior izquierda
3. Debe mostrar exactamente las dimensiones correctas

### Método 3: Online
1. Ir a: https://www.imgonline.com.ua/eng/determine-size-of-image.php
2. Upload tu logo
3. Ver dimensiones reportadas

---

## 🚀 DEPLOYMENT

Una vez creados y verificados:

1. **Copiar a la carpeta correcta**:
   ```bash
   # Asegurarte que exista la carpeta
   mkdir -p public/metadata

   # Copiar los logos
   cp cgc-logo-32x32.png public/metadata/
   cp cgc-logo-200x200.png public/metadata/
   ```

2. **Verificar URLs funcionan**:
   - https://crypto-gift-wallets-dao.vercel.app/metadata/cgc-logo-32x32.png
   - https://crypto-gift-wallets-dao.vercel.app/metadata/cgc-logo-200x200.png

3. **Hacer commit y deploy**:
   ```bash
   git add public/metadata/cgc-logo-*.png
   git commit -m "feat: add CoinGecko-compliant logo images (32x32, 200x200)"
   git push origin main
   ```

---

## 📞 NECESITAS AYUDA?

Si tienes problemas creando los logos:

1. **Opción fácil**: Usar Photopea (https://www.photopea.com/) - es gratis y funciona en el navegador
2. **Opción profesional**: Contratar diseñador en Fiverr ($5-10)
3. **Opción DIY**: Usar PowerPoint method (funciona sorprendentemente bien)

---

## 🎨 RECOMENDACIONES DE DISEÑO

Para mejores resultados:

- ✅ **Fondo transparente** (PNG con alpha channel)
- ✅ **Colores sólidos** (evitar gradientes complejos en logos pequeños)
- ✅ **Diseño simple** (logos pequeños deben ser minimalistas)
- ✅ **Alto contraste** (debe verse bien en dark y light mode)
- ✅ **Centrado** (logo debe estar centrado en el canvas)
- ✅ **Sin texto pequeño** (en 32x32 el texto es ilegible)

---

**© 2024-2025 The Moon in a Box Inc. All rights reserved.**

Made with ❤️ and maximum quality by Claude Code

---

**END OF GUIDE**
