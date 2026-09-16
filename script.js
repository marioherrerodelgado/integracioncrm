const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  navigation?.classList.toggle("open", !open);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
  });
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.13 }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("revealed"));
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    const currentButton = event.currentTarget;
    const email = currentButton.dataset.copy;
    try {
      await navigator.clipboard.writeText(email);
      currentButton.textContent = "Email copiado ✓";
    } catch {
      currentButton.textContent = email;
    }
    window.setTimeout(() => { currentButton.textContent = "Copiar email"; }, 2200);
  });
});

const meetingDateInput = document.querySelector("[data-meeting-date]");
const meetingTimeInput = document.querySelector("[data-meeting-time]");
const calendarDays = document.querySelector("[data-calendar-days]");
const timeOptions = document.querySelector("[data-time-options]");

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

if (calendarDays && meetingDateInput) {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (dates.length < 8) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  dates.forEach((date, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-option";
    button.dataset.value = formatDateValue(date);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<small>${new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date)}</small><strong>${date.getDate()}</strong><em>${new Intl.DateTimeFormat("es-ES", { month: "short" }).format(date)}</em>`;
    button.addEventListener("click", () => {
      calendarDays.querySelectorAll(".date-option").forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      meetingDateInput.value = button.dataset.value;
      meetingDateInput.setCustomValidity("");
    });
    calendarDays.appendChild(button);
    if (index === 0) button.click();
  });
}

timeOptions?.querySelectorAll(".time-option").forEach((button, index) => {
  button.addEventListener("click", () => {
    timeOptions.querySelectorAll(".time-option").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    meetingTimeInput.value = button.dataset.value;
    meetingTimeInput.setCustomValidity("");
  });
  if (index === 0) button.click();
});

document.querySelectorAll("[data-mail-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const trap = form.querySelector("[name='_gotcha']");
    if (trap?.value) return;

    const status = form.querySelector("[data-form-status]");
    const missing = (meetingDateInput && !meetingDateInput.value && "una fecha")
      || (meetingTimeInput && !meetingTimeInput.value && "una hora");
    if (missing) {
      if (status) status.textContent = `Selecciona ${missing} para continuar.`;
      (meetingDateInput?.value ? timeOptions : calendarDays)?.scrollIntoView({ block: "center" });
      return;
    }

    const data = new FormData(form);
    data.set("tipo", form.dataset.formType || "Consulta web");
    const submitButton = form.querySelector("button[type='submit']");
    if (status) status.textContent = "Enviando solicitud…";
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      });
      if (!response.ok) throw new Error("Automatic delivery unavailable");
      if (status) status.textContent = "Solicitud recibida. Te contactaremos para confirmar los siguientes pasos. ✓";
      form.reset();
      return;
    } catch {
      if (status) status.textContent = "No se pudo enviar la solicitud. Revisa la conexión e inténtalo de nuevo.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

/* Consentimiento de cookies y analitica.
   El art. 22.2 de la LSSI-CE exige consentimiento previo para las cookies de
   analitica. Por eso gtag.js NO se carga hasta que la persona acepta: sin
   aceptacion no se descarga el script ni se instala ninguna cookie. */
const ANALYTICS_ID = "G-HBV9Z3WRQR";
const CONSENT_KEY = "icrm-consent";

const readConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } };
const saveConsent = (value) => { try { localStorage.setItem(CONSENT_KEY, value); } catch { /* modo privado */ } };

const loadAnalytics = () => {
  if (window.__icrmAnalytics) return;
  window.__icrmAnalytics = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  // Consent Mode v2: solo analitica. Nada de publicidad ni perfilado.
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted"
  });
  gtag("js", new Date());
  gtag("config", ANALYTICS_ID);
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.appendChild(tag);
};

const clearAnalyticsCookies = () => {
  const host = location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host}`];
  document.cookie.split(";").forEach((entry) => {
    const name = entry.split("=")[0].trim();
    if (!/^_ga/.test(name)) return;
    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    });
  });
};

const buildBanner = () => {
  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Consentimiento de cookies");
  banner.innerHTML = '<p>Usamos cookies de Google Analytics para saber qué páginas se visitan. '
    + 'Solo se instalan si las aceptas y puedes cambiar de opinión cuando quieras. '
    + '<a href="/cookies/">Más información</a>.</p>'
    + '<div class="cookie-actions">'
    + '<button type="button" class="button button-ghost" data-consent="rejected">Rechazar</button>'
    + '<button type="button" class="button button-light" data-consent="granted">Aceptar</button>'
    + '</div>';
  banner.querySelectorAll("[data-consent]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.consent;
      saveConsent(choice);
      banner.remove();
      if (choice === "granted") loadAnalytics();
      else clearAnalyticsCookies();
    });
  });
  document.body.appendChild(banner);
};

