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

// Copiar el enlace de un artículo
document.querySelectorAll("[data-compartir-copiar]").forEach((boton) => {
  boton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(boton.dataset.compartirCopiar);
      boton.textContent = "Enlace copiado ✓";
    } catch {
      boton.textContent = boton.dataset.compartirCopiar;
    }
    window.setTimeout(() => { boton.textContent = "Copiar enlace"; }, 2200);
  });
});

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
      medir("generate_lead", { tipo_formulario: form.dataset.formType || "Consulta web", pagina: location.pathname });
      // Formularios de descarga: al enviarse, se muestra el enlace al archivo
      const descarga = form.dataset.descarga && document.querySelector(form.dataset.descarga);
      if (descarga) {
        form.hidden = true;
        descarga.hidden = false;
        descarga.querySelector("a")?.focus();
        return;
      }
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
// Microsoft Clarity (mapas de calor y grabación de la navegación).
// Vacío = desactivado: no se carga nada. Se carga solo tras aceptar las cookies.
const CLARITY_ID = "yjy1ay15fi";
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
  loadClarity();
};

const loadClarity = () => {
  if (!CLARITY_ID || window.clarity) return;
  window.clarity = function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); };
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(tag);
  // Solo se carga tras aceptar: se le comunica el consentimiento expresamente
  window.clarity("consent");
};

/* Conversiones. Solo se envía algo si la persona aceptó la analítica:
   sin consentimiento gtag no existe y la llamada no hace nada. */
const medir = (evento, datos = {}) => {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", evento, datos);
};

const clearAnalyticsCookies = () => {
  const host = location.hostname;
  const domains = ["", `; domain=${host}`, `; domain=.${host}`];
  document.cookie.split(";").forEach((entry) => {
    const name = entry.split("=")[0].trim();
    if (!/^(_ga|_clck|_clsk)/.test(name)) return;
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
  const herramientas = CLARITY_ID ? "Google Analytics y Microsoft Clarity" : "Google Analytics";
  banner.innerHTML = `<p>Usamos cookies de ${herramientas} para saber qué páginas se visitan y cómo se usan. `
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

/* El fondo de las secciones oscuras se forma al bajar. Llega al negro completo
   cuando su borde superior alcanza el 78 % de la pantalla, es decir antes de que
   se vea su primera linea de texto: asi nunca hay texto blanco sobre fondo claro. */
const seccionesOscuras = [...document.querySelectorAll('[data-tono="oscuro"]')];
if (seccionesOscuras.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const pintarOscuras = () => {
    const alto = window.innerHeight;
    seccionesOscuras.forEach((s) => {
      const caja = s.getBoundingClientRect();
      if (caja.bottom < -200 || caja.top > alto + 200) return;
      const avance = Math.min(1, Math.max(0, (alto - caja.top) / (alto * 0.22)));
      s.style.setProperty("--fondo-oscuro", avance.toFixed(3));
    });
  };
  let pendienteOscuras = false;
  const alScrollOscuras = () => {
    if (pendienteOscuras) return;
    pendienteOscuras = true;
    requestAnimationFrame(() => { pendienteOscuras = false; pintarOscuras(); });
  };
  window.addEventListener("scroll", alScrollOscuras, { passive: true });
  window.addEventListener("resize", alScrollOscuras);
  pintarOscuras();
}

/* Movimiento ligado al scroll.
   El avance de cada bloque depende de dónde está en la pantalla, así que al
   bajar entran y al subir vuelven. Lo calcula JavaScript en todos los
   navegadores (no todos soportan animation-timeline) y lo escribe en la
   variable --avance; el aspecto lo pone el CSS. */
const CON_SCROLL = ".section-heading, .services-grid > .service-tile, .panel-grid > .panel,"
  + " .modulos-grid > .pieza, .piezas > .pieza, .garantias > .garantia, .stat-band > div,"
  + " .related-grid > .related-card, .steps li, .faq-list > details, .logo-cloud > *,"
  + " .form-intro, .lead-form, .monta, .caso-grid > .caso, .tarjetas > .tarjeta,"
  + " .prose-section, .aside-card, .cta-card, .mini-proof";
const candidatosScroll = [...document.querySelectorAll(CON_SCROLL)];
// Si un bloque ya se mueve, sus hijos no se mueven aparte: las opacidades se
// multiplicarian y el resultado seria un parpadeo raro.
const bloquesScroll = candidatosScroll.filter((el) => !candidatosScroll.some((otro) => otro !== el && otro.contains(el)));
const quietoMov = window.matchMedia("(prefers-reduced-motion: reduce)");

if (bloquesScroll.length && "IntersectionObserver" in window && !quietoMov.matches) {
  const desfase = new Map();
  bloquesScroll.forEach((el) => {
    const hermanos = [...(el.parentElement?.children || [])].filter((h) => bloquesScroll.includes(h));
    desfase.set(el, Math.min(Math.max(hermanos.indexOf(el), 0), 4) * 0.12);
    el.classList.add("con-scroll");
  });

  const enPantalla = new Set();
  let pendienteMov = false;
  const pintarMov = () => {
    pendienteMov = false;
    const alto = window.innerHeight;
    enPantalla.forEach((el) => {
      const caja = el.getBoundingClientRect();
      // 0 cuando el bloque asoma por abajo, 1 cuando ha subido media pantalla
      const bruto = (alto - caja.top) / (alto * 0.55);
      const avance = Math.min(1, Math.max(0, bruto - desfase.get(el)));
      el.style.setProperty("--avance", avance.toFixed(3));
    });
  };
  const alMoverScroll = () => {
    if (pendienteMov) return;
    pendienteMov = true;
    requestAnimationFrame(pintarMov);
  };
  const vigiaMov = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => (e.isIntersecting ? enPantalla.add(e.target) : enPantalla.delete(e.target)));
    pintarMov();
  }, { rootMargin: "200px 0px" });
  bloquesScroll.forEach((el) => vigiaMov.observe(el));
  window.addEventListener("scroll", alMoverScroll, { passive: true });
  window.addEventListener("resize", alMoverScroll);
  pintarMov();
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
  ".flow-figure",
  ".monta-elige fieldset",
  ".monta-sector .ficha",
  ".monta-elige fieldset:not(.monta-sector) .ficha"
];

