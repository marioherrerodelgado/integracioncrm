#!/usr/bin/env python3
"""Genera el blog de integracioncrm.com a partir de blog/_fuentes/*.md

Uso:  python3 tools/blog.py

Cada artículo es un archivo Markdown con una cabecera entre '---'.
Ver blog/_fuentes/_plantilla.md y docs/BLOG.md. Genera:
  - blog/<slug>/index.html por artículo
  - blog/index.html (listado)
  - blog/feed.xml (RSS)
  - sitemap.xml completo
"""
import datetime, html, json, os, re, subprocess, sys
from urllib.parse import quote

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTES = os.path.join(RAIZ, "blog", "_fuentes")
BASE = "https://integracioncrm.com"
AUTOR = {"@type": "Person", "@id": f"{BASE}/sobre-nosotros/#mario-herrero", "name": "Mario Herrero Delgado", "url": f"{BASE}/sobre-nosotros/", "image": f"{BASE}/imagenes/mario-herrero-480.jpg", "jobTitle": "CEO de IntegraciónCRM"}
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
e = html.escape


# ---------- Markdown (subconjunto: lo que hace falta para artículos) ----------

def slugify(t):
    t = t.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

def en_linea(t):
    t = e(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![*\w])\*([^*]+)\*(?!\w)", r"<em>\1</em>", t)
    def enlace(m):
        texto, url = m.group(1), m.group(2)
        externo = url.startswith("http") and "integracioncrm.com" not in url
        extra = ' target="_blank" rel="noopener noreferrer"' if externo else ""
        return f'<a href="{url}"{extra}>{texto}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", enlace, t)

CTAS = {
    "checklist": '<aside class="articulo-cta"><p class="eyebrow">Recurso gratuito</p><h3>Checklist: ¿está tu centro listo para un CRM?</h3><p>25 preguntas para saber qué necesitas antes de elegir herramienta o pedir presupuesto.</p><a class="button" href="/checklist-crm-centros-formacion/">Descargar el checklist</a></aside>',
    "auditoria": '<aside class="articulo-cta"><p class="eyebrow">Diagnóstico gratuito</p><h3>¿Lo aplicamos a tu caso?</h3><p>Revisamos tu proceso y te proponemos una primera mejora realista, sin compromiso.</p><a class="button" href="/auditoria-crm-gratis/">Solicitar diagnóstico</a></aside>',
}

def markdown(texto):
    out, indice, parrafo, lista, cita, tabla = [], [], [], None, [], []

    def cerrar():
        nonlocal parrafo, lista, cita, tabla
        if parrafo:
            out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>"); parrafo = []
        if lista:
            tipo, items = lista
            out.append(f"<{tipo}>" + "".join(f"<li>{en_linea(i)}</li>" for i in items) + f"</{tipo}>"); lista = None
        if cita:
            out.append('<blockquote class="nota">' + "".join(f"<p>{en_linea(c)}</p>" for c in " ".join(cita).split(" ¶ ")) + "</blockquote>"); cita = []
        if tabla:
            filas = [[c.strip() for c in f.strip().strip("|").split("|")] for f in tabla if not re.match(r"^\|?\s*:?-{3,}", f.strip())]
            cab, cuerpo = filas[0], filas[1:]
            out.append('<div class="tabla"><table><thead><tr>' + "".join(f"<th>{en_linea(c)}</th>" for c in cab) + "</tr></thead><tbody>"
                       + "".join("<tr>" + "".join(f"<td>{en_linea(c)}</td>" for c in f) + "</tr>" for f in cuerpo) + "</tbody></table></div>")
            tabla = []

    for linea in texto.split("\n"):
        l = linea.rstrip()
        m = re.match(r"^\[\[(\w+)\]\]$", l.strip())
        if m:
            cerrar(); out.append(CTAS[m.group(1)]); continue
        if not l.strip():
            cerrar(); continue
        m = re.match(r"^(##|###) (.+)$", l)
        if m:
            cerrar()
            nivel, titulo = len(m.group(1)), m.group(2).strip()
            ident = slugify(titulo)
            if nivel == 2:
                indice.append((ident, titulo))
            out.append(f'<h{nivel} id="{ident}">{en_linea(titulo)}</h{nivel}>'); continue
        if l.startswith("|"):
            if parrafo or lista or cita: cerrar()
            tabla.append(l); continue
        if l.startswith("> "):
            if parrafo or lista or tabla: cerrar()
            cita.append(l[2:] if l[2:].strip() else "¶"); continue
        m = re.match(r"^(\d+)\. (.+)$", l) or re.match(r"^[-*] (.+)$", l)
        if m:
            tipo = "ol" if l[0].isdigit() else "ul"
            if parrafo or cita or tabla or (lista and lista[0] != tipo): cerrar()
            if not lista: lista = (tipo, [])
            lista[1].append(m.group(m.lastindex)); continue
        if lista and linea.startswith("  "):
            lista[1][-1] += " " + l.strip(); continue
        if lista or cita or tabla: cerrar()
        parrafo.append(l.strip())
    cerrar()
    return "\n".join(out), indice


