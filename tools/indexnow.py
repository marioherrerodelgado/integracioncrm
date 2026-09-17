#!/usr/bin/env python3
"""Avisa a los buscadores que admiten IndexNow (Bing, Yandex, Seznam, Naver) de
las páginas nuevas o modificadas. Google NO admite IndexNow: sus páginas se
descubren por el sitemap y los enlaces, o se piden a mano en Search Console.

Uso:
  python3 tools/indexnow.py              → URLs cambiadas en el último commit
  python3 tools/indexnow.py --todas      → todas las URLs del sitemap
  python3 tools/indexnow.py --simular    → muestra qué enviaría, sin enviar nada
  python3 tools/indexnow.py /una/url/ /otra/   → solo esas

La clave está en CLAVE y su archivo debe seguir publicado en la raíz del sitio
(https://integracioncrm.com/<clave>.txt). Si el archivo desaparece, los avisos
se rechazan.
"""
import json, os, re, subprocess, sys, urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
BASE = "https://integracioncrm.com"
CLAVE = "2510cb48378189724e6948b73b1afca6"
API = "https://api.indexnow.org/IndexNow"
LIMITE = 10000  # máximo de URLs por envío según IndexNow


def url_de(archivo):
    """'servicios/zoho/index.html' → '/servicios/zoho/'"""
    return "/" + archivo[: -len("index.html")]


def del_sitemap():
    xml = open("sitemap.xml", encoding="utf-8").read()
    return [u.replace(BASE, "") for u in re.findall(r"<loc>([^<]+)</loc>", xml)]


def del_ultimo_commit():
    rango = sys.argv[sys.argv.index("--rango") + 1] if "--rango" in sys.argv else "HEAD~1 HEAD"
    salida = subprocess.run(["git", "diff", "--name-only", "--diff-filter=d", *rango.split()],
                            capture_output=True, text=True, check=True).stdout.split()
    return [url_de(f) for f in salida if f.endswith("index.html")]


def main():
    sueltas = [a for a in sys.argv[1:] if a.startswith("/")]
    if sueltas:
        rutas = sueltas
    elif "--todas" in sys.argv:
        rutas = del_sitemap()
    else:
        rutas = del_ultimo_commit()

    publicadas = set(del_sitemap())
    rutas = [r for r in dict.fromkeys(rutas) if r in publicadas]
    if not rutas:
        print("IndexNow: ninguna página publicable que avisar.")
        return 0
    if len(rutas) > LIMITE:
        print(f"IndexNow: {len(rutas)} URLs supera el límite de {LIMITE}.")
        return 1

    cuerpo = {"host": BASE.split("//")[1], "key": CLAVE,
              "keyLocation": f"{BASE}/{CLAVE}.txt",
              "urlList": [BASE + r for r in rutas]}
    print(f"IndexNow: {len(rutas)} URL(s)")
    for r in rutas:
        print("  " + r)
    if "--simular" in sys.argv:
        print("(simulación: no se ha enviado nada)")
        return 0

    peticion = urllib.request.Request(API, data=json.dumps(cuerpo).encode(),
                                      headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(peticion, timeout=30) as r:
            # 200 = aceptado · 202 = aceptado, clave pendiente de comprobar
            print(f"Respuesta {r.status} {r.reason}")
            return 0 if r.status in (200, 202) else 1
    except urllib.error.HTTPError as e:
        # 403: clave no válida · 422: URL que no es del dominio · 429: demasiados envíos
        print(f"Error {e.code}: {e.read().decode(errors='replace')[:300]}")
        return 1
    except Exception as e:
        print(f"No se pudo avisar a IndexNow: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
