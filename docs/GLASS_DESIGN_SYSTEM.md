# 🎨 CryptoGift DAO - Glass Design System

## Reglas Obligatorias de Diseño

**Fecha de implementación:** 27 Nov 2025
**Estado:** ACTIVO - Todo nuevo componente DEBE seguir estas reglas

---

## 🔮 Principios del Sistema Glass

### 1. NUNCA usar colores hardcodeados para fondos/textos
```tsx
// ❌ INCORRECTO - No responde al tema
className="bg-white text-black"
className="bg-gray-100"

// ✅ CORRECTO - Usa clases glass o dark:
className="glass-card"
className="glass-panel"
className="bg-white dark:bg-slate-800"
className="text-gray-900 dark:text-white"
```

### 2. Clases Glass Disponibles

| Clase | Uso | Light Mode | Dark Mode |
|-------|-----|------------|-----------|
| `glass-panel` | Contenedores principales | Blanco 80% | Slate 75% |
| `glass-card` | Cards y paneles | Blanco 90% | Slate 85% |
| `glass-button` | Botones | Blanco 80% | Slate 80% |
| `glass-bubble` | Iconos circulares | Blanco 80% | Slate 70% |
| `text-glass` | Texto principal | #111827 | #FFFFFF |
| `text-glass-secondary` | Texto secundario | #6B7280 | #94A3B8 |
| `theme-gradient-bg` | Fondo de página | Azul/violeta claro | Slate/purple oscuro |

### 3. Patrón para Modales/Dialogs

```tsx
// Overlay/Backdrop
<div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

// Modal Container
<div className="glass-panel p-6">
  {/* Header */}
  <h2 className="text-xl font-bold text-glass">{title}</h2>
  <p className="text-glass-secondary">{description}</p>

  {/* Content */}
  <div className="glass-card p-4 mt-4">
    {/* ... */}
  </div>

  {/* Actions */}
  <button className="glass-button">Action</button>
</div>
```

### 4. Patrón para Badges/Tags

```tsx
// Badge que responde al tema
<span className="px-3 py-1 rounded-full
  bg-blue-100 dark:bg-blue-900/30
  text-blue-700 dark:text-blue-300
  border border-blue-200 dark:border-blue-700/50">
  Badge Text
</span>
```

### 5. Patrón para Info Cards (Reward, Time, etc.)

```tsx
<div className="glass-card p-4 text-center">
  <div className="w-10 h-10 glass-bubble mx-auto mb-2 flex items-center justify-center">
    <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
  </div>
  <p className="text-xs text-glass-secondary uppercase">{label}</p>
  <p className="text-lg font-bold text-glass">{value}</p>
</div>
```

### 6. Patrón para Alerts/Notices

```tsx
// Warning Notice
<div className="p-4 rounded-lg
  bg-amber-50 dark:bg-amber-900/20
  border border-amber-200 dark:border-amber-700/50">
  <h4 className="font-semibold text-amber-800 dark:text-amber-300">
    Important Notice
  </h4>
  <p className="text-amber-700 dark:text-amber-400 text-sm">
    {message}
  </p>
</div>

// Success Notice
<div className="p-4 rounded-lg
  bg-green-50 dark:bg-green-900/20
  border border-green-200 dark:border-green-700/50">
  {/* ... */}
</div>

// Error Notice
<div className="p-4 rounded-lg
  bg-red-50 dark:bg-red-900/20
  border border-red-200 dark:border-red-700/50">
  {/* ... */}
</div>
```

---

## 🎨 Paleta de Colores por Tema

### Light Theme
```css
--bg-primary: 255 255 255;        /* #FFFFFF */
--bg-glass: rgba(255,255,255,0.8);
--bg-card: rgba(255,255,255,0.9);
--text-primary: 17 24 39;         /* #111827 */
--text-secondary: 107 114 128;    /* #6B7280 */
--border-glass: rgba(226,232,240,0.4);
```

### Dark Theme
```css
--bg-primary: 10 14 21;           /* #0A0E15 */
--bg-glass: rgba(15,23,42,0.85);
--bg-card: rgba(26,29,41,0.92);
--text-primary: 255 255 255;      /* #FFFFFF */
--text-secondary: 148 163 184;    /* #94A3B8 */
--border-glass: rgba(148,163,184,0.2);
```

---

## ⚡ Transiciones

Todas las transiciones de tema usan:
```css
transition: background-color 0.3s ease,
            border-color 0.3s ease,
            color 0.3s ease,
            box-shadow 0.3s ease;
```

---

## 📋 Checklist para Nuevos Componentes

Antes de hacer commit, verificar:

- [ ] ¿Usa `glass-panel` o `glass-card` para contenedores?
- [ ] ¿Los textos usan `text-glass` y `text-glass-secondary`?
- [ ] ¿Los colores de fondo tienen variante `dark:`?
- [ ] ¿Los badges/tags tienen colores adaptables?
- [ ] ¿Los alerts usan el patrón con `dark:` variants?
- [ ] ¿Los iconos usan colores con variante `dark:`?
- [ ] ¿Se ve bien en Light Y Dark mode?

---

## 🚫 Anti-Patrones (PROHIBIDO)

```tsx
// ❌ NUNCA hacer esto:
className="bg-white"              // Sin dark variant
className="text-black"            // Sin dark variant
className="bg-gray-100"           // Color fijo
className="border-gray-200"       // Sin dark variant
style={{ backgroundColor: '#fff' }} // Inline styles para colores
```

---

## 📁 Archivos de Referencia

- **CSS Principal:** `app/globals.css`
- **Dashboard (ejemplo):** `app/page.tsx`
- **ThemeProvider:** `components/providers/ThemeProvider.tsx`

---

*Documento creado: 27/11/2025*
*Made by mbxarts.com The Moon in a Box property*
*Co-Author: Godez22*
