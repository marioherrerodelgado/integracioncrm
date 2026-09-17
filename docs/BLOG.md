# Cómo publicar en el blog

El blog se genera a partir de archivos de texto en `blog/_fuentes/`. No hay que tocar HTML.

## Publicar un artículo nuevo

1. Copia `blog/_fuentes/_plantilla.md` con el nombre que quieras en la URL:
   `blog/_fuentes/crm-para-autoescuelas.md` → `https://integracioncrm.com/blog/crm-para-autoescuelas/`
2. Rellena la cabecera (entre las dos líneas `---`) y escribe el artículo debajo.
3. Genera las páginas:
   ```
   python3 tools/blog.py
   ```
4. Publica: `git add -A && git commit -m "Nuevo artículo: ..." && git push`.
   Cloudflare lo despliega en menos de un minuto.

El generador crea la página del artículo, actualiza el listado de `/blog/`, el RSS (`/blog/feed.xml`)
y el `sitemap.xml` de toda la web.

## Cabecera del artículo

| Campo | Obligatorio | Para qué sirve |
| --- | --- | --- |
| `titulo` | Sí | Titular de la página |
| `descripcion` | Sí | Texto de Google bajo el título. Máximo 160 caracteres |
| `resumen` | Sí | Entradilla bajo el titular y en el listado |
| `categoria` | Sí | Centros de formación · Zoho CRM · Automatización · Integraciones |
| `fecha` | Sí | `AAAA-MM-DD`. Si es futura, no se publica hasta ese día (hay que volver a ejecutar el generador ese día) |
| `titulo_seo` | No | Título para Google si se quiere distinto del titular (50-60 caracteres) |
| `actualizado` | No | Fecha de la última revisión importante |
| `relacionados` | No | Páginas de la web separadas por comas; se enlazan al final |
| `borrador` | No | `si` para no publicarlo |
| `pregunta` / `respuesta` | No | Preguntas frecuentes, tantas parejas como se quiera |

## Formato del texto

- `## Subtítulo` → aparece también en el índice del artículo (con 3 o más subtítulos)
- `### Subapartado`
- `**negrita**`, `*cursiva*`, `` `código` ``, `[texto](/url/)`
- Listas con `- ` o `1. `
- `> Nota` → recuadro destacado
- Tablas con `| columna | columna |`
- Una línea con `[[checklist]]` o `[[auditoria]]` → bloque de llamada a la acción

## Retirar o corregir

- Corregir: edita el `.md` y vuelve a ejecutar el generador.
- Retirar: borra el `.md` o pon `borrador: si` y ejecuta el generador; elimina la página generada.
  Si el artículo ya estaba indexado, añade una redirección 301 en `_redirects`.

## Consejos para que posicione

- Una búsqueda principal por artículo, en el título, la descripción y el primer párrafo.
- Responder la pregunta en los primeros párrafos, no al final.
- Enlazar a la página de servicio relacionada y a otro artículo del blog.
- Nada inventado: ni cifras, ni clientes, ni funciones que no se hayan comprobado.

---

## Otros elementos que dependen de archivos

- **Checklist descargable**: el documento está en `tools/checklist.html`. Para regenerar el PDF
  (`descargas/checklist-crm-centros-formacion.pdf`) hay que imprimirlo a PDF en A4 con fondos.
- **Vigilancia de la web**: `.github/workflows/vigilancia.yml`. Comprueba la web cada 10 minutos y
  abre una incidencia en GitHub si algo falla. GitHub desactiva las tareas programadas de un
  repositorio público tras 60 días sin actividad; publicar en el blog lo mantiene activo.
- **Microsoft Clarity**: se activa poniendo el identificador del proyecto en `CLARITY_ID`
  (`script.js`) y actualizando la política de cookies.
- **Comprobaciones antes de publicar**:
  - `tools/comprobar.py` revisa estructura HTML, datos estructurados, enlaces internos, títulos,
    descripciones, H1, canonical y sitemap. Se ejecuta solo antes de cada `git push`
    (`.githooks/pre-push`) y cancela el push si hay errores. En un clon nuevo hay que activarlo con
    `git config core.hooksPath .githooks`.
  - En GitHub, `.github/workflows/comprobaciones.yml` repite esas comprobaciones y además abre todas
    las páginas en un navegador real a 1440, 1024, 390 y 320 px buscando desbordes, texto cortado y
    errores de JavaScript. Si algo falla, GitHub avisa por email.
- **Cabeceras de seguridad** (`_headers`): la CSP solo permite Google Analytics, Microsoft Clarity,
  Cloudflare Web Analytics y Formspree. Si se añade otro servicio externo (un vídeo, un calendario,
  un chat), hay que añadir su dominio a la CSP o no funcionará.
- **Conversiones en GA4** (solo con cookies aceptadas): `generate_lead` (formularios enviados),
  `click_whatsapp`, `click_email`, `copiar_email`, `click_cta` (auditoría, reunión, checklist),
  `descarga_pdf` y `generador_probar`.
