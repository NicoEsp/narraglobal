> **Cómo quedó montado en este monorepo.** Acá no hay una carpeta por cliente ni un
> `<script src="clientes/…/datos.js">`: los datos de cada semana viven en Supabase
> (`tableros.datos`) y `src/lib/tablero.ts` los inyecta en runtime sobre
> `public/tablero/index.html`, reemplazando el `<script src="datos.js">` por
> `window.NARRA_RANKING = {…}`. El resto de este documento es el contrato original
> del 15-09 y sigue valiendo tal cual: la plantilla no se toca para emitir, y lo que
> cambia por cliente y por semana es sólo el `datos.js` que se pega en `/admin`.
> El bloque «lo que carga Lisandro» (meta del cliente, copys, siluetas) va **adentro**
> de ese `datos.js`; el ejemplo completo está en `ejemplos/datos_ciro_W36.js`.
> Ver `docs/SUSCRIPCIONES.md` §1 y §3.

# MONTAJE en el monorepo — Narra ID v2

Tres archivos. `index.html` es la base y **no se toca nunca**; lo único que cambia por
cliente y por semana es `datos.js`.

    index.html     la plantilla. Carga datos.js y arma todo desde ahí.
    datos.js       la emisión del cliente. Define window.NARRA_RANKING.
    LEEME.md       el contrato, las reglas de código y el adversarial del 15-09.

## Cómo se carga

`index.html` trae, antes del script de armado:

    <script src="datos.js"></script>

El armado corre después y lee `window.NARRA_RANKING`. **El orden importa**: si `datos.js`
no cargó, el tablero queda vacío y sin error visible.

## Para ver la variación de otro cliente

Se reemplaza `datos.js` por el del cliente y se recarga. Nada más.
En el monorepo conviene una carpeta por cliente y que la ruta apunte ahí:

    clientes/ciro/datos.js
    clientes/reyes/datos.js

y en la página de cada uno, `<script src="clientes/<cliente>/datos.js"></script>`.

Si se sirve con caché agresiva, versionar la ruta —`datos.js?w=36`— o el tablero puede
quedar mostrando la semana anterior.

## Lo que el archivo de datos tiene que traer

`schema_version: 2`, igual que la entrega del 10-09. Si una clave no la produce el motor
va en `null` con su `origen`, y la plantilla lo resuelve sola: sin foto salen iniciales,
sin pieza destacada no aparece el play, sin cancha no se dibuja esa card.

## Prueba de humo, hecha el 15-09

Con `datos.js` de Ciro W36, en Chromium a 1200 px: tres cards de semana, tres de cancha,
tablas de 10 · 10 · 11 filas (la de 11 es nacional, con la fila del cliente fuera del top
diez), seis piezas con play y **cero errores de consola**.

---

*narraglobal · 15-09-2026*