const candidatos = [...new Set(gruposQueAparecen.flatMap((s) => [...document.querySelectorAll(s)]))]
  .filter((el) => !el.classList.contains("con-scroll"));

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
  const escritorio = () => window.matchMedia("(min-width: 1200px)").matches;

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
  const aviso = monta.querySelector("[data-aviso]");
  const recorrido = monta.querySelector("[data-recorrido]");
  const propuestas = monta.querySelector("[data-propuestas]");
  const tituloHistoria = monta.querySelector("[data-historia-titulo]");
  const probar = monta.querySelector("[data-probar]");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Un caso de ejemplo por sector: quién llega, qué busca, quién lo atiende,
     qué se marca por defecto y cómo se cuenta cada paso en su vocabulario. */
  const SECTORES = {
    formacion: {
      nombre: "formación", persona: "Laura", busca: "un curso", rol: "un asesor académico", dato: "el curso que le interesa",
      entrada: ["Formularios web", "WhatsApp", "Redes y anuncios"], salida: ["Firma online", "Cobros y pagos", "Campus o área privada", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva una llamada con su asesor en la agenda, sin correos de ida y vuelta.",
        "Firma online": "Firma la matrícula desde el móvil y pasa de lead a alumna.",
        "Cobros y pagos": "Paga la matrícula o el primer plazo, y el CRM lo sabe al momento.",
        "Facturación": "La factura se emite sola con sus datos y los del curso.",
        "Campus o área privada": "Recibe su acceso al campus virtual ya matriculada en su curso.",
        "Informes": "Cuenta en el informe de matrículas por curso y por campaña."
      },
      propuestas: ["Aviso al asesor si un lead lleva 48 horas sin contacto.", "Recordatorio automático de la documentación que falta para matricularse.", "Seguimiento de alumnos que no entran al campus la primera semana."]
    },
    inmobiliario: {
      nombre: "inmobiliario", persona: "Javier", busca: "un piso en venta", rol: "el agente de la zona", dato: "la vivienda y su presupuesto",
      entrada: ["Formularios web", "Llamadas", "WhatsApp"], salida: ["Agenda y citas", "Firma online", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva la visita al piso y le llega un recordatorio el día antes.",
        "Firma online": "Firma la reserva o las arras online sin pasar por la oficina.",
        "Cobros y pagos": "Paga la señal y queda registrada en la operación.",
        "Facturación": "Se factura la comisión en cuanto la operación se marca como cerrada.",
        "Campus o área privada": "Sigue el estado de su operación desde un área privada.",
        "Informes": "Cuenta en el informe de qué portal trae visitas que acaban en venta."
      },
      propuestas: ["Cruce automático de lo que busca cada comprador con las viviendas que entran.", "Mensaje de seguimiento automático después de cada visita.", "Aviso al propietario con las visitas y el interés de su vivienda."]
    },
    salud: {
      nombre: "salud y estética", persona: "Marta", busca: "un tratamiento", rol: "recepción", dato: "el tratamiento que le interesa",
      entrada: ["WhatsApp", "Llamadas", "Redes y anuncios"], salida: ["Agenda y citas", "Cobros y pagos", "Informes"],
      pasos: {
        "Agenda y citas": "Elige hueco para la primera cita y recibe el recordatorio por WhatsApp.",
        "Firma online": "Firma el consentimiento antes de llegar, no en la sala de espera.",
        "Cobros y pagos": "Paga el tratamiento o el bono online.",
        "Facturación": "La factura se emite sola al cerrar la cita.",
        "Campus o área privada": "Consulta sus citas y sus documentos en un área privada.",
        "Informes": "Cuenta en el informe de qué canal llena la agenda y qué tratamientos se repiten."
      },
      propuestas: ["Recordatorio de cita por WhatsApp para que no se quede el hueco vacío.", "Aviso cuando toca la siguiente sesión o la revisión.", "Encuesta automática después del tratamiento."]
    },
    b2b: {
      nombre: "servicios B2B", persona: "Carlos", busca: "un presupuesto para su empresa", rol: "un comercial", dato: "su empresa y lo que necesita",
      entrada: ["Formularios web", "Correo", "Llamadas"], salida: ["Agenda y citas", "Firma online", "Facturación", "Informes"],
      pasos: {
        "Agenda y citas": "Agenda la reunión de diagnóstico directamente en el calendario del comercial.",
        "Firma online": "Firma la propuesta online y la oportunidad pasa a ganada.",
        "Cobros y pagos": "Paga el anticipo y el proyecto arranca.",
        "Facturación": "La factura sale del CRM con los datos de la propuesta, sin copiarlos.",
        "Campus o área privada": "Sigue el avance del proyecto desde un portal de cliente.",
        "Informes": "Cuenta en el informe de cuánto tarda cada oportunidad en cerrarse."
      },
      propuestas: ["Puntuación de leads para saber a quién llamar primero.", "Propuesta generada desde la oportunidad con un clic.", "Aviso si una oportunidad lleva días parada."]
    },
    hosteleria: {
      nombre: "hostelería y eventos", persona: "Ana", busca: "un evento para 40 personas", rol: "el responsable de eventos", dato: "la fecha y el número de personas",
      entrada: ["Formularios web", "WhatsApp", "Correo"], salida: ["Agenda y citas", "Cobros y pagos", "Facturación"],
      pasos: {
        "Agenda y citas": "Su fecha queda bloqueada en la agenda para que no se duplique.",
        "Firma online": "Firma las condiciones del evento y el menú elegido.",
        "Cobros y pagos": "Paga la señal y la reserva queda confirmada.",
        "Facturación": "La factura sale sola después del evento.",
        "Campus o área privada": "Revisa menú, horarios y cambios desde un enlace privado.",
        "Informes": "Cuenta en el informe de qué eventos se confirman y cuáles se caen."
      },
      propuestas: ["Presupuesto de evento con plantilla generado desde el CRM.", "Recordatorio automático si la señal no se paga a tiempo.", "Petición de reseña automática al día siguiente del evento."]
    },
    deporte: {
      nombre: "deporte y ocio", persona: "Pablo", busca: "una plaza en el campus de verano para su hija", rol: "coordinación", dato: "el turno y la edad",
      entrada: ["Redes y anuncios", "Formularios web", "WhatsApp"], salida: ["Firma online", "Cobros y pagos", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva plaza en el turno que prefiere.",
        "Firma online": "Firma la inscripción y las autorizaciones desde el móvil.",
        "Cobros y pagos": "Paga la inscripción o la cuota mensual por domiciliación.",
        "Facturación": "La factura llega sola cada mes.",
        "Campus o área privada": "Ve horarios, avisos y fotos en el área de familias.",
        "Informes": "Cuenta en el informe de plazas ocupadas por turno."
      },
      propuestas: ["Lista de espera que avisa sola cuando se libera una plaza.", "Cobro recurrente de cuotas con aviso si un pago falla.", "Comunicaciones a las familias por grupo o turno."]
    },
    asesoria: {
      nombre: "asesorías y gestorías", persona: "Elena", busca: "cambiar de asesoría", rol: "un socio del despacho", dato: "los servicios que necesita",
      entrada: ["Formularios web", "Llamadas", "Correo"], salida: ["Firma online", "Facturación", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva una reunión para que le expliquéis el cambio, sin correos de ida y vuelta.",
        "Firma online": "Firma la hoja de encargo y el mandato de representación desde el móvil.",
        "Cobros y pagos": "Domicilia la cuota mensual y el primer cobro queda registrado.",
        "Facturación": "La cuota se factura sola cada mes, con sus servicios contratados.",
        "Campus o área privada": "Sube su documentación a un área privada en vez de mandarla por WhatsApp.",
        "Informes": "Cuenta en el informe de altas, bajas y cuota media por cliente."
      },
      propuestas: ["Aviso de renovación y de subida de tarifas antes de que toque.", "Campaña automática a los clientes a los que afecta un cambio normativo.", "Alerta cuando un cliente lleva meses sin contacto: suele ser el que se va."]
    },
    seguros: {
      nombre: "correduría de seguros", persona: "Miguel", busca: "un seguro para su negocio", rol: "un mediador", dato: "el riesgo que quiere cubrir",
      entrada: ["Llamadas", "Formularios web", "WhatsApp"], salida: ["Firma online", "Cobros y pagos", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva una llamada para revisar coberturas y precios.",
        "Firma online": "Firma la documentación de la póliza sin desplazarse.",
        "Cobros y pagos": "Paga el primer recibo y queda asociado a su póliza.",
        "Facturación": "La comisión queda registrada al activarse la póliza.",
        "Campus o área privada": "Consulta sus pólizas y partes en un área privada.",
        "Informes": "Cuenta en el informe de renovaciones del trimestre y primas por ramo."
      },
      propuestas: ["Aviso de vencimiento con la antelación que decidáis, asignado a quien corresponda.", "Detección de clientes con una sola póliza para ofrecer la segunda.", "Seguimiento de siniestros abiertos para que ninguno se quede sin respuesta."]
    },
    otro: {
      nombre: "tu sector", persona: "Tu próximo cliente", busca: "información", rol: "la persona adecuada del equipo", dato: "lo que necesita",
      entrada: ["Formularios web", "WhatsApp"], salida: ["Agenda y citas", "Informes"],
      pasos: {
        "Agenda y citas": "Reserva una reunión y recibe el recordatorio.",
        "Firma online": "Firma el contrato online.",
        "Cobros y pagos": "Paga online y el pago queda en su ficha.",
        "Facturación": "La factura se emite sola con sus datos.",
        "Campus o área privada": "Accede a un área privada con su información.",
        "Informes": "Cuenta en el informe de qué canal trae los clientes que acaban comprando."
      },
      propuestas: ["Respuesta automática en minutos a cada contacto nuevo.", "Aviso si un lead se queda sin seguimiento.", "Informe de qué canal trae clientes y cuál solo trae curiosos."]
    }
  };

  const LLEGA = {
    "Formularios web": "rellena el formulario de la web pidiendo información sobre",
    "WhatsApp": "escribe por WhatsApp preguntando por",
    "Llamadas": "llama preguntando por",
    "Correo": "manda un correo pidiendo información sobre",
    "Redes y anuncios": "deja sus datos en un anuncio de redes sociales sobre"
  };

  // Cómo se nombra cada canal dentro de una frase
  const CANAL = {
    "Formularios web": "el formulario web",
    "WhatsApp": "WhatsApp",
    "Llamadas": "teléfono",
    "Correo": "correo",
    "Redes y anuncios": "un anuncio en redes"
  };

  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lista = (xs) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;

  const marcados = (grupo) => [...monta.querySelectorAll(`input[data-grupo="${grupo}"]:checked`)]
    .map((i) => ({ txt: i.value, ico: i.dataset.ico }));
  const sectorActual = () => monta.querySelector("input[data-sector]:checked")?.dataset.sector || "otro";

  const nodo = ({ txt, ico }, paso, clase = "") =>
    `<div class="nodo ${clase}" data-nodo-paso="${paso}"><i class="nodo-paso" aria-hidden="true">${paso}</i><span class="nodo-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/iconos.svg#i-${ico}"/></svg></span><b>${escapar(txt)}</b></div>`;

  const columna = (lado, etiqueta, piezas, paso) => `<div class="col" data-lado="${lado}"><p class="col-tit">${etiqueta}</p>`
    + (piezas.length ? piezas.map((p, i) => nodo(p, typeof paso === "function" ? paso(i) : paso)).join("") : '<p class="nodo-vacio">Marca una opción.</p>')
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

  let ejecucion = 0;

  const limpiarEjecucion = () => {
    ejecucion += 1;
    monta.querySelectorAll(".activo, .hecho").forEach((el) => el.classList.remove("activo", "hecho"));
    probar.disabled = false;
  };

  const pintar = () => {
    limpiarEjecucion();
    const sector = SECTORES[sectorActual()];
    const entrada = marcados("entrada");
    const crm = marcados("crm");
    const salida = marcados("salida");
    const nucleo = crm.length ? crm[0] : { txt: "Tu CRM", ico: "crm" };
    const primerPasoSalida = entrada.length ? 3 : 2;

    mapa.innerHTML = '<div class="lienzo"><svg class="cables" aria-hidden="true"></svg>'
      + columna("entrada", "Entra por", entrada, 1)
      + `<div class="col col-centro" data-lado="nucleo"><p class="col-tit">Se ordena en</p>${nodo(nucleo, entrada.length ? 2 : 1, "nodo-nucleo")}</div>`
      + columna("salida", "Y dispara", salida, (i) => primerPasoSalida + i)
      + "</div>";

    // El recorrido: un lead de ejemplo contado paso a paso con el vocabulario del sector
    const quien = sector.persona;
    const pasos = [];
    if (entrada.length) {
      const otros = entrada.slice(1).map((e) => CANAL[e.txt]);
      pasos.push({
        titulo: `Llega por ${CANAL[entrada[0].txt]}`,
        texto: `${quien} ${LLEGA[entrada[0].txt]} ${sector.busca}.`
          + (otros.length ? ` Si llegara por ${lista(otros)}, haría exactamente el mismo camino.` : "")
      });
    }
    const respuesta = entrada.some((e) => e.txt === "WhatsApp") ? "un WhatsApp" : "un correo";
    pasos.push({
      titulo: crm.length && nucleo.txt !== "Aún no tengo" ? `Se ordena en ${nucleo.txt}` : "Se ordena en el CRM",
      texto: (crm.length && nucleo.txt !== "Aún no tengo" ? `Se crea su ficha en ${nucleo.txt}` : "Se crea su ficha en el CRM que elijamos contigo")
        + ` con ${sector.dato}, apuntando por dónde llegó, sin copiar nada a mano y sin duplicados. Se asigna ${sector.rol.startsWith("el ") ? "al " + sector.rol.slice(3) : "a " + sector.rol}`
        + ` y ${quien === "Tu próximo cliente" ? "el cliente" : quien} recibe ${respuesta} en unos minutos.`
    });
    salida.forEach((s) => pasos.push({ titulo: s.txt, texto: sector.pasos[s.txt] }));

    tituloHistoria.textContent = sector.persona === "Tu próximo cliente" ? "Qué le pasa al lead" : `Qué le pasa a ${quien}`;
    recorrido.innerHTML = pasos.map((p, i) =>
      `<li data-paso="${i + 1}"><b>${escapar(p.titulo)}</b><p>${escapar(p.texto)}</p></li>`).join("");
    propuestas.innerHTML = sector.propuestas.map((p) => `<li>${escapar(p)}</li>`).join("");

    // Cada canal de entrada y cada destino es una conexión con el CRM
    const conexiones = entrada.length + salida.length;
    cuenta.innerHTML = conexiones ? `<b>${conexiones}</b> conexiones · <b>${pasos.length}</b> pasos` : "";
    probar.hidden = !pasos.length;

    const resumen = [
      `Sector: ${monta.querySelector("input[data-sector]:checked")?.value || "Otro"}.`,
      entrada.length ? `Nos entran contactos por: ${entrada.map((e) => e.txt).join(", ")}.` : "",
      crm.length ? `CRM: ${crm[0].txt}.` : "",
      salida.length ? `Queremos que después ocurra: ${salida.map((e) => e.txt).join(", ")}.` : ""
    ].filter(Boolean).join(" ");

    mapa.setAttribute("aria-label", resumen);
    enviar.href = "/auditoria-crm-gratis/?flujo=" + encodeURIComponent(resumen);

    requestAnimationFrame(cablear);
  };

  // Al elegir sector se marca lo habitual en él; después cada uno lo cambia a su gusto
  const aplicarSector = () => {
    const sector = SECTORES[sectorActual()];
    monta.querySelectorAll('input[data-grupo="entrada"]').forEach((i) => { i.checked = sector.entrada.includes(i.value); });
    monta.querySelectorAll('input[data-grupo="salida"]').forEach((i) => { i.checked = sector.salida.includes(i.value); });
    aviso.textContent = sectorActual() === "otro"
      ? "Hemos marcado lo más común. Cámbialo como quieras."
      : `Hemos marcado lo habitual en ${sector.nombre}. Cámbialo como quieras.`;
  };

  /* «Probar el flujo»: enciende los pasos en orden, como al ejecutar un flujo en n8n */
  const ejecutar = async () => {
    limpiarEjecucion();
    const turno = ejecucion;
    const pasos = [...recorrido.children];
    probar.disabled = true;
    const espera = (ms) => new Promise((r) => setTimeout(r, quieto.matches ? 0 : ms));
    for (const li of pasos) {
      if (turno !== ejecucion) return;
      const n = li.dataset.paso;
      const nodos = mapa.querySelectorAll(`[data-nodo-paso="${n}"]`);
      li.classList.add("activo");
      nodos.forEach((el) => el.classList.add("activo"));
      await espera(1100);
      if (turno !== ejecucion) return;
      li.classList.replace("activo", "hecho");
      nodos.forEach((el) => el.classList.replace("activo", "hecho"));
    }
    probar.disabled = false;
  };

  // Pasar por un paso del recorrido resalta su nodo en el diagrama
  const resaltar = (e) => {
    const li = e.target.closest?.("li[data-paso]");
    mapa.querySelectorAll(".foco").forEach((el) => el.classList.remove("foco"));
    if (li && e.type !== "mouseleave") {
      mapa.querySelectorAll(`[data-nodo-paso="${li.dataset.paso}"]`).forEach((el) => el.classList.add("foco"));
    }
  };
  recorrido.addEventListener("mouseover", resaltar);
  recorrido.addEventListener("mouseleave", resaltar);

  monta.addEventListener("change", (e) => {
    if (e.target.matches("input[data-sector]")) aplicarSector();
    pintar();
  });
  probar.addEventListener("click", ejecutar);
  // Al entrar no se marca nada: el bloque ocupa poco y cada uno elige. Los
  // valores habituales se marcan solo cuando alguien elige su sector.
  aviso.textContent = "";
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

