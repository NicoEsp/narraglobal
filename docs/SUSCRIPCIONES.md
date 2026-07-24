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
| `/alta/{código}` | El **onboarding post-login**: wizard de ~2 min que completa el alta (nombre, de dónde comunica, categoría, sus @ públicos por red, hasta 5 a quiénes mirar de cerca, equipo y su WhatsApp) | El cliente con alta pendiente (`alta_completada_en` vacío) |
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
2. **Auth de Supabase** (dashboard → Authentication) — el acceso es por email:
   la pantalla manda **un código de 6 dígitos + un magic link** en el mismo correo.
   El código es el camino principal (funciona en cualquier dispositivo y no lo rompe
   el escaneo de links del correo); el link es el atajo. Para que funcione:
   - **SMTP propio (obligatorio para producción)**: el email built-in de Supabase manda
     **2 emails/hora y solo a miembros del equipo del proyecto** — a un cliente real el
     código no le llega nunca y aparece `email rate limit exceeded`. En
     **Authentication → Emails → SMTP Settings** configurar un proveedor (Resend es lo
     más rápido: dominio verificado + API key como password SMTP). Después, en
     **Authentication → Rate Limits**, subir «Rate limit for sending emails»
     (con SMTP propio arranca en 30/hora; 100–200/hora está bien para empezar).
     Si el proveedor tiene "link/click tracking", **apagarlo** (reescribe los links y
     rompe el magic link).
   - **Plantilla «Magic Link»** (Authentication → Emails → Templates): tiene que incluir
     `{{ .Token }}` (el código de 6 dígitos). Cuerpo sugerido:

     ```html
     <h2>Tu acceso a narraglobal</h2>
     <p>Tu código de acceso es:</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:700">{{ .Token }}</p>
     <p>Ponelo en la pantalla de acceso y entrás. Vence en 1 hora.</p>
     <p>¿Estás en el mismo dispositivo? Podés entrar directo:
        <a href="{{ .ConfirmationURL }}">abrir mi tablero</a>.</p>
     ```
   - En **URL Configuration**: Site URL `https://narraglobal.com`, y en Additional Redirect
     URLs agregar `https://narraglobal.com/**` (y `http://localhost:8080/**` para desarrollo).
   - Dejar **habilitado el signup** del proveedor Email (Allow new users to sign up): la
     cuenta del cliente se crea sola en su primer login; si se deshabilita, los clientes
     nuevos ven «Ese email no tiene una cuenta habilitada».
   - La pantalla ya respeta el cooldown de reenvío (60 s) y, si el proyecto queda
     momentáneamente al límite de envíos, deja entrar igual con el último código emitido
     (vale 1 hora).
3. **Admins**: `nicolassespindola@gmail.com` ya queda sembrado en `admin_emails`. Para sumar a Lisandro:
   `insert into public.admin_emails (email) values ('email-de-lisandro@…');`
   (si ya se había logueado antes de agregarlo, repetir login y listo).
4. **Marca del tablero**: faltan 4 archivos que están en el repo de la muda y acá no —
   copiarlos a `public/tablero/marca/`: `narra-firma.svg`, `narraglobal-placa-azul.png`,
   `narranoise-placa-azul.png`, `narrachat-placa-azul.png`. (Los logos y medios del zócalo
   ya quedaron armados desde `public/land/`; el favicon usa el de la landing mientras tanto.)

## 3 · El ritual (alta manual + semana a semana)

El alta automática la hace el webhook de Lemon Squeezy (§5) cuando el cliente paga.
El alta manual sigue igual de válida — demos, cortesías, acuerdos especiales — y es
exactamente el mismo circuito para el cliente (código por email → `/alta` → tablero):

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
sin login le pide el email; con el **alta pendiente** (`alta_completada_en` vacío y no
pausada, sin importar el estado) lo lleva a completar su alta (`/alta/{código}`);
sin tablero publicado le dice **la fecha concreta** de su primera entrega (según su pulso);
pausado ve cómo reactivar por WhatsApp.

### El alta post-login (`/alta/{código}`)

Migraciones `20260718120000_alta_onboarding.sql` → `20260724130000_alta_pendiente_sin_borrador.sql`.
El cliente que pagó entra en `borrador`; al abrir su tablero se lo redirige al wizard.
Guarda los **campos confirmados** (no la conversación) en columnas de `suscripciones`:
`pais_de`, `pais_para`, `categoria`, `redes` (jsonb `[{red,usuario}]`), `competidores`
(jsonb, hasta 5 — «a quién mirar de cerca», incluido en el Narra ID de **todos** los
planes), `equipo_tamano`, `equipo_telefono`, `alta_completada_en`. Pedimos **solo los @
públicos** — nunca login a las redes.

Al terminar, el wizard llama a la función **`completar_alta(p_codigo, p_datos)`** —
`SECURITY DEFINER`, valida el email del login y que el **alta esté pendiente**
(`alta_completada_en` vacío y no pausada), escribe solo los campos del alta, y si venía
en `borrador` lo promueve a `activo` (los demás estados se conservan). Así el cliente
**no** recibe un `UPDATE` amplio sobre su fila (no puede tocar `plan`/`estado`/`demo_expira`).
En el back office, cada suscripción muestra un panel **read-only "Datos del alta"** para
confirmar los @ antes de tirar el pull de Apify.

## 4 · Lo que viene (fases siguientes, no incluido acá)

Mapea a la sección 1 del `ALTA-checklist`:

- **Lemon Squeezy**: LISTO — checkout en la landing (§6) + webhook de ciclo de vida
  completo (§5). Lo que sigue de esta fase es solo cosmética de LS (branding del
  checkout, email de recibo).
