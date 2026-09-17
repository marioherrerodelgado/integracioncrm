// Comprobación en navegador real de todas las páginas del sitemap.
// Uso (con la web servida en local):  node tools/comprobar-navegador.mjs
// Detecta: desbordamiento horizontal, texto fuera de la pantalla (también el que
// un contenedor recorta sin desbordar la página), errores de JavaScript y
// recursos propios que no cargan. Sale con código 1 si encuentra algo.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8080";
const ANCHOS = [1440, 1024, 390, 320];
const xml = readFileSync("sitemap.xml", "utf8");
const paginas = [...xml.matchAll(/<loc>https:\/\/integracioncrm\.com([^<]*)<\/loc>/g)].map((m) => m[1]).concat(["/404.html"]);

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
const problemas = [];
let actual = "";

// Sin terceros: más rápido y sin enviar visitas falsas a la analítica
await pagina.route((url) => !url.href.startsWith(BASE), (ruta) => ruta.abort());
pagina.on("pageerror", (e) => problemas.push(`${actual}: error de JavaScript: ${e.message}`));
pagina.on("response", (r) => {
  if (r.url().startsWith(BASE) && r.status() >= 400 && !r.url().endsWith("/404.html") && !r.url().endsWith("/favicon.ico")) {
    problemas.push(`${actual}: ${r.status()} al cargar ${r.url().replace(BASE, "")}`);
  }
});

for (const ruta of paginas) {
  for (const ancho of ANCHOS) {
    actual = `${ruta} a ${ancho}px`;
    await pagina.setViewportSize({ width: ancho, height: 900 });
    await pagina.goto(BASE + ruta, { waitUntil: "load" });
    const fallos = await pagina.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      const desborde = document.documentElement.scrollWidth - vw;
      if (desborde > 0) out.push(`la página desborda ${desborde}px en horizontal`);
      const textos = [...document.querySelectorAll("main h1, main h2, main h3, main p, main li, main a.button, main td, main label")]
        .filter((el) => !el.closest(".tabla, .table-scroll, [aria-hidden='true']"))
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width && b.height && (b.right > vw + 1 || b.left < -1); });
      for (const el of textos.slice(0, 2)) out.push(`texto fuera de la pantalla: <${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 40)}"`);
      return out;
    });
    for (const f of fallos) problemas.push(`${actual}: ${f}`);
  }
}
await navegador.close();

const unicos = [...new Set(problemas)];
console.log(`Comprobadas ${paginas.length} páginas en ${ANCHOS.length} anchos.`);
for (const p of unicos) console.log(`  ERROR  ${p}`);
if (unicos.length) { console.log(`\n${unicos.length} problema(s).`); process.exit(1); }
console.log("Todo correcto.");
