// Comprobación en navegador real de todas las páginas del sitemap.
// Uso (con la web servida en local):  node tools/comprobar-navegador.mjs
// Detecta: desbordamiento horizontal, texto fuera de la pantalla (también el que
// un contenedor recorta sin desbordar la página), texto ilegible por no tener
// contraste con su fondo, errores de JavaScript y recursos propios que no cargan.
// Sale con código 1 si encuentra algo.
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
    const fallos = await pagina.evaluate(async () => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      const desborde = document.documentElement.scrollWidth - vw;
      if (desborde > 0) out.push(`la página desborda ${desborde}px en horizontal`);
      const textos = [...document.querySelectorAll("main h1, main h2, main h3, main p, main li, main a.button, main td, main label")]
        .filter((el) => !el.closest(".tabla, .table-scroll, [aria-hidden='true']"))
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width && b.height && (b.right > vw + 1 || b.left < -1); });
      for (const el of textos.slice(0, 2)) out.push(`texto fuera de la pantalla: <${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 40)}"`);
      // En móvil, campos con letra menor de 16px hacen que el iPhone haga zoom al tocarlos
      if (vw < 800) {
        for (const el of document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea")) {
          if (el.closest(".honeypot") || !el.getBoundingClientRect().width) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 16) out.push(`campo «${el.name || el.id}» a ${fs}px: el iPhone hará zoom (mínimo 16px)`);
        }
      }
      // Texto ilegible: mismo color que su fondo. Pasó de verdad: una sección con
      // texto blanco a la que le faltaba el fondo oscuro se leía en blanco sobre
      // blanco. El umbral es bajo a propósito (1,8): aquí solo se busca lo
      // invisible, no afinar la paleta.
      const lin = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
      const luz = (c) => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
      const cifras = (t) => (t.match(/[\d.]+/g) || []).map(Number);
      const opaco = (t) => { const n = cifras(t); return n.length > 3 ? n[3] : 1; };
      const deDegradado = (img) => {
        const cols = [...img.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => m[1].split(",").map(Number))
          .filter((c) => c.length < 4 || c[3] > .5).map((c) => c.slice(0, 3));
        return cols.length ? [0, 1, 2].map((i) => cols.reduce((a, c) => a + c[i], 0) / cols.length) : null;
      };
      const fondoDe = (el) => {
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          const st = getComputedStyle(n);
          if (st.backgroundImage !== "none") { const c = deDegradado(st.backgroundImage); if (c) return c; }
          if (opaco(st.backgroundColor) > .5) return cifras(st.backgroundColor).slice(0, 3);
          const antes = getComputedStyle(n, "::before");
          if (antes.content !== "none" && antes.position === "absolute"
              && opaco(antes.backgroundColor) > .5 && +antes.opacity > .8) return cifras(antes.backgroundColor).slice(0, 3);
        }
        const raiz = getComputedStyle(document.documentElement).backgroundColor;
        return opaco(raiz) > .5 ? cifras(raiz).slice(0, 3) : [255, 255, 255];
      };
      const contraste = (el) => {
        const st = getComputedStyle(el);
        const fondo = fondoDe(el);
        const a = opaco(st.color), frente = cifras(st.color).slice(0, 3);
        const mezcla = frente.map((v, i) => v * a + fondo[i] * (1 - a));
        const l1 = luz(mezcla) + .05, l2 = luz(fondo) + .05;
        return l1 > l2 ? l1 / l2 : l2 / l1;
      };
      const sospechosos = [];
      for (const el of document.querySelectorAll("main h1, main h2, main h3, main h4, main p, main li, main a, main b, main strong, main td, main th, main label, main summary")) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const st = getComputedStyle(el);
        const caja = el.getBoundingClientRect();
        if (!caja.width || !caja.height || st.visibility === "hidden" || +st.opacity < .5) continue;
        if (st.backgroundClip === "text" || st.webkitBackgroundClip === "text") continue;
        if (contraste(el) < 1.8) sospechosos.push(el);
      }
      // Se vuelve a medir con el bloque a la vista: algunos fondos solo se pintan
      // cuando la sección entra en pantalla, y fuera de ella el dato no vale.
      // Margen para que el fondo se repinte: algunos se recalculan al hacer scroll
      const cuadro = () => new Promise((r) => setTimeout(() => requestAnimationFrame(r), 120));
      const antesDeMirar = scrollY;
      for (const el of sospechosos) {
        el.scrollIntoView({ block: "center", behavior: "instant" });  // sin el suave, que no da tiempo a asentarse
        await cuadro();
        const r = contraste(el);
        if (r < 1.8) {
          out.push(`texto ilegible (contraste ${r.toFixed(2)}): "${el.textContent.trim().slice(0, 40)}"`);
          break;
        }
      }
      scrollTo(0, antesDeMirar);
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