- **Correo de bienvenida** (Resend/Postmark o el built-in de LS): 1 CTA a narrachat.
- **narrachat / alta conversacional** (repo `narraglobal-narrachat`): matchea el `token`,
  captura teléfono + @, confirma horario → `estado='activo'`. Guarda campos, no el chat.
- **Aviso semanal por WhatsApp**: template utilitario aprobado por Meta; se dispara con el
  flip a publicado usando `avisado_en` para no mandar dos veces; fallback a mail.
- **Apify / backfill** → `estado='con_historico'` → primera semana publicada → `live`.
- **Multi-usuario por cliente**: pregunta abierta del checklist; hoy el modelo es un email
  por suscripción.

## 5 · Encender el webhook de Lemon Squeezy

La función `supabase/functions/lemonsqueezy-webhook/` reemplaza el alta manual del
§3 y acompaña el ciclo de vida del cobro: cuando alguien paga, LS le pega, crea la
fila en `suscripciones` sola, y después la mantiene (cancela, vence, retoma).

1. **Aplicar la migración** `20260724150000_lemon_squeezy_suscripcion.sql`
   (`supabase db push` o SQL Editor): suma las columnas `ls_*` (identidad y estado del
   cobro en LS) y el índice único de email (un email = una suscripción, cierra la
   carrera de reintentos del webhook).
2. **Desplegar la función**: `supabase functions deploy lemonsqueezy-webhook`.
   Queda en `https://aydtxqhtkcyytsamervs.functions.supabase.co/lemonsqueezy-webhook`.
   El `config.toml` ya la marca `verify_jwt = false` (la llama LS, no el navegador;
   la seguridad la da la firma HMAC dentro de la función).
3. **Secrets** (dashboard → Edge Functions → Secrets, o `supabase secrets set`):
   - `LEMONSQUEEZY_WEBHOOK_SECRET` — el signing secret del webhook en LS **(obligatorio)**.
   - `LS_VARIANT_PRO` / `LS_VARIANT_BASE` — los `variant_id` **numéricos** de cada plan
     (opcional pero recomendado; sin ellos el alta mapea por nombre de producto —
     contiene "pro" → `pro` — y los cambios de plan desde el portal de LS no se
     sincronizan).
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta la plataforma sola.
4. **En Lemon Squeezy** (Settings → Webhooks → +): pegar la URL de arriba, generar el
   **signing secret** (el mismo del paso 3) y suscribir estos eventos:
   `order_created`, `subscription_created`, `subscription_updated`,
   `subscription_cancelled`, `subscription_resumed`, `subscription_expired`,
   `subscription_paused`, `subscription_unpaused`, `subscription_payment_success`.
   Con "Send test" (o simulando eventos en test mode) se valida la firma end-to-end.
   Ojo: test mode y live mode tienen webhooks **separados** — crear el de live al
   activar la store. Las compras de test quedan marcadas (`ls_test_mode`) y se ven
   como «LS test» en el back office.

Qué hace, evento por evento (la firma `X-Signature`, HMAC-SHA256 hex, se verifica
siempre sobre el body crudo):

| Evento LS | Efecto en el store |
|---|---|
| `order_created` / `subscription_created` | Alta en `borrador` (nombre + email + plan; `codigo` y `token` se generan solos). Si el email ya existe: sincroniza `ls_*`; y si estaba `pausado`, **lo reactiva** (recompra = intención del cliente). |
| `subscription_cancelled` | **No pausa**: el cliente pagó hasta `ends_at`. Queda `ls_estado='cancelled'` + `ls_termina_en` visibles en el back office; LS manda `subscription_expired` cuando de verdad termina. |
| `subscription_expired` / `subscription_paused` | `estado='pausado'`. |
| `subscription_resumed` / `subscription_unpaused` | Reactiva: vuelve a `activo` (o a `borrador` si nunca completó el alta, para que onboardee). |
| `subscription_updated` | Sincroniza `ls_estado`, `ls_renueva_en`, `ls_termina_en`; pausa si el status quedó terminal (`unpaid`/`expired`/`paused`); actualiza el plan si cambió la variante (solo con `LS_VARIANT_*` configurados). **Nunca des-pausa** una pausa puesta por el equipo. |
| `subscription_payment_*` | Solo identidad (el payload es la factura, no la suscripción). |
| Resto | 200 e ignorado. |

## 6 · El checkout en la landing

El CTA «Comenzar mi suscripción» de la landing abre el **checkout de Lemon Squeezy
como overlay** (lemon.js), sin salir de narraglobal.com.

1. En LS: producto → **Share → Copy link** (formato
   `https://<store>.lemonsqueezy.com/buy/<uuid>` — es el UUID de la variante, no el id
   numérico).
2. Pegar esa URL en `VITE_LS_CHECKOUT_URL` (en `.env` del repo **y** en las Environment
   Variables de Vercel) y redeployar. Mientras esté vacía, el CTA cae a WhatsApp: la
   landing nunca queda rota.
3. En LS, en el producto → **Confirmation modal**, poner el botón del recibo apuntando a
   `https://narraglobal.com/entrar` (texto sugerido: «Entrar a mi tablero»). Así el loop
   queda cerrado: paga → «Entrar a mi tablero» → pide su código por email → onboarding
   `/alta` → «tu primera entrega llega el …».

El circuito completo del cliente que paga solo:
pago en LS → webhook crea el `borrador` → el cliente entra desde el recibo (o desde
`/entrar`) con el código de su email → la web lo lleva al wizard `/alta/{codigo}` →
al terminar ve la fecha de su primera entrega → el equipo carga la semana en `/admin`
→ el domingo se publica y el cliente ve su tablero.