const consent = readConsent();
if (consent === "granted") loadAnalytics();
else if (consent !== "rejected") buildBanner();

// Permite revocar o volver a dar el consentimiento desde /cookies/.
document.querySelectorAll("[data-consent-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    try { localStorage.removeItem(CONSENT_KEY); } catch { /* modo privado */ }
    clearAnalyticsCookies();
    document.querySelector(".cookie-banner")?.remove();
    buildBanner();
  });
});

document.querySelectorAll("[data-consent-state]").forEach((element) => {
  const current = readConsent();
  element.textContent = current === "granted" ? "aceptadas"
    : current === "rejected" ? "rechazadas"
    : "sin decidir";
});

/* El fondo de la página cambia según la sección que se está mirando.
   El color no está en cada sección sino en <html>, con transición, para que
   al bajar se perciba como un cambio gradual y no como un corte. */
const tonos = { claro: "#f5f7f4", tinte: "#edf1ed", oscuro: "#07111f" };
const seccionesConTono = document.querySelectorAll("[data-tono]");
if (seccionesConTono.length && "IntersectionObserver" in window) {
  const raiz = document.documentElement;
  const visibles = new Map();
  const pintar = () => {
    // Gana la sección que más superficie ocupa en pantalla.
    let mejor = null, area = 0;
    visibles.forEach((valor, el) => { if (valor > area) { area = valor; mejor = el; } });
    raiz.style.setProperty("--fondo", tonos[mejor?.dataset.tono] || tonos.claro);
  };
  const vigia = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) visibles.set(e.target, e.intersectionRatio);
      else visibles.delete(e.target);
    });
    pintar();
  }, { threshold: [0, .15, .35, .55, .75, 1] });
  seccionesConTono.forEach((s) => vigia.observe(s));
}

/* Aparición al entrar en pantalla.
   La clase se añade desde aquí y no en el HTML: si este script no llega a
   ejecutarse, el contenido se ve con normalidad en lugar de quedar invisible.
   Se anima una sola vez y con desfase dentro de cada grupo. */
const gruposQueAparecen = [
  ".services-grid > .service-tile",
  ".panel-grid > .panel",
  ".modulos-grid > .pieza",
  ".piezas > .pieza",
  ".modulo-grid > .modulo",
  ".garantias > .garantia",
  ".stat-band > div",
  ".pilares > li",
  ".number-list > li",
  ".check-list > li",
  ".caso-pasos > li",
  ".faq-list > details",
  ".section-heading",
  ".caso-cifra",
  ".flow-figure"
];

const candidatos = [...new Set(gruposQueAparecen.flatMap((s) => [...document.querySelectorAll(s)]))];

if (candidatos.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // El desfase se calcula por posición dentro del grupo, no global.
  const posicion = new Map();
  candidatos.forEach((el) => {
    const hermanos = [...(el.parentElement?.children || [])].filter((h) => candidatos.includes(h));
    posicion.set(el, Math.min(hermanos.indexOf(el), 6));
    el.classList.add("aparece", "aparece-on");
  });

  const vigia = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = `${posicion.get(e.target) * 60}ms`;
      e.target.classList.add("visible");
      vigia.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });

  candidatos.forEach((el) => vigia.observe(el));
}

/* Menú desplegable.
   Se abre al pasar el ratón en escritorio y al pulsar en cualquier sitio, que
   es lo que hace que funcione también con teclado y en táctil. */
