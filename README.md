# Integración CRM

Sitio web estático de [integracioncrm.com](https://integracioncrm.com), preparado para desplegarse en Cloudflare Pages desde la raíz del repositorio.

## Contenido

- Portada con servicios y formulario de auditoría
- Páginas SEO para Zoho CRM, automatización, integraciones API y reporting
- Auditoría CRM gratuita
- Solicitud de reunión por Google Meet o Microsoft Teams
- Sitemap XML, metadatos sociales y datos estructurados JSON-LD

Los formularios envían a `/api/contacto` mediante una Pages Function. La función puede guardar cada solicitud en Supabase y enviar un aviso por email; si el envío automático no está configurado, usa `mailto:` como alternativa.

## Guardar formularios en Supabase

1. Crea un proyecto en Supabase y ejecuta [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor.
2. En Cloudflare Pages, añade las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para producción y preview.
3. Pega la URL del proyecto en `SUPABASE_URL` y la clave `service_role` en `SUPABASE_SERVICE_ROLE_KEY`.

La clave `service_role` solo se utiliza en la Pages Function y no debe aparecer en HTML, JavaScript público ni repositorio. La tabla mantiene RLS activado y no necesita políticas públicas porque la inserción se realiza en servidor.

Para activar el envío directo, configura en Cloudflare un binding de Email Sending llamado `EMAIL`, permite como destino `info@integracioncrm.com` y verifica `integracioncrm.com` como dominio remitente. Para reservas confirmadas y disponibilidad en tiempo real se debe conectar una URL de Google Calendar, Microsoft Bookings o una plataforma de agenda.

## Configuración de Cloudflare Pages

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `.` (raíz del repositorio)
- Production branch: `main`

## Desarrollo local

Sirve la raíz del repositorio con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000
```
