import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const urls = readFileSync('sitemap.xml','utf8').match(/<loc>([^<]+)<\/loc>/g).map(m=>m.replace(/<\/?loc>/g,'').replace('https://integracioncrm.com',''));
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1280,height:900}})).newPage();

const AUD = () => {
  const lum = (c) => { const [r,g,bl] = c.map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); }); return .2126*r+.7152*g+.0722*bl; };
  const nums = (s) => (s.match(/[\d.]+/g)||[]).map(Number);
  const rgb = (s) => nums(s).slice(0,3);
  const alfa = (s) => { const n = nums(s); return n.length>3 ? n[3] : 1; };
  // media de los colores de un degradado, que es lo que se percibe de fondo
  const deImagen = (img) => {
    const cols = [...img.matchAll(/rgba?\(([^)]+)\)/g)].map(m => m[1].split(',').map(Number))
      .filter(c => c.length < 4 || c[3] > .5).map(c => c.slice(0,3));
    if (!cols.length) return null;
    return [0,1,2].map(i => cols.reduce((a,c) => a + c[i], 0) / cols.length);
  };
  const fondoDe = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const st = getComputedStyle(n);
      if (st.backgroundImage !== 'none') { const c = deImagen(st.backgroundImage); if (c) return c; }
      if (alfa(st.backgroundColor) > .5) return rgb(st.backgroundColor);
      // un pseudo-elemento opaco por detras tambien tapa (caso de las secciones oscuras)
      const antes = getComputedStyle(n, '::before');
      if (antes.content !== 'none' && alfa(antes.backgroundColor) > .5 && +antes.opacity > .8
          && antes.position === 'absolute') return rgb(antes.backgroundColor);
      n = n.parentElement;
    }
    const raiz = getComputedStyle(document.documentElement).backgroundColor;
    return alfa(raiz) > .5 ? rgb(raiz) : [255,255,255];
  };
  const malos = [];
  document.querySelectorAll('p,h1,h2,h3,h4,li,span,a,td,th,small,em,strong,label,legend,summary').forEach(el => {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const st = getComputedStyle(el);
    const c = el.getBoundingClientRect();
    if (!c.width || !c.height || st.visibility === 'hidden' || +st.opacity < .5) return;
    let col = st.color;
    if (st.webkitTextFillColor && st.webkitTextFillColor !== 'rgba(0, 0, 0, 0)') col = st.webkitTextFillColor;
    const rellenoTexto = st.backgroundClip === 'text' || st.webkitBackgroundClip === 'text';
    if (rellenoTexto) return;               // se mide aparte
    const f = fondoDe(el), a = alfa(col), fg = rgb(col);
    const mez = fg.map((v,i) => v*a + f[i]*(1-a));
    const L1 = lum(mez)+.05, L2 = lum(f)+.05;
    const ratio = L1 > L2 ? L1/L2 : L2/L1;
    if (ratio < 2.2) malos.push({ t: el.textContent.trim().slice(0,42), ratio: +ratio.toFixed(2),
                                  color: col, fondo: 'rgb('+f.map(Math.round).join(',')+')' });
  });
  return malos;
};

let n = 0, total = 0;
for (const u of urls) {
  await p.goto('http://127.0.0.1:9075'+u, {waitUntil:'domcontentloaded'});
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
  await p.evaluate(() => scrollTo(0,0)); await p.waitForTimeout(150);
  const malos = await p.evaluate(AUD);
  if (malos.length) { n++; total += malos.length; console.log('\n'+u);
    malos.slice(0,5).forEach(m => console.log('   ', JSON.stringify(m)));
    if (malos.length > 5) console.log('    … y', malos.length-5, 'más'); }
}
console.log('\npáginas con texto de bajo contraste:', n, 'de', urls.length, '· avisos:', total);
await b.close();
