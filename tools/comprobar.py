#!/usr/bin/env python3
"""Comprobaciones estáticas de integracioncrm.com antes de publicar.

Uso:  python3 tools/comprobar.py
Sale con código 1 si encuentra errores (bloquea el push y avisa en GitHub).

Revisa: estructura HTML, JSON-LD, enlaces y recursos internos, títulos,
descripciones, H1, canonical, sitemap frente a páginas publicadas, sintaxis
de script.js y equilibrio de llaves en styles.css.
"""
import html, json, os, re, subprocess, sys
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
BASE = "https://integracioncrm.com"
errores, avisos = [], []

def error(msg): errores.append(msg)
def aviso(msg): avisos.append(msg)

ignorados = [l.strip().strip("/") for l in open(".assetsignore") if l.strip() and not l.startswith("#")]
def publicado(ruta):
    partes = ruta.strip("/").split("/")
    return not any(p in ignorados or p.startswith(".") for p in partes) and ruta.strip("/") not in ignorados

redirecciones = {l.split()[0] for l in open("_redirects") if l.strip() and not l.startswith("#")}

# Páginas publicadas
paginas = []
for carpeta, dirs, archivos in os.walk("."):
    rel = os.path.relpath(carpeta, ".")
    partes = [] if rel == "." else rel.split(os.sep)
    if any(p.startswith(".") or p in ignorados or p in ("node_modules", "brand") for p in partes):
        dirs[:] = []; continue
    for a in archivos:
        if a.endswith(".html"):
            paginas.append(os.path.join(rel, a) if rel != "." else a)
paginas.sort()

VACIOS = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr",
          "use","path","circle","rect","polyline","line","polygon","ellipse","stop"}
TARJETAS = {"related-card","service-tile","panel","modulo","pieza","nodo","que-hacemos","faq-list",
            "number-list","check-list","aside-card","articulo-cta","cta-card","sobre-foto"}

class Estructura(HTMLParser):
    def __init__(self):
        super().__init__(); self.pila = []; self.fallos = []
    def handle_starttag(self, tag, attrs):
        if tag in VACIOS: return
        clase = (dict(attrs).get("class") or "").split(" ")[0]
        if tag in ("section", "main", "header", "footer"):
            dentro = [c for t, c in self.pila if c in TARJETAS] + [t for t, c in self.pila if t in ("li", "p", "details", "footer") and tag != "footer"]
            if dentro:
                self.fallos.append(f"<{tag}> dentro de {dentro[-1]} (línea {self.getpos()[0]})")
        if clase in TARJETAS and any(t == "footer" for t, _ in self.pila):
            self.fallos.append(f"bloque de contenido .{clase} dentro del pie de página (línea {self.getpos()[0]})")
        self.pila.append((tag, clase))
    def handle_endtag(self, tag):
        if tag in VACIOS: return
        if self.pila and self.pila[-1][0] == tag:
            self.pila.pop(); return
        abiertas = [t for t, _ in self.pila]
        if tag == "p" and tag not in abiertas: return
        self.fallos.append(f"</{tag}> no cierra lo que está abierto: <{self.pila[-1][0] if self.pila else '—'}> (línea {self.getpos()[0]})")
        if tag in abiertas:
            del self.pila[len(abiertas) - 1 - abiertas[::-1].index(tag):]

