// Genera la imagen para redes (Open Graph, 1200x630) de cada página y la enlaza en su HTML.
// Uso:  node tools/og.mjs            → solo las que faltan
//       node tools/og.mjs --todas    → las regenera todas
// Después de publicar un artículo:  python3 tools/blog.py && node tools/og.mjs
// Usa las fuentes del sistema (Avenir Next en macOS).
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://integracioncrm.com";
const TODAS = process.argv.includes("--todas");
// Diseñadas a mano o sin interés para compartir
const EXCLUIR = new Set(["/", "/consultoria-centros-formacion/", "/auditoria-crm-gratis/", "/aviso-legal/", "/privacidad/", "/cookies/"]);
const ignorados = readFileSync(".assetsignore", "utf8").split("\n").map((l) => l.trim().replace(/\/$/, "")).filter((l) => l && !l.startsWith("#"));

const logo = "data:image/svg+xml;base64," + readFileSync("brand/integracioncrm/logos/integracioncrm_logo_dark.svg").toString("base64");
const icono = "data:image/svg+xml;base64," + readFileSync("brand/integracioncrm/logos/integracioncrm_icon_dark.svg").toString("base64");
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const desc = (t) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

function paginas(dir = ".") {
  const out = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    const partes = ruta.split("/");
    if (partes.some((p) => p.startsWith(".") || ignorados.includes(p) || p === "node_modules" || p === "brand")) continue;
    if (statSync(ruta).isDirectory()) out.push(...paginas(ruta));
    else if (nombre === "index.html") out.push(ruta);
  }
  return out;
}

const plantilla = (seccion, titulo) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0}
.lienzo{position:relative;width:1200px;height:630px;overflow:hidden;background:#081426;font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;color:#fff;padding:64px 80px}
.lienzo::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 88% 18%,rgba(45,230,166,.16),transparent 70%);}
.lienzo::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 70% 80% at 70% 40%,#000 30%,transparent 80%)}
.logo{position:relative;z-index:1;height:74px;margin-left:-14px}
.icono{position:absolute;z-index:0;right:-70px;bottom:-90px;width:470px;opacity:.14}
.texto{position:absolute;z-index:1;left:80px;right:220px;bottom:108px}
.seccion{margin:0 0 20px;color:#2DE6A6;font-size:20px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
h1{margin:0;font-size:${titulo.length > 70 ? 50 : titulo.length > 48 ? 58 : 68}px;line-height:1.06;letter-spacing:-.035em;font-weight:800}
.pie{position:absolute;z-index:1;left:80px;right:80px;bottom:48px;display:flex;justify-content:space-between;color:#9eafc0;font-size:20px;font-weight:600;letter-spacing:.02em}
.pie b{color:#fff}
.barra{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#0A5F4B,#2DE6A6)}
</style></head><body><div class="lienzo">
<img class="logo" src="${logo}" alt=""><img class="icono" src="${icono}" alt="">
<div class="texto"><p class="seccion">${esc(seccion)}</p><h1>${esc(titulo)}</h1></div>
<div class="pie"><span><b>integracioncrm.com</b></span><span>Consultoría e integración CRM</span></div>
<div class="barra"></div></div></body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
let generadas = 0, enlazadas = 0;

for (const archivo of paginas().sort()) {
  const url = "/" + archivo.replace(/index\.html$/, "");
  if (EXCLUIR.has(url)) continue;
  let htmlPagina = readFileSync(archivo, "utf8");
  if (/<meta name="robots" content="[^"]*noindex/.test(htmlPagina)) continue;

  const titulo = desc((htmlPagina.match(/<meta property="og:title" content="([^"]*)"/) || htmlPagina.match(/<title>([^<|]*)/) || [, ""])[1]).trim();
  const migas = (htmlPagina.match(/"BreadcrumbList","itemListElement":(\[.*?\])\}/) || [])[1];
  let seccion = "IntegraciónCRM";
  if (migas) {
    const nombres = JSON.parse(migas).map((i) => i.name);
    if (nombres.length >= 3) seccion = nombres[1];
    else if (nombres.length === 2) seccion = nombres[1];
  }
  if (url.startsWith("/blog/") && url !== "/blog/") seccion = "Blog · " + desc((htmlPagina.match(/<p class="eyebrow">([^<]*)<\/p><h1>/) || [, "Artículo"])[1]);

  const nombre = url.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  const destino = `og/paginas/${nombre}.jpg`;
  if (TODAS || !existsSync(destino)) {
    await pagina.setContent(plantilla(seccion, titulo), { waitUntil: "load" });
    await pagina.screenshot({ path: destino, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    generadas++;
  }

  const imagen = `${BASE}/${destino}`;
  const antes = htmlPagina;
  htmlPagina = htmlPagina
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imagen}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imagen}$2`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${esc(titulo)}$2`);
  if (htmlPagina !== antes) { writeFileSync(archivo, htmlPagina); enlazadas++; }
}
await navegador.close();
console.log(`Imágenes generadas: ${generadas} · páginas actualizadas: ${enlazadas}`);
