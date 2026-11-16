/*
 * Routing Middleware de Vercel (corre antes de servir archivos).
 * Si el pedido entra por lisandrobregant.com, sirve el sitio estático de
 * public/lisandrobregant/ en vez de la app de narraglobal.
 * Hace falta middleware porque los rewrites de vercel.json se aplican después
 * del filesystem, y "/" ya existe (el index.html de la app).
 */
const HOSTS = new Set(["lisandrobregant.com", "www.lisandrobregant.com"]);
const CARPETA = "/lisandrobregant";

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.hostname).split(":")[0].toLowerCase();

  if (!HOSTS.has(host)) {
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  }

  // assets/ tal cual; cualquier otra ruta muestra la página (usa #anclas, no rutas)
  url.pathname = url.pathname.startsWith("/assets/")
    ? CARPETA + url.pathname
    : CARPETA + "/index.html";

  return new Response(null, { headers: { "x-middleware-rewrite": url.toString() } });
}
