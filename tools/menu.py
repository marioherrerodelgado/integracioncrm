#!/usr/bin/env python3
"""Menú principal de integracioncrm.com: única fuente de verdad.

Uso:  python3 tools/menu.py
Sustituye la navegación de todas las páginas por la definida aquí y marca la
sección activa (aria-current) según la URL. Se ejecuta solo desde tools/blog.py.
Para cambiar el menú: editar MENU y volver a ejecutarlo.
"""
import os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
ACTUAL = ' aria-current="page"'
FLECHA = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>'

MENU = [
    ("Servicios", [
        ("/crm-para-pymes/", "CRM para pymes"),
        ("/servicios/zoho/", "Aplicaciones Zoho"),
        ("/servicios/implementacion-zoho-crm/", "Implementación de Zoho CRM"),
        ("/servicios/automatizacion-crm/", "Automatización de procesos"),
        ("/servicios/integraciones-api/", "Integraciones API y webhooks"),
        ("/servicios/datos-reporting-crm/", "Datos y reporting"),
        ("/servicios/migracion-crm/", "Migración de CRM"),
        ("/servicios/chatbots-crm/", "Chatbots con IA"),
        ("/servicios/integracion-whatsapp-crm/", "WhatsApp con CRM"),
        ("/servicios/integracion-telefonia-crm/", "Telefonía con CRM"),
        ("/servicios/stripe-crm/", "Stripe y pagos"),
        ("/servicios/formacion-zoho/", "Formación en Zoho"),
        ("/servicios/soporte-zoho/", "Soporte y bolsas de horas"),
    ], ("/servicios/", "Ver todos los servicios →")),
    ("Integraciones", [
        ("/integraciones/zoho-google-calendar/", "Google Calendar"),
        ("/integraciones/zoho-outlook-365/", "Outlook y Microsoft 365"),
        ("/integraciones/zoho-wordpress/", "WordPress"),
        ("/integraciones/zoho-woocommerce/", "WooCommerce"),
        ("/integraciones/zoho-mailchimp/", "Mailchimp"),
        ("/integraciones/zoho-holded/", "Holded y facturación"),
        ("/integraciones/zoho-forms/", "Zoho Forms"),
        ("/integraciones/zoho-leadchain/", "Zoho LeadChain (anuncios)"),
        ("/integraciones/zoho-salesiq/", "Zoho SalesIQ (chatbots)"),
        ("/integraciones/zoho-ringover/", "Ringover (telefonía)"),
        ("/blog/whatsapp-zoho-crm-woztell-sibila-eazybe/", "WhatsApp: Woztell, Sibila, Eazybe"),
        ("/integraciones/zoho-make-n8n/", "Make y n8n"),
        ("/integraciones/migrar-hubspot-a-zoho/", "Migrar de HubSpot a Zoho"),
    ], ("/integraciones/", "Ver todas las integraciones →")),
    ("Sectores", [
        ("/consultoria-centros-formacion/", "Centros de formación"),
        ("/servicios/crm-academias-oposiciones/", "Academias y oposiciones"),
        ("/sectores/crm-inmobiliarias/", "Inmobiliarias"),
        ("/sectores/crm-clinicas-estetica/", "Clínicas y estética"),
        ("/sectores/crm-hosteleria-restauracion/", "Hostelería y restauración"),
        ("/sectores/crm-servicios-b2b/", "Servicios B2B"),
        ("/sectores/crm-centros-deportivos/", "Centros deportivos"),
    ], ("/sectores/", "Ver todos los sectores →")),
]
ENLACES = [("/blog/", "Blog"), ("/sobre-nosotros/", "Sobre nosotros"), ("/auditoria-crm-gratis/", "Auditoría gratis")]

# Páginas que no están en un desplegable pero pertenecen a una sección
FORMACION = ("/consultoria-centros-formacion/", "/checklist-crm-centros-formacion/", "/servicios/crm-", "/servicios/gestion-formacion",
             "/servicios/captacion-alumnos", "/servicios/integracion-moodle", "/servicios/integracion-zoom")

def seccion_de(url):
    if url.startswith("/sectores/") or url.startswith(FORMACION):
        return "Sectores"
    if url.startswith("/integraciones/"):
        return "Integraciones"
    if url.startswith(("/servicios/", "/crm-para-pymes/", "/consultor-zoho-crm-madrid/")):
        return "Servicios"
    return None

def navegacion(url):
    activa = seccion_de(url)
    partes = []
    for i, (titulo, enlaces, (url_todos, texto_todos)) in enumerate(MENU):
        actual = ACTUAL if titulo == activa else ""
        items = "".join(f'<a href="{u}"{ACTUAL if u == url else ""}>{t}</a>' for u, t in enlaces)
        partes.append(f'<div class="tiene-sub"><button type="button" class="sub-toggle"{actual} aria-expanded="false" aria-controls="sub-{i}">{titulo}{FLECHA}</button>'
                      f'<div class="submenu" id="sub-{i}" hidden>{items}<a class="submenu-todos" href="{url_todos}">{texto_todos}</a></div></div>')
    for u, t in ENLACES:
        activo = url == u or (u == "/blog/" and url.startswith("/blog/"))
        partes.append(f'<a href="{u}"{ACTUAL if activo else ""}>{t}</a>')
    partes.append('<a class="button button-small" href="/reservar-reunion/">Reservar reunión</a>')
    return '<nav id="main-nav" class="main-nav" aria-label="Navegación principal">' + "".join(partes) + "</nav>"

ignorados = [l.strip().strip("/") for l in open(".assetsignore") if l.strip() and not l.startswith("#")]
cambiadas = 0
for carpeta, dirs, archivos in os.walk("."):
    rel = os.path.relpath(carpeta, ".")
    partes = [] if rel == "." else rel.split(os.sep)
    if any(p.startswith(".") or p in ignorados or p in ("node_modules", "brand") for p in partes):
        dirs[:] = []; continue
    if "index.html" not in archivos:
        continue
    ruta = os.path.join(carpeta, "index.html")
    url = "/" + ("/".join(partes) + "/" if partes else "")
    h = open(ruta, encoding="utf-8").read()
    nuevo = re.sub(r'<nav id="main-nav" class="main-nav"[^>]*>.*?</nav>', lambda m: navegacion(url), h, count=1, flags=re.S)
    if nuevo != h:
        open(ruta, "w", encoding="utf-8").write(nuevo); cambiadas += 1
print(f"  ✓ menú actualizado en {cambiadas} páginas")
