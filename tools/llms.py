#!/usr/bin/env python3
"""Genera /llms.txt: resumen de IntegraciónCRM y sus páginas clave para asistentes de IA.
Formato propuesto en https://llmstxt.org. Se ejecuta solo desde tools/blog.py."""
import glob, html, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
B = "https://integracioncrm.com"

def linea(ruta):
    archivo = "index.html" if ruta == "/" else ruta.strip("/") + "/index.html"
    h = open(archivo, encoding="utf-8").read()
    t = html.unescape(re.search(r"<title>(.*?)</title>", h).group(1)).split(" | ")[0]
    d = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', h).group(1))
    return f"- [{t}]({B}{ruta}): {d}"

def rutas(patron):
    return sorted("/" + p.replace("index.html", "") for p in glob.glob(patron))

formacion = ["/consultoria-centros-formacion/", "/servicios/crm-academias-oposiciones/", "/servicios/crm-certificados-profesionalidad/",
             "/servicios/crm-formacion-subvencionada/", "/servicios/gestion-formacion-bonificada/", "/servicios/captacion-alumnos-centros-formacion/",
             "/servicios/integracion-moodle-crm/", "/servicios/integracion-zoom-crm/", "/checklist-crm-centros-formacion/"]
servicios = ["/servicios/implementacion-zoho-crm/", "/servicios/zoho/", "/servicios/zoho-one/", "/servicios/precios-zoho/", "/servicios/zoho-verifactu/", "/servicios/automatizacion-crm/", "/servicios/chatbots-crm/", "/servicios/integraciones-api/", "/servicios/integracion-erp-crm/",
             "/servicios/datos-reporting-crm/", "/servicios/migracion-crm/", "/servicios/integracion-whatsapp-crm/",
             "/servicios/integracion-telefonia-crm/", "/servicios/stripe-crm/",
             "/servicios/formacion-zoho/", "/servicios/soporte-zoho/", "/servicios/zoho-creator/", "/servicios/zoho-analytics/", "/servicios/zoho-books/", "/servicios/zoho-sign/", "/servicios/zoho-campaigns/", "/servicios/zoho-desk/", "/servicios/zoho-projects/", "/servicios/zoho-people/", "/servicios/zoho-inventory/", "/servicios/zoho-recruit/"]
salto = "\n"
texto = f"""# IntegraciónCRM

> Consultoría e integración de CRM en España, liderada por Mario Herrero Delgado. Implantamos y adaptamos Zoho CRM (también HubSpot y Salesforce), los conectamos con la web, WhatsApp, telefonía, pagos, facturación y plataformas de formación como Moodle, y automatizamos procesos comerciales y administrativos. Especialización en centros de formación: FP, academias, certificados de profesionalidad, formación bonificada (FUNDAE) y subvencionada.

Contacto: info@integracioncrm.com · WhatsApp @marioxherrero · Madrid y remoto (toda España). Diagnóstico inicial gratuito: {B}/auditoria-crm-gratis/

## Empresa

- [Sobre nosotros]({B}/sobre-nosotros/): el equipo, su enfoque de trabajo y la trayectoria de Mario Herrero Delgado (fundador y CEO; consultor senior de CRM).
- [Servicios]({B}/servicios/): catálogo completo de servicios de CRM, integración y automatización.
- [CRM para pymes]({B}/crm-para-pymes/): cómo elegir e implantar un CRM en una pequeña o mediana empresa de cualquier sector.
- [Consultor de Zoho CRM y Zoho One]({B}/consultor-zoho-crm/): consultoría independiente de Zoho, sin revender licencias; diferencia entre partner y consultor.
- [Consultor Zoho CRM en Madrid]({B}/consultor-zoho-crm-madrid/): implantación, Zoho One, Deluge e integraciones, con reuniones presenciales en Madrid y trabajo en remoto.
- [Consultor Zoho CRM para Latinoamérica]({B}/consultor-zoho-crm-latam/): implantación, integraciones, formación y soporte de Zoho CRM y Zoho One en remoto para toda Latinoamérica.
- [Consultor Zoho CRM para empresas de México]({B}/consultor-zoho-crm-mexico/): Zoho CRM y Zoho One en remoto, con facturación electrónica, moneda y protección de datos de México.
- [Consultor Zoho CRM para empresas de Colombia]({B}/consultor-zoho-crm-colombia/): Zoho CRM y Zoho One en remoto, con facturación electrónica, moneda y protección de datos de Colombia.
- [Consultor Zoho CRM para empresas de Chile]({B}/consultor-zoho-crm-chile/): Zoho CRM y Zoho One en remoto, con facturación electrónica, moneda y protección de datos de Chile.
- [Consultor Zoho CRM para empresas de Perú]({B}/consultor-zoho-crm-peru/): Zoho CRM y Zoho One en remoto, con facturación electrónica, moneda y protección de datos de Perú.
- [Consultor Zoho CRM para empresas de Argentina]({B}/consultor-zoho-crm-argentina/): Zoho CRM y Zoho One en remoto, con facturación electrónica, moneda y protección de datos de Argentina.
- [Auditoría CRM gratuita]({B}/auditoria-crm-gratis/): diagnóstico inicial sin coste.

## Centros de formación

{salto.join(linea(r) for r in formacion)}

## CRM por sectores

{salto.join(linea(r) for r in ["/sectores/"] + rutas("sectores/*/index.html"))}

## Servicios

{salto.join(linea(r) for r in servicios)}

## Integraciones con Zoho CRM

{salto.join(linea(r) for r in ["/integraciones/"] + rutas("integraciones/*/index.html"))}

## Blog

{salto.join(linea(r) for r in rutas("blog/*/index.html"))}
"""
open("llms.txt", "w", encoding="utf-8").write(texto)
print(f"  ✓ llms.txt ({len(texto.splitlines())} líneas)")