# ---------- Lectura de artículos ----------

def leer(ruta):
    bruto = open(ruta, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", bruto, re.S)
    if not m:
        sys.exit(f"{ruta}: falta la cabecera entre ---")
    meta, faq = {}, []
    for linea in m.group(1).split("\n"):
        if not linea.strip() or linea.strip().startswith("#"):
            continue
        clave, _, valor = linea.partition(":")
        clave, valor = clave.strip(), valor.strip()
        if clave == "pregunta":
            faq.append([valor, ""])
        elif clave == "respuesta":
            faq[-1][1] = valor
        else:
            meta[clave] = valor
    obligatorios = ["titulo", "descripcion", "fecha", "categoria", "resumen"]
    falta = [c for c in obligatorios if not meta.get(c)]
    if falta:
        sys.exit(f"{ruta}: faltan campos {falta}")
    if len(meta["descripcion"]) > 160:
        print(f"  aviso: {os.path.basename(ruta)} descripción de {len(meta['descripcion'])} caracteres (máx. 160)")
    meta["slug"] = meta.get("slug") or os.path.splitext(os.path.basename(ruta))[0]
    meta["actualizado"] = meta.get("actualizado") or meta["fecha"]
    meta["titulo_seo"] = meta.get("titulo_seo") or f"{meta['titulo']} | IntegraciónCRM"
    meta["relacionados"] = [u.strip() for u in meta.get("relacionados", "").split(",") if u.strip()]
    meta["faq"] = faq
    meta["cuerpo_html"], meta["indice"] = markdown(m.group(2))
    palabras = len(re.sub(r"<[^>]+>", " ", meta["cuerpo_html"]).split())
    meta["minutos"] = max(1, round(palabras / 220))
    meta["palabras"] = palabras
    return meta

def fecha_larga(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


# ---------- Plantilla de página (cabecera y pie de la web) ----------

def trozos_web():
    base = open(os.path.join(RAIZ, "servicios", "crm-academias-oposiciones", "index.html"), encoding="utf-8").read()
    cabecera = base[base.index("<body>"):base.index('<main id="contenido">')].replace(' aria-current="page"', "")
    pie = base[base.index("</main>"):]
    return cabecera, pie

def cabeza(url, titulo, desc, ld, tipo_og="article", extra=""):
    og = titulo.split(" | ")[0]
    # Imagen para redes propia (generada con tools/og.mjs) o la genérica si aún no existe
    propia = "og/paginas/" + url.strip("/").replace("/", "-") + ".jpg"
    imagen = f"{BASE}/{propia}" if os.path.isfile(os.path.join(RAIZ, propia)) else f"{BASE}/og/og-principal.png"
    return f'''<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="description" content="{e(desc)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large"/><meta name="theme-color" content="#07111f"/>
  <meta property="og:title" content="{e(og)}"/><meta property="og:description" content="{e(desc)}"/><meta property="og:type" content="{tipo_og}"/><meta property="og:site_name" content="IntegraciónCRM"/><meta property="og:url" content="{BASE}{url}"/><meta property="og:image" content="{imagen}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="{e(og)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="{imagen}"/><meta property="og:locale" content="es_ES"/>{extra}
  <link rel="canonical" href="{BASE}{url}"/><link rel="alternate" type="application/rss+xml" title="Blog de IntegraciónCRM" href="{BASE}/blog/feed.xml"/><link rel="icon" href="/brand/integracioncrm/favicons/favicon_mint.ico" sizes="32x32"/><link rel="icon" href="/brand/integracioncrm/favicons/favicon_mint.svg" type="image/svg+xml"/><link rel="apple-touch-icon" href="/brand/integracioncrm/favicons/apple-touch-icon_mint_180.png"/><link rel="stylesheet" href="/styles.css"/><noscript><style>[data-reveal]{{opacity:1;transform:none}}</style></noscript>
  <title>{e(titulo)}</title>
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
'''

def migas(items):
    vis = '<nav class="breadcrumbs" aria-label="Migas de pan">' + '<span aria-hidden="true">/</span>'.join(
        (f'<a href="{u}">{e(n)}</a>' if u else f"<span>{e(n)}</span>") for n, u in items) + "</nav>"
    ld = {"@type": "BreadcrumbList", "itemListElement": [dict({"@type": "ListItem", "position": i + 1, "name": n}, **({"item": BASE + u} if u else {})) for i, (n, u) in enumerate(items)]}
    return vis, ld

def tarjeta(a):
    return (f'<article class="related-card blog-card"><p class="blog-card-meta">{e(a["categoria"])} · {a["minutos"]} min</p>'
            f'<strong><a href="/blog/{a["slug"]}/">{e(a["titulo"])}</a></strong><p>{e(a["resumen"])}</p>'
            f'<a href="/blog/{a["slug"]}/" aria-hidden="true" tabindex="-1">Leer artículo →</a></article>')


def pagina_articulo(a, todos, cabecera, pie):
    url = f"/blog/{a['slug']}/"
    vis, ld_migas = migas([("Inicio", "/"), ("Blog", "/blog/"), (a["titulo"], None)])
    grafo = [{
        "@type": "BlogPosting", "headline": a["titulo"], "description": a["descripcion"], "url": BASE + url,
        "mainEntityOfPage": BASE + url, "datePublished": a["fecha"], "dateModified": a["actualizado"],
        "author": AUTOR, "publisher": {"@id": f"{BASE}/#organization"}, "image": f"{BASE}/og/paginas/blog-{a['slug']}.jpg" if os.path.isfile(os.path.join(RAIZ, "og", "paginas", f"blog-{a['slug']}.jpg")) else f"{BASE}/og/og-principal.png",
        "articleSection": a["categoria"], "wordCount": a["palabras"], "inLanguage": "es"}, ld_migas]
    if a["faq"]:
        grafo.insert(1, {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in a["faq"]]})
    ld = {"@context": "https://schema.org", "@graph": grafo}

    indice = ""
    if len(a["indice"]) >= 3:
        indice = '<nav class="articulo-indice" aria-label="Índice del artículo"><p>En este artículo</p><ol>' + "".join(
            f'<li><a href="#{i}">{en_linea(t)}</a></li>' for i, t in a["indice"]) + "</ol></nav>"
    faq = ""
    if a["faq"]:
        faq = '<h2 id="preguntas-frecuentes">Preguntas frecuentes</h2><div class="faq-list">' + "".join(
            f"<details><summary>{e(q)}</summary><p>{e(r)}</p></details>" for q, r in a["faq"]) + "</div>"
    actualizado = f' · actualizado el {fecha_larga(a["actualizado"])}' if a["actualizado"] != a["fecha"] else ""

    otros = [o for o in todos if o["slug"] != a["slug"]]
    otros.sort(key=lambda o: (o["categoria"] != a["categoria"], o["fecha"]), reverse=False)
    relacionados_blog = otros[:3]
    url_absoluta = BASE + url
    compartir = ('<div class="compartir"><p>Compartir</p>'
        f'<a href="https://www.linkedin.com/sharing/share-offsite/?url={quote(url_absoluta, safe="")}" target="_blank" rel="noopener noreferrer" data-compartir="linkedin">LinkedIn</a>'
        f'<a href="https://wa.me/?text={quote(a["titulo"] + " " + url_absoluta, safe="")}" target="_blank" rel="noopener noreferrer" data-compartir="whatsapp">WhatsApp</a>'
        f'<a href="mailto:?subject={quote(a["titulo"])}&amp;body={quote(url_absoluta)}" data-compartir="email">Email</a>'
        f'<button type="button" data-compartir-copiar="{url_absoluta}">Copiar enlace</button></div>')
    autor = ('<aside class="autor-caja"><img src="/imagenes/mario-herrero-cara-160.jpg" width="160" height="160" alt="Mario Herrero Delgado" loading="lazy" decoding="async"/>'
        '<div><p class="eyebrow">Sobre el autor</p><p class="autor-nombre"><a href="/sobre-nosotros/">Mario Herrero Delgado</a></p>'
        '<p>Fundador y CEO de IntegraciónCRM y consultor senior de CRM. Más de ocho años implantando Zoho, HubSpot y Salesforce, con especial experiencia en centros de formación.</p>'
        '<p class="autor-enlaces"><a href="/sobre-nosotros/">Conocer al equipo</a> · <a href="https://www.linkedin.com/in/marioherrerod/" target="_blank" rel="noopener noreferrer">LinkedIn</a></p></div></aside>')
    servicios = ""
    if a["relacionados"]:
        servicios = '<p class="articulo-servicios">Relacionado: ' + " · ".join(
            f'<a href="{u}">{e(nombre_de(u))}</a>' for u in a["relacionados"]) + "</p>"

    main = f'''<main id="contenido">
    <section class="page-hero articulo-hero"><div class="container" data-reveal>{vis}<p class="eyebrow">{e(a["categoria"])}</p><h1>{e(a["titulo"])}</h1><p class="page-lead">{e(a["resumen"])}</p><div class="articulo-autor"><img src="/imagenes/mario-herrero-cara-96.jpg" width="96" height="96" alt="" loading="lazy" decoding="async"/><p><a href="/sobre-nosotros/">Mario Herrero Delgado</a><span>{fecha_larga(a["fecha"])}{actualizado} · {a["minutos"]} min de lectura</span></p></div></div></section>
    <section class="section articulo-seccion"><div class="container detail-layout"><article class="prose articulo">
{indice}
{a["cuerpo_html"]}
{faq}
{servicios}
{compartir}
{autor}
    </article><aside class="aside-card"><p class="eyebrow light">IntegraciónCRM</p><h2>¿Hablamos de tu caso?</h2><p>Revisamos tu proceso y priorizamos una primera mejora realista.</p><a class="button button-light" href="/auditoria-crm-gratis/">Solicitar diagnóstico</a><small><a href="/checklist-crm-centros-formacion/">O descarga el checklist gratuito</a></small></aside></div></section>
    {('<section class="section"><div class="container"><div class="section-heading"><p class="eyebrow">Sigue leyendo</p><h2>Más del blog.</h2></div><div class="related-grid">' + "".join(tarjeta(o) for o in relacionados_blog) + "</div></div></section>") if relacionados_blog else ""}
  '''
    return url, cabeza(url, a["titulo_seo"], a["descripcion"], ld, "article",
                       f'<meta property="article:published_time" content="{a["fecha"]}"/><meta property="article:modified_time" content="{a["actualizado"]}"/>') + cabecera + main + pie


def nombre_de(url):
    ruta = os.path.join(RAIZ, url.strip("/"), "index.html")
    try:
        t = re.search(r"<title>(.*?)</title>", open(ruta, encoding="utf-8").read()).group(1)
        return html.unescape(t.split(" | ")[0])
    except (OSError, AttributeError):
        sys.exit(f"Enlace relacionado inexistente: {url}")


def pagina_indice(todos, cabecera, pie):
    url = "/blog/"
    vis, ld_migas = migas([("Inicio", "/"), ("Blog", None)])
    desc = "Artículos prácticos sobre CRM, Zoho, automatización e integraciones, con especial atención a centros de formación. Escritos por quien los implanta."
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Blog", "name": "Blog de IntegraciónCRM", "url": BASE + url, "description": desc, "publisher": {"@id": f"{BASE}/#organization"},
         "blogPost": [{"@type": "BlogPosting", "headline": a["titulo"], "url": f"{BASE}/blog/{a['slug']}/", "datePublished": a["fecha"]} for a in todos]},
        ld_migas]}
    categorias = sorted({a["categoria"] for a in todos})
    main = f'''<main id="contenido">
    <section class="page-hero"><div class="container" data-reveal>{vis}<h1><span class="h1-clave">Blog de CRM y automatización</span>Lo que aprendemos <em>implantando CRM de verdad.</em></h1><p class="page-lead">Artículos prácticos sobre Zoho, HubSpot, automatización e integraciones, con especial atención a centros de formación. Sin teoría de folleto: lo que funciona, lo que falla y por qué.</p><div class="mini-proof">{"".join(f"<span>{e(c)}</span>" for c in categorias)}</div></div></section>
    <section class="section blog-lista"><div class="container"><div class="related-grid blog-grid">{"".join(tarjeta(a) for a in todos)}</div>{CTAS["checklist"]}</div></section>
  '''
    return url, cabeza(url, "Blog de CRM, Zoho y automatización | IntegraciónCRM", desc, ld, "website") + cabecera + main + pie


