
## Plan: Mejoras de Impacto Alto + Esfuerzo Bajo

Voy a implementar mejoras visuales y de UX que transformarán significativamente la percepción del sitio con cambios relativamente simples.

---

### 1. Animaciones de Scroll (Fade-in al aparecer)

Agregaré un componente reutilizable que detecta cuando los elementos entran en pantalla y les aplica una animación suave de aparición.

**Archivos a crear/modificar:**
- Crear `src/hooks/useScrollAnimation.tsx` - Hook personalizado con Intersection Observer
- Crear `src/components/AnimatedSection.tsx` - Wrapper que aplica la animación

**Secciones que animarán:**
- Hero Section
- Clientes
- Política
- Industrias
- Pricing
- Emergencia

---

### 2. Tipografía Profesional

Agregaré Google Fonts con una combinación elegante:
- **Playfair Display** para títulos (serif, elegante)
- **Inter** para texto (sans-serif, legible)

**Archivos a modificar:**
- `index.html` - Agregar link a Google Fonts
- `tailwind.config.ts` - Configurar font families
- `src/index.css` - Aplicar fuentes base

---

### 3. Mayor Espaciado entre Secciones

Aumentaré el padding vertical de las secciones para dar más "aire" y sensación premium.

**Archivo a modificar:**
- `src/pages/Index.tsx` - Cambiar `py-20` a `py-28` o `py-32` en secciones clave

---

### 4. Mejoras en Hover States

Agregaré transiciones suaves a las cards de pricing y botones:
- Cards con elevación al hover
- Transiciones más fluidas

**Archivos a modificar:**
- `tailwind.config.ts` - Agregar keyframes para animaciones
- `src/components/PricingSection.tsx` - Agregar clases de hover

---

### 5. Indicador de Sección Activa en Navegación

El menú mostrará qué sección está visible actualmente mientras el usuario hace scroll.

**Archivo a modificar:**
- `src/components/Navigation.tsx` - Agregar Intersection Observer para detectar sección activa

---

### Resumen de Cambios

| Archivo | Tipo de Cambio |
|---------|----------------|
| `index.html` | Agregar Google Fonts |
| `tailwind.config.ts` | Fonts + animaciones |
| `src/index.css` | Variables de fuentes |
| `src/hooks/useScrollAnimation.tsx` | Nuevo hook |
| `src/components/AnimatedSection.tsx` | Nuevo componente |
| `src/pages/Index.tsx` | Envolver secciones + espaciado |
| `src/components/Navigation.tsx` | Indicador activo |
| `src/components/PricingSection.tsx` | Hover mejorado |
| `src/components/HeroSection.tsx` | Animación de entrada |

---

### Resultado Esperado

- Transiciones suaves al hacer scroll (elementos aparecen gradualmente)
- Tipografía más elegante y profesional
- Mejor jerarquía visual
- Interacciones más pulidas
- Navegación que indica dónde está el usuario

Todas estas mejoras son sutiles pero en conjunto elevan significativamente la percepción de calidad y profesionalismo del sitio.
