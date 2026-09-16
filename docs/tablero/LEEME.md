# TABLERO Narra ID · v2 «todo a la vista» — 15-09-2026

Reemplaza a `narraid-tablero-2026-09-10.zip`. Mismo contrato de datos (`schema_version: 2`),
misma plantilla: **no se toca `index.html` para emitir**, todo sale de `datos.js`.

## Qué cambió contra el 10-09

- **Ningún desplegable.** Se eliminaron los seis: tres de «tu semana» y tres de cancha.
  El tablero es una sola pantalla larga.
- **La gráfica sube a la cara de la card.** La curva de calidad y el reparto de comentarios
  vivían adentro del desplegable; ahora se ven sin hacer nada.
- **Ritmo fijo de las cards de tu semana:** titular → gráfico → copy azul → «Ver →».
  Sin línea divisoria: sólo aire.
- **Top 10 fijo en las cards de cancha**, sin «ver las 20» y sin corte en 6.
  Si el cliente queda afuera del diez, su fila va **pegada a la décima**, separada por un
  filete, con su puesto real (11, 32, el que sea).
- **Tres columnas:** Actor · Índ · Pue. Calidad e influencia por actor salen de la cara.
- **Se fueron las tres marcas de movimiento** (velas del pie, flechitas, línea del pulso)
  y con ellas el **panel del pulso de ocho semanas**, que hoy no tiene otro lugar.
- **El play de la pieza destacada se queda**: abre su propia fila adentro de la tabla.
- La card azul cambia de rótulo: **«Ya cargado en el asistente»**, con un punto que late,
  y su gráfico es la **secuencia** de pasos encadenados con flechas.

## Reglas de código, no de redacción

Todo lo que alinea está parametrizado arriba del CSS, en `.ni{}`:

    --ni-lineas-titular: 2     los titulares ocupan siempre dos renglones
    --ni-lineas-copy:    2     todo copy azul ocupa siempre dos renglones
    --ni-viz-alto:     104px   la caja del gráfico mide lo mismo en las tres cards

- La cita del titular la corta `cita()`: primero prueba cerrar en la **primera oración**;
  si no entra, corta al ras de palabra. Nunca lleva puntos suspensivos.
  El presupuesto lo calcula `citaPara()` según lo que ocupe la frase que mide,
  así el titular entra siempre en los dos renglones.
- El copy lo corta el armado a 88 caracteres, que es lo que llena las dos líneas.
- Las nomenclaturas del gráfico van **fuera** de la caja, debajo, y en **una sola línea**
  (`flex-wrap: nowrap`). El texto sale del propio motor: `reglas.ventana_semanas`
  escribe «promedio 4 semanas», no está escrito a mano.
- Los textos fijos viven en el diccionario `T`, incluida la secuencia por defecto
  (`T.pasos_default`). El armado no tiene literales sueltos.
- El wordmark lleva `aspect-ratio: 409/100` en sus dos usos, para que no colapse
  cuando se lo mide en `em`; en el cierre se mide contra el texto que lo rodea.

## Color

| Tinta | Qué significa |
|---|---|
| Azul | lo del cliente: su semana, su fila, su asistente |
| Verde | «funcionó» y los puestos ganados |
| Rojo | los puestos perdidos |
| Piedra + negro | la cancha: terreno público |

## Adversarial corrido el 15-09

Render headless en Chromium a 1200, 860 y 400 px de ancho:

- Sin errores de consola y sin scroll horizontal en ninguno de los tres anchos.
- Titulares: 39 px las tres cards de semana, 44 px las tres de cancha. Uniforme.
- Cajas de gráfico: 104 px las tres. Uniforme.
- Copies: 35 px los tres. Uniforme.
- Nomenclaturas: 13 px, una línea, en las dos cards que las tienen.
- Cards de semana: 292 px las tres, exactamente iguales.
- Wordmark: 90×22 en la barra, 147×36 en el cierre. Renderiza en los tres anchos.
- Play de pieza destacada: 6 botones activos. Fila de «fuera del top 10»: 1.
- Cero desplegables, cero botones de card.

**Dos cosas que el adversarial encontró y quedaron arregladas:** la columna `Pue`
nunca recibía la clase que la pinta —por eso no se veían los +11 ni los −4—, y el
filete de la fila «fuera del top 10» se cortaba porque el fondo de la fila del cliente
lo tapaba; ahora va como sombra interior.

## Pendiente, declarado

- ⚠️ **NO VERIFICADO:** los puestos de Ciro en Santa Fe (4º) y en el país (11º) salen de
  **ordenar su índice dentro de cada lista**. Eso sólo vale si el techo que normaliza la
  influencia es común a las tres canchas. Todo indica que sí —si fuera por lista, Javkin
  daría 100 en Rosario y da 44,4— pero **no se leyó `motor_eje.py`**. Verificar antes de
  mostrárselo al cliente.
- El motor tiene que emitir el puesto del cliente en las canchas donde no está en el
  elenco. Hoy se cargó a mano en `datos_ciro_W36.js`, marcado en el archivo.
- El pulso de ocho semanas sale del tablero y **no tiene destino**: correo del lunes,
  mesa de fin de mes, o se deja de emitir.
- Los textos que escribe Lisandro siguen siendo los mismos cuatro: el porqué de cada
  pieza, la instrucción de la semana y los pasos de la secuencia.

---

*narraglobal · 15-09-2026. Procedencia: emisión real del 10-09-2026 leída del artifact
«Narra ID» del 11-09. La Mac no estuvo en el puente: nada de esto se chequeó contra disco.*
