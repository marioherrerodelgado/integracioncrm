# Integración CRM

Sitio web estático de [integracioncrm.com](https://integracioncrm.com), preparado para desplegarse en Cloudflare Pages desde la raíz del repositorio.

## Contenido

- Portada con servicios y formulario de auditoría
- Páginas SEO para Zoho CRM, automatización, integraciones API y reporting
- Auditoría CRM gratuita
- Solicitud de reunión por Google Meet o Microsoft Teams
- Sitemap XML, metadatos sociales y datos estructurados JSON-LD

Los formularios usan `mailto:` para preparar la solicitud en el cliente de correo del visitante. Para reservas confirmadas y disponibilidad en tiempo real se debe conectar una URL de Google Calendar, Microsoft Bookings o una plataforma de agenda.

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