def feed(todos):
    items = "".join(
        f"<item><title>{e(a['titulo'])}</title><link>{BASE}/blog/{a['slug']}/</link><guid>{BASE}/blog/{a['slug']}/</guid>"
        f"<pubDate>{datetime.datetime.combine(datetime.date.fromisoformat(a['fecha']), datetime.time(8)).strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate>"
        f"<description>{e(a['resumen'])}</description></item>" for a in todos)
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Blog de IntegraciónCRM</title>'
            f"<link>{BASE}/blog/</link><description>CRM, Zoho, automatización e integraciones</description><language>es-ES</language>{items}</channel></rss>\n")


# ---------- Sitemap de toda la web ----------

def sitemap(fechas_blog):
    ignorados = [l.strip().strip("/") for l in open(os.path.join(RAIZ, ".assetsignore")) if l.strip() and not l.startswith("#")]
    paginas = []
    for carpeta, dirs, archivos in os.walk(RAIZ):
        rel = os.path.relpath(carpeta, RAIZ)
        partes = [] if rel == "." else rel.split(os.sep)
        if any(p.startswith(".") or p in ignorados or p in ("node_modules", "brand", "_fuentes") for p in partes):
            dirs[:] = []; continue
        if "index.html" in archivos:
            ruta = os.path.join(carpeta, "index.html")
            h = open(ruta, encoding="utf-8").read()
            if "noindex" in (re.search(r'<meta name="robots" content="([^"]*)"', h) or [None, ""])[1]:
                continue
            paginas.append("/" + ("/".join(partes) + "/" if partes else ""))
    cambios = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"], cwd=RAIZ, capture_output=True, text=True).stdout
    hoy = datetime.date.today().isoformat()
    def fecha(u):
        if u.startswith("/blog/") and u in fechas_blog:
            return fechas_blog[u]
        archivo = (u.strip("/") + "/index.html").lstrip("/") if u != "/" else "index.html"
        if archivo in cambios:
            return hoy
        return subprocess.run(["git", "log", "-1", "--format=%cs", "--", archivo], cwd=RAIZ, capture_output=True, text=True).stdout.strip() or hoy
    def prioridad(u):
        if u == "/": return "1.0"
        if u in ("/consultoria-centros-formacion/", "/sectores/", "/servicios/", "/auditoria-crm-gratis/", "/blog/"): return "0.9"
        if u.startswith(("/sectores/", "/servicios/crm-", "/servicios/gestion-", "/servicios/captacion-", "/checklist-")): return "0.8"
        if u.startswith(("/aviso-legal", "/privacidad", "/cookies")): return "0.2"
        return "0.7"
    filas = "".join(f"  <url><loc>{BASE}{u}</loc><lastmod>{fecha(u)}</lastmod><priority>{prioridad(u)}</priority></url>\n" for u in sorted(paginas))
    open(os.path.join(RAIZ, "sitemap.xml"), "w", encoding="utf-8").write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{filas}</urlset>\n')
    return len(paginas)


