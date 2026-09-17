# Calendario de contenidos del blog

Criterio: búsquedas con intención de contratar o de resolver un problema concreto, en las que
IntegraciónCRM tiene experiencia real. Un artículo cada 1-2 semanas es suficiente; importa más la
constancia que el volumen.

Estado: ✅ publicado · ✍️ siguiente · ⏳ pendiente · ⚠️ requiere revisión de datos por Mario antes de publicar

| # | Estado | Artículo | Búsqueda objetivo | Lleva a |
| --- | --- | --- | --- | --- |
| 1 | ✅ | Cómo elegir un CRM para un centro de formación | crm para centros de formación | Pilar formación · checklist |
| 2 | ✅ | Zoho CRM o HubSpot para un centro de formación | zoho vs hubspot | Implementación Zoho |
| 3 | ✅ | Cómo integrar Moodle con Zoho CRM | integrar moodle con crm | Integración Moodle |
| 4 | ✅ | Cómo automatizar un CRM sin complicar el proceso | automatización crm | Automatización |
| 5 | ✅ | Cómo automatizar las matrículas de un centro de formación | automatizar matrículas | Pilar formación · checklist |
| 6 | ✅ | Cómo pasar de Excel a un CRM sin perder datos | pasar de excel a crm | Migración de CRM |
| 7 | ⏳ ⚠️ | Cómo gestionar la formación bonificada FUNDAE con un CRM | gestión formación bonificada fundae | Formación bonificada |
| 8 | ⏳ | WhatsApp Business API con Zoho CRM: qué se puede hacer | whatsapp zoho crm | WhatsApp con CRM |
| 9 | ⏳ | Cuánto cuesta implantar Zoho CRM (y de qué depende) | cuánto cuesta implantar zoho crm | Diagnóstico gratuito |
| 10 | ⏳ ⚠️ | Certificados de profesionalidad: qué documentación controlar | gestión certificados de profesionalidad | Certificados |
| 11 | ⏳ | Cómo reducir el abandono de alumnos con datos del CRM | abandono alumnos formación online | Academias · Moodle |
| 12 | ⏳ | Zoho One para centros de formación: qué aplicaciones usar | zoho one educación | Zoho CRM y Zoho One |
| 13 | ⏳ | Cómo responder a un lead en menos de 5 minutos (sin estar pendiente) | tiempo de respuesta leads | Automatización |
| 14 | ⏳ | Qué medir en un centro de formación: 10 indicadores para dirección | kpi centro de formación | Datos y reporting |

## Notas para los marcados con ⚠️

- **FUNDAE y certificados de profesionalidad**: plazos de comunicación, porcentajes de asistencia y
  documentación cambian con la normativa. Antes de publicar, contrastar cada dato con la web oficial
  de FUNDAE o del SEPE y con tu experiencia, y enlazar la fuente.
- **Precios (artículo 9)**: necesita rangos reales de tus proyectos; sin ellos, solo se pueden explicar
  los factores de coste.

## Después de publicar cada artículo

1. `python3 tools/blog.py && node tools/og.mjs` (página, imagen para redes, sitemap, RSS y llms.txt).
2. Publicar (`git push`; las comprobaciones se ejecutan solas).
3. Search Console → Inspección de URLs → Solicitar indexación.
4. Compartirlo en LinkedIn con un comentario propio, no solo el enlace.
