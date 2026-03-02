

## Plan: Agregar botón "Chatea con NarraAsist" junto a "Medir mi narrativa"

### Cambio

Agregar un segundo botón en la barra de navegación, al lado de "Medir mi narrativa", que abra `https://narra-assist.lovable.app/` en una nueva pestaña.

### Archivo a modificar

**`src/pages/Index.tsx` (línea 180)**

Agregar un enlace `<a>` con la clase `nav-cta` justo al lado del botón existente, con `target="_blank"` para abrir en nueva pestaña:

```tsx
<a className="nav-cta" href="#narraasist">Medir mi narrativa</a>
<a className="nav-cta" href="https://narra-assist.lovable.app/" target="_blank" rel="noopener noreferrer">Chatea con NarraAsist</a>
```

Ambos botones compartirán exactamente los mismos estilos (`nav-cta`), manteniendo la consistencia visual del sitio. El enlace externo se abrirá en una nueva pestaña para no sacar al usuario del sitio principal.

### Ajuste responsive opcional

En la media query móvil del CSS, los dos botones ya deberían caber bien gracias al `white-space:nowrap` y padding reducido. Si se ven apretados, se puede agregar un pequeño `gap` al contenedor de la navbar.
