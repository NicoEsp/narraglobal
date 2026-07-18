# Suscripciones · tablero del cliente + back office

Qué se construyó, cómo se enciende y cómo se opera cada semana.
Sigue el modelo de `ALTA-checklist`: el pago no es el alta, estados del cliente
`borrador → activo → con_histórico → live` (+ `pausado`), y el ritual
"sábado se programa, domingo se publica".

---

## 1 · Qué hay

| Ruta | Qué es | Quién entra |
|---|---|---|
| `/suscripcion/{código}` | El tablero del cliente (también funciona `/suscripción/…` con tilde) | El cliente, con magic link a su email |
| `/alta/{código}` | El **onboarding post-login**: wizard de ~2 min que completa el alta (nombre, de dónde comunica, categoría, sus @ públicos por red, competidores si es PRO, equipo y su WhatsApp) | El cliente en estado `borrador` |
| `/entrar` | Puerta desde la landing: pide el email y redirige al tablero (o al back office si el email es admin) | Cualquiera |
| `/admin` | Back office: el store de clientes (altas, estados, pulso, pausas) | Equipo narraglobal (rol admin) |
| `/admin/suscripcion/{id}` | Las semanas de un cliente: pegar datos.js, validar, ver como cliente, programar, publicar | Equipo narraglobal |

El **producto tablero** (la muda) vive intacto en `public/tablero/index.html`.
No se toca para operar: la app le inyecta los datos del cliente autenticado en runtime.
Versión nueva de la muda = reemplazar ese archivo, nada más.

Los datos viven en Supabase (proyecto `aydtxqhtkcyytsamervs`):

- `suscripciones` — el **store de clientes**, una sola fuente de verdad: nombre como se
  muestra, email (la llave del magic link), teléfono (lo captura narrachat), plan
  (`base|demo|pro`), `estado` (`borrador|activo|con_historico|live|pausado`), `token`
  one-time (el pegamento pago ↔ WhatsApp ↔ tablero, para la fase LS/narrachat), el
  `codigo` opaco de la URL y el **pulso** (día + hora + tz del aviso semanal).
- `tableros` — una fila por semana: el JSON NARRA completo (`schema_version: 1`),
  etiqueta, `estado` (`borrador|programado|publicado`), `programado_para` y `avisado_en`
  (idempotencia del aviso, para la fase narrachat). El cliente ve **el último publicado**.
- `admin_emails` — los emails del equipo. Al primer login, el rol admin se asigna solo.

La seguridad es RLS de Postgres: al navegador solo llega **el cliente logueado** y **solo
semanas publicadas** (el equivalente del `/api/data` del checklist — nunca datos de otro
cliente). El `codigo` de la URL es ruteo, no seguridad. Borradores y programados son del equipo.

## 2 · Encendido (una sola vez)

1. **Aplicar la migración** `supabase/migrations/20260717150000_suscripciones_y_tableros.sql`.
   - Con CLI: `supabase db push` · o pegarla en el SQL Editor del dashboard de Supabase.
   - Incluye el **flip automático** `programado → publicado` con **pg_cron** (cada 5 min).
     Si la extensión no está habilitada en el proyecto, el bloque avisa y sigue: se habilita
     en Database → Extensions → `pg_cron` y se re-ejecuta el último bloque del archivo.
2. **Auth de Supabase** (dashboard → Authentication):
   - En **URL Configuration**: Site URL `https://narraglobal.com`, y en Additional Redirect
     URLs agregar `https://narraglobal.com/**` (y `http://localhost:8080/**` para desarrollo).
   - El proveedor **Email** ya viene habilitado; el magic link usa la plantilla «Magic Link».
3. **Admins**: `nicolassespindola@gmail.com` ya queda sembrado en `admin_emails`. Para sumar a Lisandro:
   `insert into public.admin_emails (email) values ('email-de-lisandro@…');`
   (si ya se había logueado antes de agregarlo, repetir login y listo).
