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
En el paquete suelto conviene una carpeta por cliente y que la ruta apunte ahí
(**en este monorepo no aplica**: los datos se inyectan en runtime, ver la nota de arriba):

    clientes/ciro/datos.js
    clientes/reyes/datos.js

y en la página de cada uno, `<script src="clientes/<cliente>/datos.js"></script>`.

Si se sirve con caché agresiva, versionar la ruta —`datos.js?w=36`— o el tablero puede
quedar mostrando la semana anterior.

## Lo que el archivo de datos tiene que traer

`schema_version: 2`, igual que la entrega del 10-09. Si una clave no la produce el motor
va en `null` con su `origen`, y la plantilla lo resuelve sola: sin foto salen iniciales,
sin pieza destacada no aparece el play, sin cancha no se dibuja esa card.

## Las fotos (18-09-2026)

Las caras ya no vienen del `datos.js`. Hay **un solo álbum** en Supabase Storage,
bucket público `fotos`, y el tablero arma la ruta solo:

    window.NARRA_FOTOS_BASE + actor_id + '.' + extension

`src/lib/tablero.ts` inyecta `NARRA_FOTOS_BASE` junto con `NARRA_RANKING`, en el mismo
reemplazo del `<script src="datos.js">`. Las extensiones se prueban en cadena (ver «Los
tres formatos» más abajo) y, si ninguna está en el bucket, el `onerror` del `<img>` lo
cambia por las iniciales: **nunca un ícono roto**. Si no hay base inyectada
—abrir el `index.html` suelto, sin pasar por la app— manda el `r.foto` que traiga el
`datos.js`, así el paquete suelto sigue funcionando igual que antes.

El campo `foto` del `datos.js` quedó de respaldo y ya no hace falta llenarlo.

⚠ **Esto rompe la regla de arriba**: `av()` en `index.html` está editado a mano
(línea ~641). Es la única edición que la plantilla tiene contra la muda del 15-09.
Al subir una muda nueva hay que volver a aplicar ese parche, o las caras desaparecen
sin ningún error: vuelven todas a iniciales y nadie se entera.

El bucket y sus políticas están en `supabase/migrations/20260918120000_bucket_fotos.sql`
(lectura pública, subida y borrado sólo admin). La migración es idempotente porque el
bucket se había creado a mano por SQL el 17-09.

### Los tres formatos

El bucket acepta `webp`, `jpeg` y `png`, y el tablero busca la cara en ese orden:

    <actor_id>.webp → .jpg → .jpeg → .png → iniciales

La cadena va por `onerror`, un formato por vez, no los cuatro en paralelo. Así la foto
que está cuesta **un solo pedido** y sólo la que falta paga los intentos de más. Hoy los
239 archivos del bucket son `.webp`, con lo cual en la práctica es un pedido por cara.

El costo del otro extremo: un actor sin ninguna foto genera cuatro pedidos fallidos antes
de mostrar iniciales. No se ve nada roto, pero quedan cuatro 400 en la consola. Si algún
día pesa, la salida es subir la foto que falta, no tocar la cadena.

La lista vive en `EXT_FOTO` arriba de `av()`. Si se suma un formato a la política de
subida hay que sumarlo también ahí, o las fotos en ese formato entran al bucket y no se
ven nunca.

## Prueba de humo, hecha el 15-09

Con `datos.js` de Ciro W36, en Chromium a 1200 px: tres cards de semana, tres de cancha,
tablas de 10 · 10 · 11 filas (la de 11 es nacional, con la fila del cliente fuera del top
diez), seis piezas con play y **cero errores de consola**.

---

*narraglobal · 15-09-2026*
