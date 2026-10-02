import "./globales.js";
import "./main.jsx";

/* Contador de visitas de la web (el mismo que hay al principio de /script.js,
   que la demo no carga): sin cookies ni identificadores, solo en el dominio real
   y desactivable con ?no-contar. Si cambia allí, cambiarlo aquí también. */
(() => {
  try {
    if (new URLSearchParams(location.search).has("no-contar")) localStorage.setItem("icrm-no-contar", "1");
    if (localStorage.getItem("icrm-no-contar")) return;
  } catch { /* sin almacenamiento: se cuenta igual */ }
  if (location.hostname !== "integracioncrm.com" || navigator.webdriver) return;
  let origen = "";
  try { origen = document.referrer ? new URL(document.referrer).hostname : ""; } catch { /* referencia rara */ }
  const interna = origen === location.hostname;
  const datos = JSON.stringify({ pagina: location.pathname, referente: interna ? "" : origen, nueva: !interna });
  const enviado = navigator.sendBeacon?.("/api/visita", new Blob([datos], { type: "application/json" }));
  if (!enviado) fetch("/api/visita", { method: "POST", body: datos, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
})();
