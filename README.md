# Integración CRM

Sitio web estático de [integracioncrm.com](https://integracioncrm.com), desplegado en **Cloudflare Workers** con assets estáticos (`wrangler.jsonc`).

## Contenido

- Portada con servicios y formulario de auditoría
- Páginas SEO para Zoho CRM, automatización, integraciones API y reporting
- Solución específica para centros de FP, academias y entidades de formación
- Página de presentación de Mario Herrero Delgado y el enfoque del proyecto
- Auditoría CRM gratuita
- Solicitud de reunión por Google Meet o Microsoft Teams
- Sitemap XML, metadatos sociales y datos estructurados JSON-LD

## URLs

**Todas las páginas usan URLs limpias** con `index.html` dentro de su carpeta
(`/servicios/migracion-crm/`). No existe ninguna URL con extensión `.html`.

Las URLs antiguas con `.html` redirigen con **301** desde [`_redirects`](_redirects).
Al añadir una página hay que actualizar a la vez: el `<link rel="canonical">`,
[`sitemap.xml`](sitemap.xml) y el menú (ver abajo).

## Navegacion y pie

El menú es **HTML estático e idéntico en las 21 páginas**, con `aria-current="page"`
en el enlace de la sección activa. No lo genera JavaScript: hacerlo provocaba un salto
visual al cargar y dejaba el menú vacío sin JS.

El pie es igualmente identico en todas las paginas e incluye los enlaces a las tres
paginas legales.

Para cambiar el menu o el pie hay que editarlos en todas las paginas a la vez (los bloques
`<nav id="main-nav" …>…</nav>` y `<footer class="site-footer">…</footer>`).

## Formularios

Los tres formularios (portada, auditoría y reserva de reunión) envían directamente a
**Formspree** (`https://formspree.io/f/mrpbzgal`) por `fetch`. Si JavaScript falla, el
formulario hace un POST nativo al mismo endpoint, así que el envío nunca se pierde.

- `_subject` define el asunto del aviso por correo.
- `_gotcha` es el honeypot antispam nativo de Formspree (funciona también sin JS).
- `tipo` distingue de qué formulario procede cada solicitud.

> ⚠️ Formspree es un proveedor estadounidense: la política de privacidad debe declarar
> la transferencia internacional de datos y su base legal. **Pendiente.**

## Endpoint propio `/api/contacto` (inactivo)

[`worker.js`](worker.js) mantiene [`functions/api/contacto.js`](functions/api/contacto.js),
que valida la solicitud, la guarda en Supabase ([`supabase/schema.sql`](supabase/schema.sql))
y envía un aviso por email. **Ningún formulario lo usa actualmente.** Se conserva por si se
abandona Formspree; si se descarta definitivamente, pueden borrarse `worker.js`,
`functions/` y `supabase/`, y quitar `main` de `wrangler.jsonc`.

Para reactivarlo hacen falta las variables de entorno `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY`, y/o un binding de Email Sending llamado `EMAIL` con
`integracioncrm.com` verificado como dominio remitente. La clave `service_role` solo se
usa en el Worker y nunca debe aparecer en HTML, JS público ni en el repositorio.

## Despliegue

```bash
npx wrangler deploy
```

Configuración relevante en [`wrangler.jsonc`](wrangler.jsonc):

- `assets.binding: "ASSETS"` — **obligatorio**. Sin él, `env.ASSETS` es `undefined` y el
  Worker lanza un error 1101 (HTTP 500) en toda ruta que no sea un asset existente.
- `assets.not_found_handling: "404-page"` — sirve [`404.html`](404.html) con status 404.
- [`.assetsignore`](.assetsignore) impide que el código fuente, el README y la
  configuración se publiquen como ficheros estáticos.

## Desarrollo local

```bash
npx wrangler dev
```

Reproduce redirecciones, cabeceras de [`_headers`](_headers), página 404 y el endpoint
`/api/contacto`. Un servidor estático simple (`python3 -m http.server`) no reproduce nada
de eso.

## Paginas legales

Titular: Mario Herrero Delgado · NIF 05959518B · Avenida Guadalajara 26, 28032 Madrid ·
info@integracioncrm.com. Estos datos aparecen en [`/aviso-legal/`](aviso-legal/index.html)
y [`/privacidad/`](privacidad/index.html); si cambian, hay que actualizarlos en ambas.

- [`/aviso-legal/`](aviso-legal/index.html) — art. 10 LSSI-CE.
- [`/privacidad/`](privacidad/index.html) — RGPD y LOPDGDD. Declara Formspree y Cloudflare
  como encargados y la transferencia internacional a EE. UU.
- [`/cookies/`](cookies/index.html) — la web no instala cookies, por eso no hay banner.
  **Si se añade analítica, hay que actualizar esta página e implantar consentimiento previo.**

Los tres formularios incluyen una casilla de consentimiento obligatoria (`name="consentimiento"`)
con enlace a `/privacidad/`.

## Pendiente

- [ ] Imagen `og:image` (ninguna página tiene una: las tarjetas sociales salen vacías)
- [ ] Cloudflare Web Analytics, Google Search Console, SPF/DKIM/DMARC
- [ ] `Content-Security-Policy` y `Strict-Transport-Security` en `_headers`