const conSubmenu = [...document.querySelectorAll(".tiene-sub")];
if (conSubmenu.length) {
  const escritorio = () => window.matchMedia("(min-width: 1181px)").matches;

  const cerrar = (item) => {
    item.classList.remove("abierto");
    const boton = item.querySelector(".sub-toggle");
    boton.setAttribute("aria-expanded", "false");
    item.querySelector(".submenu").hidden = true;
  };
  const cerrarTodos = (salvo) => conSubmenu.forEach((i) => { if (i !== salvo) cerrar(i); });

  const abrir = (item) => {
    cerrarTodos(item);
    item.classList.add("abierto");
    item.querySelector(".sub-toggle").setAttribute("aria-expanded", "true");
    item.querySelector(".submenu").hidden = false;
  };

  conSubmenu.forEach((item) => {
    const boton = item.querySelector(".sub-toggle");
    const panel = item.querySelector(".submenu");

    boton.addEventListener("click", (e) => {
      e.preventDefault();
      item.classList.contains("abierto") ? cerrar(item) : abrir(item);
    });

    // En escritorio basta con acercar el ratón; un pequeño retardo al salir
    // evita que se cierre al cruzar el hueco entre el botón y el panel.
    let temporizador;
    item.addEventListener("mouseenter", () => {
      if (!escritorio()) return;
      clearTimeout(temporizador);
      abrir(item);
    });
    item.addEventListener("mouseleave", () => {
      if (!escritorio()) return;
      temporizador = setTimeout(() => cerrar(item), 180);
    });

    // El foco saliendo del grupo lo cierra: es lo que espera quien navega con tabulador
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) cerrar(item);
    });
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { cerrar(item); boton.focus(); }
    });
    boton.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { cerrar(item); boton.focus(); }
      if (e.key === "ArrowDown") { e.preventDefault(); abrir(item); panel.querySelector("a")?.focus(); }
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".tiene-sub")) cerrarTodos(null);
  });
}

/* Barra de progreso de lectura.
   Se anima con transform, que no obliga al navegador a recalcular la página
   en cada píxel de scroll. */
const barra = document.createElement("div");
barra.className = "progreso";
document.body.appendChild(barra);
let pendiente = false;
const pintarProgreso = () => {
  const alto = document.documentElement.scrollHeight - window.innerHeight;
  barra.style.transform = `scaleX(${alto > 0 ? Math.min(window.scrollY / alto, 1) : 0})`;
  pendiente = false;
};
window.addEventListener("scroll", () => {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(pintarProgreso);
}, { passive: true });
pintarProgreso();

/* Generador de flujo: el visitante marca lo que usa y se dibuja su caso.
   El enlace final lleva la selección al formulario, de modo que la solicitud
   llega ya sabiendo qué herramientas tiene delante. */