4. **Marca del tablero**: faltan 4 archivos que están en el repo de la muda y acá no —
   copiarlos a `public/tablero/marca/`: `narra-firma.svg`, `narraglobal-placa-azul.png`,
   `narranoise-placa-azul.png`, `narrachat-placa-azul.png`. (Los logos y medios del zócalo
   ya quedaron armados desde `public/land/`; el favicon usa el de la landing mientras tanto.)

## 3 · El ritual (alta manual + semana a semana)

Mientras no exista el webhook de Lemon Squeezy, el alta la hace el equipo a mano:

1. Entrar a `narraglobal.com/admin` (magic link al email del equipo).
2. **+ Nueva suscripción** → nombre como se muestra, email, teléfono, plan, estado y el
   **pulso** (día + hora del aviso; Ciro: dom 09:00). El código de URL y el token se
   generan solos. **Copiar link** para pasárselo al cliente.
3. En **Tableros →**: **+ Nueva semana** y pegar el `datos.js` de siempre (el archivo
   entero con `window.NARRA={…}`; también acepta JSON puro).
4. **Validar** (schema_version, piezas, series, un solo `you:1`…) y **Ver como cliente**
   (la vista previa renderiza el tablero real con el plan del cliente).
5. **Guardar borrador** → sábado: **Programar…** (sugiere el próximo pulso del cliente)
   → el domingo la base lo pasa a **publicado** sola. ¿Apuro? **Publicar ya**.

El plan de la suscripción reemplaza al `?plan=` de la URL de antes: `base`, `pro`, o
`demo` con su vencimiento (el contador de cortesía del tablero sale de ahí).

Reglas de experiencia que ya se cumplen: el cliente **nunca ve una pantalla muerta** —
sin login le pide el email; en `borrador` lo lleva a **completar su alta** (`/alta/{código}`);
sin tablero publicado le dice **la fecha concreta** de su primera entrega (según su pulso);
pausado ve cómo reactivar por WhatsApp.

### El alta post-login (`/alta/{código}`)

Migración `supabase/migrations/20260718120000_alta_onboarding.sql`. El cliente que pagó
entra en `borrador`; al abrir su tablero se lo redirige al wizard. Guarda los **campos
confirmados** (no la conversación) en columnas nuevas de `suscripciones`: `pais_de`,
`pais_para`, `categoria`, `redes` (jsonb `[{red,usuario}]`), `competidores` (jsonb, solo
PRO), `equipo_tamano`, `equipo_telefono`, `alta_completada_en`. Pedimos **solo los @
públicos** — nunca login a las redes. El paso de benchmark muestra el cupón `PRO2` si el
plan es base, o la carga de hasta 5 competidores si es PRO.

Al terminar, el wizard llama a la función **`completar_alta(p_codigo, p_datos)`** —
`SECURITY DEFINER`, valida el email del magic link y el estado `borrador`, escribe solo
los campos del alta y pasa a `activo`. Así el cliente **no** recibe un `UPDATE` amplio
sobre su fila (no puede tocar `plan`/`estado`/`demo_expira`). En el back office, cada
suscripción muestra un panel **read-only "Datos del alta"** para confirmar los @ antes de
tirar el pull de Apify.

## 4 · Lo que viene (fases siguientes, no incluido acá)

Mapea a la sección 1 del `ALTA-checklist`:

- **Lemon Squeezy**: productos + consentimiento + webhooks. `order_created` crea la fila
  en `suscripciones` con `estado='borrador'` y su `token`; `subscription_cancelled` la
  pasa a `pausado`. El esquema ya lo espera — el webhook no necesita migrar nada.
- **Correo de bienvenida** (Resend/Postmark o el built-in de LS): 1 CTA a narrachat.
- **narrachat / alta conversacional** (repo `narraglobal-narrachat`): matchea el `token`,
  captura teléfono + @, confirma horario → `estado='activo'`. Guarda campos, no el chat.
- **Aviso semanal por WhatsApp**: template utilitario aprobado por Meta; se dispara con el
  flip a publicado usando `avisado_en` para no mandar dos veces; fallback a mail.
- **Apify / backfill** → `estado='con_historico'` → primera semana publicada → `live`.
- **Multi-usuario por cliente**: pregunta abierta del checklist; hoy el modelo es un email
  por suscripción.
