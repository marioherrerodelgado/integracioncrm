// Demo de CRM y portal a medida (empresa ficticia Altavento).
// Uso:  cd tools/demo && npm install && node build.mjs
//  - Web:      ../../demo/app.js y app.css (React dentro del paquete, sin terceros: cumple la CSP de _headers)
//  - Artifact: dist/demo.html (una sola página; React desde cdnjs)
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const run = (c) => execSync(c, { stdio: "inherit" });
mkdirSync("build", { recursive: true }); mkdirSync("dist", { recursive: true }); mkdirSync("../../demo", { recursive: true });

run("npx tailwindcss -i src/styles.css -o ../../demo/app.css --minify");
run(`npx esbuild src/sitio.js --bundle --minify --target=es2020 --jsx-factory=React.createElement --jsx-fragment=React.Fragment --define:process.env.NODE_ENV='"production"' --outfile=../../demo/app.js`);

run("npx esbuild src/main.jsx --bundle --minify --target=es2020 --jsx-factory=React.createElement --jsx-fragment=React.Fragment --outfile=build/app.js");
const css = readFileSync("../../demo/app.css", "utf8");
const js = readFileSync("build/app.js", "utf8").replace(/<\/script/gi, "<\/script");
writeFileSync("dist/demo.html", `<title>Altavento CRM y portal</title>
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`);
console.log("Listo: demo/app.js, demo/app.css y dist/demo.html");