const monta = document.querySelector("[data-monta]");
if (monta) {
  const mapa = monta.querySelector("[data-mapa]");
  const cuenta = monta.querySelector("[data-cuenta]");
  const enviar = monta.querySelector("[data-enviar]");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  const marcados = (grupo) => [...monta.querySelectorAll(`input[data-grupo="${grupo}"]:checked`)]
    .map((i) => ({ txt: i.value, ico: i.dataset.ico }));

  const nodo = ({ txt, ico }, clase = "") =>
    `<div class="nodo ${clase}"><span class="nodo-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/iconos.svg#i-${ico}"/></svg></span><b>${txt}</b></div>`;

  const columna = (lado, etiqueta, piezas) => `<div class="col" data-lado="${lado}"><p class="col-tit">${etiqueta}</p>`
    + (piezas.length ? piezas.map((p) => nodo(p)).join("") : '<p class="nodo-vacio">Marca una opción.</p>')
    + "</div>";

  /* Los cables se calculan midiendo los nodos ya pintados: su posición depende
     del alto de cada columna y del ancho de pantalla, no se puede fijar en CSS. */
  const cablear = () => {
    const lienzo = mapa.querySelector(".lienzo");
    const svg = lienzo && lienzo.querySelector(".cables");
    const nucleo = lienzo && lienzo.querySelector(".nodo-nucleo");
    if (!svg || !nucleo) return;

    const base = lienzo.getBoundingClientRect();
    if (!base.width) return;

    const centro = nucleo.getBoundingClientRect();
    const colEnt = lienzo.querySelector('[data-lado="entrada"]');
    const colSal = lienzo.querySelector('[data-lado="salida"]');
    const cEnt = colEnt.getBoundingClientRect();

    // En móvil las columnas se apilan y los cables salen por abajo. Ahí se traza
    // una sola línea troncal por bloque: una curva por nodo cruzaría los de al lado.
    const horizontal = Math.abs((cEnt.left + cEnt.width / 2) - (centro.left + centro.width / 2)) > 40;

    const fuentes = horizontal ? [...colEnt.querySelectorAll(".nodo")] : (colEnt.querySelector(".nodo") ? [colEnt] : []);
    const destinos = horizontal ? [...colSal.querySelectorAll(".nodo")] : (colSal.querySelector(".nodo") ? [colSal] : []);

    const ancla = (el, sale) => {
      const r = el.getBoundingClientRect();
      if (horizontal) {
        return { x: (sale ? r.right : r.left) - base.left, y: r.top + r.height / 2 - base.top };
      }
      const nodos = el.classList.contains("nodo") ? [el] : [...el.querySelectorAll(".nodo")];
      const borde = (sale ? nodos[nodos.length - 1] : nodos[0]).getBoundingClientRect();
      return { x: r.left + r.width / 2 - base.left, y: (sale ? borde.bottom : borde.top) - base.top };
    };

    const curva = (a, b) => {
      if (horizontal) {
        const d = Math.max(Math.abs(b.x - a.x) * 0.5, 26);
        return `M${a.x} ${a.y}C${a.x + d} ${a.y} ${b.x - d} ${b.y} ${b.x} ${b.y}`;
      }
      const d = Math.max(Math.abs(b.y - a.y) * 0.5, 20);
      return `M${a.x} ${a.y}C${a.x} ${a.y + d} ${b.x} ${b.y - d} ${b.x} ${b.y}`;
    };

    let cables = "";
    let puertos = "";
    let pulsos = "";
    let n = 0;

    const unir = (desde, hasta) => {
      const a = ancla(desde, true);
      const b = ancla(hasta, false);
      const d = curva(a, b);
      cables += `<path class="cable" d="${d}"/>`;
      puertos += `<circle class="puerto" cx="${a.x}" cy="${a.y}" r="3.5"/><circle class="puerto" cx="${b.x}" cy="${b.y}" r="3.5"/>`;
      if (!quieto.matches) {
        pulsos += `<path class="pulso" d="${d}" pathLength="100" style="animation-delay:${(n * -0.3).toFixed(2)}s"/>`;
      }
      n += 1;
    };

    fuentes.forEach((f) => unir(f, nucleo));
    destinos.forEach((t) => unir(nucleo, t));

    svg.setAttribute("viewBox", `0 0 ${Math.round(base.width)} ${Math.round(base.height)}`);
    svg.innerHTML = cables + pulsos + puertos;
  };

  const pintar = () => {
    const entrada = marcados("entrada");
    const crm = marcados("crm");
    const salida = marcados("salida");
    const nucleo = crm.length ? crm[0] : { txt: "Tu CRM", ico: "crm" };

    mapa.innerHTML = '<div class="lienzo"><svg class="cables" aria-hidden="true"></svg>'
      + columna("entrada", "Entra por", entrada)
      + `<div class="col col-centro" data-lado="nucleo"><p class="col-tit">Se ordena en</p>${nodo(nucleo, "nodo-nucleo")}</div>`
      + columna("salida", "Y dispara", salida)
      + "</div>";

    // Cada canal de entrada y cada destino es una conexión con el CRM
    const conexiones = entrada.length + salida.length;
    const automaticas = Math.max(conexiones - 1, 0);
    cuenta.innerHTML = conexiones
      ? `<b>${conexiones}</b> conexiones · <b>${automaticas}</b> sin que nadie las toque`
      : "Marca alguna opción para ver tu flujo.";

    const resumen = [
      entrada.length ? `Nos entran contactos por: ${entrada.map((e) => e.txt).join(", ")}.` : "",
      crm.length ? `CRM: ${crm[0].txt}.` : "",
      salida.length ? `Queremos que después ocurra: ${salida.map((e) => e.txt).join(", ")}.` : ""
    ].filter(Boolean).join(" ");

    mapa.setAttribute("aria-label", resumen || "Marca alguna opción para ver tu flujo.");
    enviar.href = "/auditoria-crm-gratis/?flujo=" + encodeURIComponent(resumen);

    requestAnimationFrame(cablear);
  };

  monta.addEventListener("change", pintar);
  pintar();

  if ("ResizeObserver" in window) {
    new ResizeObserver(cablear).observe(mapa);
  } else {
    let espera;
    window.addEventListener("resize", () => {
      clearTimeout(espera);
      espera = setTimeout(cablear, 120);
    });
  }
}

/* Si se llega al formulario desde el generador, se rellena el objetivo con lo
   que la persona ya seleccionó en la portada. */
const objetivo = document.querySelector("[data-mail-form] [name='objetivo']");
if (objetivo && !objetivo.value) {
  const flujo = new URLSearchParams(location.search).get("flujo");
  if (flujo) {
    objetivo.value = flujo;
    objetivo.closest(".field")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
