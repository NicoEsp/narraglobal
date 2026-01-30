

## Plan: Revertir Tipografía y Agrandar Logos de Clientes

### Cambios a Realizar

---

### 1. Revertir Tipografía a la Original

Eliminaré las fuentes personalizadas (Playfair Display e Inter) para volver a la tipografía del sistema.

**Archivos a modificar:**

| Archivo | Cambio |
|---------|--------|
| `index.html` | Eliminar los links de Google Fonts (líneas 7-9) |
| `tailwind.config.ts` | Eliminar la configuración de `fontFamily` personalizada |
| `src/index.css` | Eliminar las reglas de `font-display` para headings |

---

### 2. Agrandar Imágenes de Clientes

Aumentaré el tamaño de los contenedores de logos para que sean más visibles.

**Archivo a modificar:** `src/components/ClientLogos.tsx`

| Tamaño Actual | Tamaño Nuevo |
|--------------|--------------|
| `w-36 h-24` (móvil) | `w-44 h-32` (móvil) |
| `w-40 h-28` (sm) | `w-52 h-36` (sm) |
| - | `w-56 h-40` (md) - nuevo breakpoint |

Esto representa un aumento aproximado del **30-40%** en el tamaño visible de cada logo.

---

### Resultado Esperado

- Tipografía limpia del sistema (sin fuentes externas)
- Logos de clientes significativamente más grandes y visibles
- Carga más rápida del sitio (sin descargar fuentes de Google)

