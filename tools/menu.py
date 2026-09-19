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
        ("/servicios/implementacion-zoho-crm/", "Implementación de Zoho CRM"),
        ("/servicios/zoho/", "Aplicaciones Zoho"),
        ("/servicios/zoho-one/", "Zoho One"),
        ("/servicios/automatizacion-crm/", "Automatización de procesos"),
        ("/servicios/integraciones-api/", "Integraciones API y webhooks"),
        ("/servicios/migracion-crm/", "Migración de CRM"),
        ("/servicios/integracion-whatsapp-crm/", "WhatsApp con CRM"),
        ("/servicios/integracion-telefonia-crm/", "Telefonía con CRM"),
        ("/servicios/formacion-zoho/", "Formación en Zoho"),
        ("/servicios/soporte-zoho/", "Soporte y bolsas de horas"),
        ("/servicios/precios-zoho/", "Precios de Zoho"),
    ], ("/servicios/", "Ver todos los servicios →")),
    ("Integraciones", [
        ("/integraciones/zoho-google-workspace/", "Google Workspace"),
        ("/integraciones/zoho-microsoft/", "Microsoft 365, Outlook y Teams"),
        ("/integraciones/zoho-navision-business-central/", "Navision y Business Central"),
        ("/integraciones/zoho-holded/", "Holded y facturación"),
        ("/integraciones/centralita-zoho-crm/", "Centralita virtual"),
        ("/blog/whatsapp-zoho-crm-woztell-sibila-eazybe/", "WhatsApp: Woztell, Sibila, Eazybe"),
        ("/integraciones/zoho-wordpress/", "WordPress"),
        ("/integraciones/zoho-woocommerce/", "WooCommerce"),
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
        ("/sectores/crm-asesorias-gestorias/", "Asesorías y gestorías"),
        ("/sectores/crm-corredores-seguros/", "Corredores de seguros"),
        ("/sectores/crm-centros-deportivos/", "Centros deportivos"),
    ], ("/sectores/", "Ver todos los sectores →")),
]
ENLACES = [("/casos-de-exito-zoho/", "Casos"), ("/blog/", "Blog"), ("/sobre-nosotros/", "Sobre nosotros"), ("/auditoria-crm-gratis/", "Auditoría gratis")]

# Páginas que no están en un desplegable pero pertenecen a una sección
FORMACION = ("/consultoria-centros-formacion/", "/checklist-crm-centros-formacion/", "/servicios/crm-", "/servicios/gestion-formacion",
             "/servicios/captacion-alumnos", "/servicios/integracion-moodle", "/servicios/integracion-zoom")

def seccion_de(url):
    if url.startswith("/sectores/") or url.startswith(FORMACION):
        return "Sectores"
    if url.startswith("/integraciones/"):
        return "Integraciones"
    if url.startswith(("/servicios/", "/crm-para-pymes/", "/consultor-zoho-crm-madrid/", "/consultor-zoho-crm-")):
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