titulos, descripciones, indexables = {}, {}, set()
for p in paginas:
    h = open(p, encoding="utf-8").read()
    e = Estructura(); e.feed(h)
    for f in e.fallos[:3]: error(f"{p}: {f}")
    sin_cerrar = [t for t, _ in e.pila if t not in ("html", "body", "head")]
    if sin_cerrar: error(f"{p}: etiquetas sin cerrar {sin_cerrar[:4]}")

    for bloque in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: json.loads(bloque)
        except ValueError as ex: error(f"{p}: JSON-LD inválido ({ex})")

    for u in re.findall(r'(?:href|src|srcset|action)="(/[^"#?\s]*)', h):
        if u.startswith("//"): continue
        q = u.strip("/")
        existe = u == "/" or os.path.isfile(q) or os.path.isfile(os.path.join(q, "index.html"))
        if u in redirecciones or u.rstrip("/") in redirecciones: continue
        if not existe: error(f"{p}: enlace o recurso roto {u}")
        elif not publicado(q): error(f"{p}: enlaza a algo que no se publica {u}")
    for u in re.findall(r'srcset="([^"]+)"', h):
        for parte in u.split(","):
            ruta = parte.strip().split(" ")[0]
            if ruta.startswith("/") and not os.path.isfile(ruta.strip("/")): error(f"{p}: srcset roto {ruta}")

    if p == "404.html": continue
    robots = (re.search(r'<meta name="robots" content="([^"]*)"', h) or [None, ""])[1]
    url = "/" + ("" if p == "index.html" else p[:-len("index.html")])
    if "noindex" not in robots: indexables.add(url)
    t = re.search(r"<title>(.*?)</title>", h, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', h)
    if not t: error(f"{p}: sin <title>"); continue
    t = html.unescape(t.group(1).strip())
    if not 30 <= len(t) <= 66: aviso(f"{p}: título de {len(t)} caracteres (ideal 30-62)")
    if t in titulos: error(f"{p}: título duplicado con {titulos[t]}")
    titulos[t] = p
    if not d: error(f"{p}: sin meta description")
    else:
        d = html.unescape(d.group(1))
        if len(d) > 160: error(f"{p}: descripción de {len(d)} caracteres (máx. 160)")
        elif len(d) < 100: aviso(f"{p}: descripción corta ({len(d)} caracteres)")
        if d in descripciones: error(f"{p}: descripción duplicada con {descripciones[d]}")
        descripciones[d] = p
    h1 = len(re.findall(r"<h1[\s>]", h))
    if h1 != 1: error(f"{p}: {h1} H1 (debe haber uno)")
    if f'<link rel="canonical" href="{BASE}{url}"' not in h: error(f"{p}: canonical ausente o distinto de {url}")

# Sitemap
sitemap = set(re.findall(rf"<loc>{re.escape(BASE)}([^<]*)</loc>", open("sitemap.xml").read()))
for falta in sorted(indexables - sitemap): error(f"sitemap.xml: falta {falta}")
for sobra in sorted(sitemap - indexables): error(f"sitemap.xml: incluye {sobra}, que no existe o no se publica")

# script.js y styles.css
r = subprocess.run(["node", "--check", "script.js"], capture_output=True, text=True)
if r.returncode != 0: error(f"script.js: error de sintaxis\n{r.stderr.strip()[:400]}")
css = open("styles.css").read()
if css.count("{") != css.count("}"): error(f"styles.css: llaves descompensadas ({css.count('{')} abren, {css.count('}')} cierran)")

# Blog: las páginas generadas deben coincidir con las fuentes
fuentes = [f for f in os.listdir("blog/_fuentes") if f.endswith(".md") and not f.startswith("_")]
for f in fuentes:
    slug = f[:-3]
    borrador = re.search(r"^borrador:\s*si", open(f"blog/_fuentes/{f}").read(), re.M)
    fecha = re.search(r"^fecha:\s*(\S+)", open(f"blog/_fuentes/{f}").read(), re.M)
    import datetime
    if not borrador and fecha and fecha.group(1) <= datetime.date.today().isoformat() and not os.path.isfile(f"blog/{slug}/index.html"):
        error(f"blog/_fuentes/{f}: no está generado. Ejecuta python3 tools/blog.py")

print(f"Comprobadas {len(paginas)} páginas.")
for a in avisos: print(f"  aviso  {a}")
for e in errores: print(f"  ERROR  {e}")
if errores:
    print(f"\n{len(errores)} error(es). Corrígelos antes de publicar.")
    sys.exit(1)
print("Todo correcto." if not avisos else f"Sin errores ({len(avisos)} aviso(s)).")
