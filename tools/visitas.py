#!/usr/bin/env python3
"""Qué páginas se visitan, de dónde llega la gente y desde qué país.

Lee Cloudflare Web Analytics, que mide a todo el mundo porque no usa cookies
(Google Analytics y Clarity solo miden a quien acepta el aviso, así que dan
menos de lo real).

Antes de usarlo hay que crear un token de lectura en Cloudflare y guardarlo
FUERA de este repositorio, que es público:

    mkdir -p ~/.config/integracioncrm
    cat > ~/.config/integracioncrm/cloudflare.env <<'FIN'
    CLOUDFLARE_API_TOKEN=el_token
    CLOUDFLARE_ACCOUNT_ID=el_identificador_de_cuenta
    FIN
    chmod 600 ~/.config/integracioncrm/cloudflare.env

El token se crea en Mi perfil → Tokens de API → Crear token → Token
personalizado, con un único permiso: Cuenta → Account Analytics → Read.

Uso:
    python3 tools/visitas.py            # últimos 7 días
    python3 tools/visitas.py --dias 30
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

AJUSTES = Path.home() / ".config" / "integracioncrm" / "cloudflare.env"
GRAPHQL = "https://api.cloudflare.com/client/v4/graphql"
RAIZ = Path(__file__).resolve().parent.parent


def credenciales():
    datos = {}
    if AJUSTES.exists():
        for linea in AJUSTES.read_text().splitlines():
            if "=" in linea and not linea.strip().startswith("#"):
                clave, valor = linea.split("=", 1)
                datos[clave.strip()] = valor.strip().strip('"').strip("'")
    token = os.environ.get("CLOUDFLARE_API_TOKEN") or datos.get("CLOUDFLARE_API_TOKEN")
    cuenta = os.environ.get("CLOUDFLARE_ACCOUNT_ID") or datos.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not cuenta:
        sys.exit(f"Faltan credenciales. Crea {AJUSTES} como explica la cabecera de este archivo.")
    return token, cuenta


def etiqueta_del_sitio(token, cuenta):
    """El identificador que pide la API (siteTag) NO es el del beacon (siteToken).

    En el HTML va el siteToken; la API de analítica quiere el siteTag. Se
    traduce uno en otro preguntando a Cloudflare por los sitios de la cuenta.
    """
    portada = (RAIZ / "index.html").read_text(encoding="utf8")
    m = re.search(r'data-cf-beacon=\'{"token":\s*"([0-9a-f]{32})"', portada)
    if not m:
        sys.exit("No se encuentra el token de Web Analytics en index.html.")
    del_beacon = m.group(1)

    peticion = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{cuenta}/rum/site_info/list",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as r:
            sitios = json.load(r).get("result") or []
    except urllib.error.HTTPError as e:
        sys.exit(f"No se pueden listar los sitios de Web Analytics: {e.code} {e.read().decode()[:200]}")

    for s in sitios:
        if s.get("site_token") == del_beacon:
            return s["site_tag"]
    for s in sitios:                                   # si no, el del propio dominio
        if (s.get("ruleset") or {}).get("zone_name", "").endswith("integracioncrm.com"):
            return s["site_tag"]
    sys.exit("No se encuentra el sitio de Web Analytics de integracioncrm.com.")


def consulta(token, cuerpo, variables):
    peticion = urllib.request.Request(
        GRAPHQL,
        data=json.dumps({"query": cuerpo, "variables": variables}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as r:
            respuesta = json.load(r)
    except urllib.error.HTTPError as e:
        detalle = e.read().decode()[:400]
        sys.exit(f"Cloudflare responde {e.code}. {detalle}")
    if respuesta.get("errors"):
        sys.exit("Cloudflare devuelve errores: " + json.dumps(respuesta["errors"])[:400])
    return respuesta["data"]["viewer"]["accounts"][0]["rumPageloadEventsAdaptiveGroups"]


PLANTILLA = """
query ($cuenta: String!, $sitio: String!, $desde: Time!, $hasta: Time!) {
  viewer { accounts(filter: { accountTag: $cuenta }) {
    rumPageloadEventsAdaptiveGroups(
      limit: 200
      filter: { siteTag: $sitio, datetime_geq: $desde, datetime_leq: $hasta }
      orderBy: [count_DESC]
    ) { count sum { visits } dimensions { %s } }
  } }
}
"""


def pedir(token, cuenta, sitio, desde, hasta, dimension):
    variables = {"cuenta": cuenta, "sitio": sitio, "desde": desde, "hasta": hasta}
    filas = consulta(token, PLANTILLA % dimension, variables)
    agrupado = defaultdict(lambda: [0, 0])
    for f in filas:
        clave = list(f["dimensions"].values())[0]
        agrupado[clave][0] += f["count"]
        agrupado[clave][1] += f["sum"]["visits"]
    return sorted(agrupado.items(), key=lambda x: -x[1][0])


def tabla(titulo, filas, limite=15, vacio="sin datos todavía"):
    print(f"\n{titulo}")
    if not filas:
        print(f"   {vacio}")
        return
    ancho = max(len(str(k)) for k, _ in filas[:limite])
    print(f"   {'':<{ancho}}   vistas  visitas")
    for clave, (vistas, visitas) in filas[:limite]:
        print(f"   {str(clave):<{ancho}}   {vistas:>6}  {visitas:>7}")


def main():
    p = argparse.ArgumentParser(description="Visitas de la web según Cloudflare Web Analytics")
    p.add_argument("--dias", type=int, default=7, help="días hacia atrás (por defecto 7)")
    args = p.parse_args()

    token, cuenta = credenciales()
    sitio = etiqueta_del_sitio(token, cuenta)
    hasta = date.today() + timedelta(days=1)
    desde = hasta - timedelta(days=args.dias + 1)
    d1, d2 = f"{desde}T00:00:00Z", f"{hasta}T00:00:00Z"

    print(f"integracioncrm.com · últimos {args.dias} días ({desde} a {date.today()})")

    paginas = pedir(token, cuenta, sitio, d1, d2, "requestPath")
    dias = pedir(token, cuenta, sitio, d1, d2, "date")
    origenes = pedir(token, cuenta, sitio, d1, d2, "refererHost")
    paises = pedir(token, cuenta, sitio, d1, d2, "countryName")

    total_vistas = sum(v for _, (v, _) in paginas)
    total_visitas = sum(s for _, (_, s) in paginas)
    print(f"\nTotal: {total_vistas} páginas vistas · {total_visitas} visitas")

    tabla("Páginas más vistas", paginas)
    tabla("Por día", sorted(dias, key=lambda x: str(x[0])), limite=31)
    tabla("De dónde llegan", origenes, vacio="nadie ha llegado desde otra web todavía")
    tabla("Países", paises, limite=8)


if __name__ == "__main__":
    main()