/* Botón de WhatsApp. Se inserta desde aquí para que esté en todas las páginas,
   también en las del blog, sin repetir el marcado en cada HTML. */
if (!document.querySelector(".whatsapp")) {
  const whatsapp = document.createElement("a");
  whatsapp.className = "whatsapp";
  whatsapp.href = "https://wa.me/marioxherrero";
  whatsapp.target = "_blank";
  whatsapp.rel = "noopener noreferrer";
  whatsapp.setAttribute("aria-label", "Escríbenos por WhatsApp al usuario @marioxherrero (se abre en una ventana nueva)");
  whatsapp.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="/iconos.svg#i-whatsapp"/></svg>'
    + '<span aria-hidden="true">WhatsApp<small>@marioxherrero</small></span>';
  document.body.appendChild(whatsapp);
}

/* Botón fijo de auditoría en móvil. En el móvil, el botón del principio se
   pierde enseguida al bajar, así que reaparece abajo a la izquierda, junto al
   de WhatsApp. No se pone en las páginas donde ya se está pidiendo la auditoría
   ni mientras el aviso de cookies ocupa esa zona (eso último, en el CSS). */
const RUTA = location.pathname;
if (!document.querySelector(".cta-fijo") && !["/auditoria-crm-gratis/", "/reservar-reunion/"].includes(RUTA)) {
  const cta = document.createElement("a");
  cta.className = "cta-fijo";
  cta.href = "/auditoria-crm-gratis/";
  cta.textContent = "Auditoría gratis";
  document.body.appendChild(cta);
  const mostrar = () => cta.classList.toggle("visible", window.scrollY > 620);
  window.addEventListener("scroll", mostrar, { passive: true });
  mostrar();
}