def main():
    fuentes = sorted(f for f in os.listdir(FUENTES) if f.endswith(".md") and not f.startswith("_"))
    todos = [leer(os.path.join(FUENTES, f)) for f in fuentes]
    hoy = datetime.date.today().isoformat()
    publicados = [a for a in todos if a["fecha"] <= hoy and a.get("borrador", "no") != "si"]
    publicados.sort(key=lambda a: a["fecha"], reverse=True)
    cabecera, pie = trozos_web()
    vivos = set()
    for a in publicados:
        url, doc = pagina_articulo(a, publicados, cabecera, pie)
        destino = os.path.join(RAIZ, url.strip("/"), "index.html")
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        open(destino, "w", encoding="utf-8").write(doc)
        vivos.add(a["slug"])
        print(f"  ✓ {url}  ({a['palabras']} palabras, {a['minutos']} min)")
    # Artículos borrados o pasados a borrador: se elimina su página generada
    for d in os.listdir(os.path.join(RAIZ, "blog")):
        ruta = os.path.join(RAIZ, "blog", d)
        if os.path.isdir(ruta) and not d.startswith("_") and d not in vivos and os.path.isfile(os.path.join(ruta, "index.html")):
            os.remove(os.path.join(ruta, "index.html")); os.rmdir(ruta); print(f"  – retirado /blog/{d}/")
    url, doc = pagina_indice(publicados, cabecera, pie)
    open(os.path.join(RAIZ, "blog", "index.html"), "w", encoding="utf-8").write(doc)
    open(os.path.join(RAIZ, "blog", "feed.xml"), "w", encoding="utf-8").write(feed(publicados))
    n = sitemap({f"/blog/{a['slug']}/": a["actualizado"] for a in publicados})
    print(f"  ✓ /blog/ con {len(publicados)} artículos · feed.xml · sitemap con {n} URLs")
    subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "menu.py")], check=True)
    subprocess.run([sys.executable, os.path.join(RAIZ, "tools", "llms.py")], check=True)
    pendientes = [a["slug"] for a in todos if a not in publicados]
    if pendientes:
        print(f"  (sin publicar todavía: {', '.join(pendientes)})")

if __name__ == "__main__":
    main()
