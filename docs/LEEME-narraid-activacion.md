# LEEME · Activación del Narra ID y landing nueva

Para validar antes de publicar. Rama `claude/zen-curie-tjhp3r`, 20-10-2026.
El detalle operativo vive en `docs/SUSCRIPCIONES.md` (§1, §7 y §8); esto es la guía
de revisión y la lista de lo que falta para cerrar la integración.

---

## 1 · Qué cambia

**Landing (`/`).** Hero «Dato *mejora* relato en Política | Negocios» (con el corte de
señal en «mejora»), los clientes en blanco dentro del hero, la placa del Narra ID
(USD 1,000/mes, cuatro ítems: cómo te fue, alertas semanales, asistente IA por
WhatsApp, call táctica mensual con Lisandro Bregant) con la animación de cuatro
ventanas, «En los medios» con las cuentas de X, Instagram y LinkedIn, y workshops en
azul. El menú queda en Workshops · Acceso clientes · Activá tu Narra ID.

**`/narraid`.** No es otra página: es la landing parada en la placa del Narra ID
(sin `#`, para tipear o dictar al aire). `src/App.tsx` + `SECCIONES` en `Index.tsx`.

**`/activar` (nuevo).** El botón «Activá tu Narra ID» lleva acá. Paso 1: nombre,
correo, cuenta, WhatsApp y el elenco (país, provincia y ciudad en política; país y
sector en negocios — la competencia no se elige). Se guarda como pedido
`narra_id` **antes** del pago. Paso 2: tres medios con link fijo —Mercado Pago
(suscripción en pesos), PayPal (botón de suscripción) y efectivo por WhatsApp—. Al
costado, siempre, el resumen de lo que se compra.

**Back office (`/admin`).** Los pedidos del Narra ID muestran su número corto
(`#3F9A2C`), estado de pago y tres acciones: **Marcar pagado**, **Retomar por
WhatsApp** (los que no pagaron) y **Mail de bienvenida** (los pagados; abre el correo
del equipo con todo escrito).

**Onboarding (`/alta`).** Sale el paso «a quién mirar de cerca»: 7 → 6 pasos;
`competidores` se manda vacío. La antesala del tablero solo muestra esa tarjeta a las
altas viejas que la cargaron.

**Base.** Migración `20261020120000_pedido_narra_id.sql`: tipo `narra_id` en
`pedidos`, columna `pagado_en`, `enviar_pedido` aceptando el tipo nuevo y la RPC
`registrar_suscripcion_paypal` (anota el id `I-…` de la suscripción en el pedido;
**no** marca pagado).

## 2 · Antes de mergear (bloquea la publicación)

- [ ] **Aplicar la migración** `supabase/migrations/20261020120000_pedido_narra_id.sql`
      (`supabase db push` o SQL Editor). Sin ella `/activar` no guarda y ofrece WhatsApp.
- [ ] **Link de Mercado Pago** (`MP_NARRA_ID` en `src/lib/enlaces.ts`,
      `https://mpago.la/1QsU9Go`): confirmar que es de **suscripción** y el monto en pesos.
      No se pudo abrir desde el entorno de desarrollo.
- [ ] **Botón de PayPal** (plan `P-67T0654124275352WNLLS6DI`): hacer una suscripción
      real de prueba y cancelarla. El SDK de PayPal estaba bloqueado en el entorno: **el
      botón nunca se vio renderizado**; sí se probó el link de respaldo.
- [ ] **LinkedIn** (`LINKEDIN_NARRA`): la URL `linkedin.com/company/narraglobal` está
      deducida del nombre de la página, no verificada.
- [ ] **Alta de prueba en `/alta`** con una sesión real: cambió la numeración de pasos.
- [ ] **SMTP propio** en Supabase Auth (Resend): sin él no llega el código de acceso al
      tablero a clientes reales (ver `SUSCRIPCIONES.md` §2).
- [ ] Revisar en un teléfono que el corte de señal de «mejora» no se lea como tachado.

## 3 · Huecos del circuito (no resueltos en este PR)

| # | Qué falta | Propuesta |
|---|---|---|
| 1 | **Datos de facturación.** `/activar` no pide condición frente al IVA ni CUIT; se emite Factura A/B (Argentina) o E (exterior) | Campo opcional «Necesito factura A» + CUIT |
| 2 | **Consentimiento** de contacto por WhatsApp/mail (Ley 25.326) | Un tilde en el paso 1 |
| 3 | **Resumen en celular:** queda debajo del formulario | Versión compacta arriba, solo móvil |
| 4 | **Precio en pesos** no se muestra en `/activar` | Pasar el monto del plan de MP |
| 5 | **Pedidos duplicados** si alguien reintenta (tope 5/día por WhatsApp) | Agruparlos en el back office |
| 6 | **Aviso al equipo** cuando entra un pedido | Mail o WhatsApp al equipo |
| 7 | **Alta manual** después de marcar pagado («+ Nueva suscripción») | Botón «Marcar pagado y dar de alta» |
| 8 | **Bajas y cobros fallidos** de MP y PayPal no llegan al sitio | Webhooks como el de Lemon Squeezy |
| 9 | **Correo de bienvenida** se manda a mano (mailto, texto plano) | Envío automático con Resend usando `docs/correos/bienvenida.html` |
| 10 | **Lemon Squeezy:** `SUSCRIPCIONES.md` §6 lo sigue presentando como checkout | Definir su rol (¿solo suscriptores actuales?) |
| 11 | **`/posicion`** (demo gratis) quedó sin links pero accesible | Borrar o redirigir a `/narraid` |

## 4 · Cómo se probó

- `eslint` sobre los archivos tocados, `tsc --noEmit` y `vite build`: limpios.
  (`npx eslint src` marca dos errores previos en `components/ui/`, ajenos a este PR.)
- Landing renderizada en Chromium a 1280 px y 390 px: sin scroll horizontal.
- Animación de la placa: capturas en cada una de las cuatro ventanas, sincronizadas
  con su ítem; los tres rankings de la ventana de alertas suben un puesto.
- `/narraid`: abre parada en la placa.
- `/activar`: los dos pasos con la RPC simulada (no se escribió en la base real).
- **No probado:** pagos reales, `/alta` con sesión, la migración contra la base.