/* Volver arriba. Solo aparece en páginas largas y cuando ya se ha bajado
   bastante, para no competir con el resto de botones flotantes. */
if (document.documentElement.scrollHeight > window.innerHeight * 3.5) {
  const arriba = document.createElement("button");
  arriba.type = "button";
  arriba.className = "subir";
  arriba.setAttribute("aria-label", "Volver arriba");
  arriba.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  arriba.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    document.querySelector("header a, header button")?.focus({ preventScroll: true });
  });
  document.body.appendChild(arriba);
  let pendienteSubir = false;
  const verSubir = () => {
    pendienteSubir = false;
    arriba.classList.toggle("visible", window.scrollY > window.innerHeight * 2);
  };
  window.addEventListener("scroll", () => {
    if (pendienteSubir) return;
    pendienteSubir = true;
    requestAnimationFrame(verSubir);
  }, { passive: true });
  verSubir();
}

/* Clics que indican intención de contacto. Delegado en el documento para cubrir
   también lo que se crea después (botón de WhatsApp, generador de flujo). */
document.addEventListener("click", (event) => {
  const enlace = event.target.closest("a, button");
  if (!enlace) return;
  const seccion = enlace.closest("section[id], header, footer, aside")?.id
    || enlace.closest("header, footer, aside")?.tagName.toLowerCase() || "contenido";
  const href = enlace.getAttribute("href") || "";

  if (enlace.dataset.compartir || enlace.hasAttribute("data-compartir-copiar")) {
    medir("share", { method: enlace.dataset.compartir || "copiar_enlace", content_type: "articulo", item_id: location.pathname });
  } else if (enlace.classList.contains("whatsapp")) {
    medir("click_whatsapp", { pagina: location.pathname });
  } else if (href.startsWith("mailto:")) {
    medir("click_email", { pagina: location.pathname, seccion });
  } else if (enlace.matches("[data-copy]")) {
    medir("copiar_email", { pagina: location.pathname, seccion });
  } else if (/^\/(auditoria-crm-gratis|reservar-reunion|checklist-crm-centros-formacion)\//.test(href)) {
    medir("click_cta", { destino: href.split("?")[0], texto: enlace.textContent.trim().slice(0, 60), pagina: location.pathname, seccion });
  } else if (href.endsWith(".pdf")) {
    medir("descarga_pdf", { archivo: href.split("/").pop(), pagina: location.pathname });
  } else if (enlace.matches("[data-probar]")) {
    medir("generador_probar", { sector: document.querySelector("input[data-sector]:checked")?.value || "" });
  }
});