# ── PIE ───────────────────────────────────────────────────────────────────
# Cuatro columnas de enlaces más una franja inferior con lo legal. Igual que el
# menú: se define aquí una sola vez y se reescribe en todas las páginas.
COLUMNAS = [
    ("Servicios", [
        ("/servicios/implementacion-zoho-crm/", "Implementación de Zoho CRM"),
        ("/servicios/automatizacion-crm/", "Automatización de procesos"),
        ("/servicios/integraciones-api/", "Integraciones API"),
        ("/servicios/integracion-erp-crm/", "ERP y CRM"),
        ("/servicios/migracion-crm/", "Migración de CRM"),
        ("/servicios/datos-reporting-crm/", "Datos y reporting"),
        ("/servicios/", "Todos los servicios"),
    ]),
    ("Zoho", [
        ("/servicios/zoho/", "Aplicaciones Zoho"),
        ("/servicios/zoho-one/", "Zoho One"),
        ("/servicios/precios-zoho/", "Precios de Zoho"),
        ("/servicios/zoho-verifactu/", "Verifactu con Zoho"),
        ("/servicios/formacion-zoho/", "Formación en Zoho"),
        ("/servicios/curso-zoho-crm-avanzado/", "Curso avanzado"),
        ("/servicios/soporte-zoho/", "Soporte y bolsas de horas"),
    ]),
    ("Integraciones", [
        ("/integraciones/zoho-google-workspace/", "Google Workspace"),
        ("/integraciones/zoho-microsoft/", "Microsoft 365 y Teams"),
        ("/integraciones/zoho-navision-business-central/", "Navision y Business Central"),
        ("/integraciones/centralita-zoho-crm/", "Centralita virtual"),
        ("/servicios/integracion-whatsapp-crm/", "WhatsApp con CRM"),
        ("/integraciones/zoho-make-n8n/", "Make y n8n"),
        ("/integraciones/", "Todas las integraciones"),
    ]),
    ("Sectores y empresa", [
        ("/consultoria-centros-formacion/", "Centros de formación"),
        ("/sectores/crm-inmobiliarias/", "Inmobiliarias"),
        ("/sectores/crm-asesorias-gestorias/", "Asesorías y gestorías"),
        ("/sectores/", "Todos los sectores"),
        ("/consultor-zoho-crm/", "Consultor de Zoho"),
        ("/sobre-nosotros/", "Sobre nosotros"),
        ("/casos-de-exito-zoho/", "Casos de éxito"),
        ("/blog/", "Blog"),
    ]),
]
LEGAL = [("/aviso-legal/", "Aviso legal"), ("/privacidad/", "Privacidad"), ("/cookies/", "Cookies")]
LINKEDIN = "https://www.linkedin.com/in/marioherrerod/"

def pie(url):
    marca = ('<div class="footer-marca">'
             '<a class="brand" href="/"><img class="brand-logo" src="/brand/integracioncrm/logos/integracioncrm_logo_primary.svg" width="893" height="208" alt="IntegraciónCRM" loading="lazy" decoding="async"/></a>'
             '<p class="footer-claim">Implantamos, integramos y automatizamos Zoho CRM para que tu equipo deje de teclear lo mismo dos veces.</p>'
             '<p class="footer-contacto"><a href="mailto:info@integracioncrm.com">info@integracioncrm.com</a>'
             f'<a href="https://wa.me/marioxherrero" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
             f'<a href="{LINKEDIN}" target="_blank" rel="me noopener noreferrer">LinkedIn</a></p>'
             '<p class="footer-lugar">Madrid · Toda España · Latinoamérica</p>'
             '<a class="button button-small" href="/auditoria-crm-gratis/">Auditoría gratis</a></div>')
    cols = ""
    for titulo, enlaces in COLUMNAS:
        items = "".join(f'<li><a href="{u}"{ACTUAL if u == url else ""}>{t}</a></li>' for u, t in enlaces)
        cols += f'<nav class="footer-col" aria-label="{titulo}"><h2>{titulo}</h2><ul>{items}</ul></nav>'
    legal = " · ".join(f'<a href="{u}">{t}</a>' for u, t in LEGAL)
    barra = ('<div class="footer-barra"><p>© <span data-year></span> IntegraciónCRM · Mario Herrero Delgado</p>'
             f'<p>{legal}</p></div>')
    return ('<footer class="site-footer"><div class="container">'
            f'<div class="footer-grid">{marca}{cols}</div>{barra}</div></footer>')

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
    nuevo = re.sub(r'<footer class="site-footer">.*?</footer>', lambda m: pie(url), nuevo, count=1, flags=re.S)
    if nuevo != h:
        open(ruta, "w", encoding="utf-8").write(nuevo); cambiadas += 1
print(f"  ✓ menú actualizado en {cambiadas} páginas")
