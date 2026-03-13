

## Plan: Actualizar landing completa con nuevo diseño

### Resumen
El HTML del diseñador trae un rediseño completo del sitio con cambios importantes en estructura, contenido y estilo visual. La implementación implica reescribir `Index.tsx` y `index.css` casi por completo.

### Cambios principales vs. sitio actual

| Aspecto | Actual | Nuevo |
|---|---|---|
| Hero headline | "Amamos las narrativas" | "Dato mejora relato." |
| Sección NarraNoise | Dentro de "Productos" split | Sección 50/50 propia con grid bg, lista de beneficios y chart visual con dashboard flotante |
| Combos/Servicios | Timeline + planes de precios | 2 cards grandes (NarraAsist + Workshops) con slide-out panels para planes y cotización |
| Reportes | Lista simple con 3 items | Sistema de tabs (Todos/Política/Liderazgo/Deporte/Crisis) con hero destacado + sidebar + 3 data viz cards + press logos |
| Pricing | Sección con 3 planes | Dentro del slide-out panel de NarraAsist (Starter/Professional/Enterprise) |
| Carta del Founder | Sección propia | Eliminada |
| Narrawork | Sección propia | Integrado como card en Combos + slide-out panel |
| CTA Cierre | "La narrativa no es lo que decís..." | "Tu narrativa puede más." |
| Footer | Minimal 1 línea | 3 columnas (Producto/Empresa/Legal) |
| Fonts | Sin Caveat | Agrega Caveat |

### Requisito del usuario
Mantener en el nav los dos botones: **NarraAsist** (link a narra-assist.lovable.app) + **Medir mi narrativa** (ahora apunta a `#combos` en vez de `#narraasist`).

### Plan de implementación

1. **Actualizar `index.html`** — Agregar font Caveat al link de Google Fonts

2. **Reescribir `src/index.css`** — Reemplazar todos los estilos con los del nuevo HTML:
   - Tema light (body bg blanco, color #555)
   - Nuevos estilos: `.nn-section`, `.nn-grid`, `.benefit-list`, `.combos-section`, `.service-card`, `.reportes-section` con tabs, `.reports-featured`, `.report-hero`, `.report-list-item`, `.report-viz-card`, `.slide-panel`, `.cta-close`, footer 3-column
   - Responsive breakpoints (900px y 480px)
   - Mantener estilos del hero chart y logos scroll existentes

3. **Reescribir `src/pages/Index.tsx`** — Nueva estructura de secciones:
   - **Nav**: Mantener los dos botones (NarraAsist + Medir mi narrativa), logo con colores adaptados al fondo blanco
   - **Hero**: Nuevo headline "Dato mejora relato." con claim actualizado y dos CTAs (mantener chart animado)
   - **Logos**: Mismo componente, ajustar estilos para fondo blanco (filter: invert)
   - **NarraNoise 50/50**: Grid con texto/beneficios a la izquierda y SVG chart + dashboard flotante a la derecha
   - **Combos**: Dos service cards con imágenes/mockups y CTAs que abren slide-out panels
   - **Reportes**: Sistema de tabs con React state, featured report + sidebar list + 3 data viz cards + press logos + WhatsApp CTA
   - **CTA Close**: "Tu narrativa puede más."
   - **Footer**: 3 columnas
   - **Slide-out Panels**: Dos paneles (NarraAsist plans + Workshop quote) con formularios que envían por mailto

4. **Eliminar constante `SIGNATURE_BASE64`** del Index.tsx (la carta del founder se elimina)

### Secciones eliminadas
- Productos split (NarraNoise + NarraAsist)
- Timeline "Cómo funciona"
- Pricing con 3 planes visibles
- Carta del Founder
- Narrawork sección independiente

### Detalle técnico de los tabs de Reportes
Se implementará con `useState` para el tab activo, mostrando/ocultando el contenido de cada tab (todos, politica, liderazgo, deporte, crisis). Cada tab tiene su propio `reports-featured` con hero + sidebar.

### Slide-out panels
Se implementarán con React state (`openPanel: string | null`) controlando overlay + panel con animación CSS. Los formularios enviarán por `mailto:lisandro@narraglobal.com` con datos formateados. Cierre con Escape key y click en overlay.

### Archivos a modificar
| Archivo | Acción |
|---|---|
| `index.html` | Agregar font Caveat |
| `src/index.css` | Reescribir completo |
| `src/pages/Index.tsx` | Reescribir completo |

