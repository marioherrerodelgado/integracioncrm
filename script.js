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

/* Demo interactiva del portal de gestión académica.
   Pestañas accesibles con teclado, filtros que filtran de verdad y un
   informe que recalcula. Los datos son de ejemplo; el comportamiento no. */
const demo = document.querySelector("[data-demo]");
if (demo) {
  const pestanas = [...demo.querySelectorAll('[role="tab"]')];
  const paneles = pestanas.map((t) => document.getElementById(t.getAttribute("aria-controls")));

  const activar = (i, mover = true) => {
    pestanas.forEach((t, n) => {
      const activa = n === i;
      t.setAttribute("aria-selected", String(activa));
      t.tabIndex = activa ? 0 : -1;
      paneles[n].hidden = !activa;
    });
    if (mover) pestanas[i].focus();
  };

  pestanas.forEach((t, i) => {
    t.addEventListener("click", () => activar(i, false));
    t.addEventListener("keydown", (e) => {
      const salto = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[e.key];
      if (salto === undefined) return;
      e.preventDefault();
      const destino = salto === -Infinity ? 0 : salto === Infinity ? pestanas.length - 1
        : (i + salto + pestanas.length) % pestanas.length;
      activar(destino);
    });
  });

  // Matrículas: el filtro oculta filas y actualiza el recuento
  const filasMat = [...demo.querySelectorAll("[data-tabla-matriculas] tr")];
  const cuenta = demo.querySelector("[data-cuenta]");
  demo.querySelectorAll("[data-filtro]").forEach((b) => {
    b.addEventListener("click", () => {
      const f = b.dataset.filtro;
      demo.querySelectorAll("[data-filtro]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      let visibles = 0;
      filasMat.forEach((tr) => {
        const mostrar = f === "todas" || tr.dataset.estado === f;
        tr.hidden = !mostrar;
        if (mostrar) visibles++;
      });
      cuenta.textContent = visibles;
      cuenta.parentElement.lastChild.textContent = ` de ${filasMat.length} alumnos`;
    });
  });

  // Leads: repartir el que está sin asignar
  const botonAsignar = demo.querySelector("[data-asignar]");
  botonAsignar?.addEventListener("click", () => {
    const fila = [...demo.querySelectorAll("[data-tabla-leads] tr")].find((tr) => tr.textContent.includes("Sin asignar"));
    if (!fila) return;
    fila.cells[3].textContent = "Ana María D.";
    fila.cells[4].innerHTML = '<span class="pill p-ok">Contactado</span>';
    fila.classList.add("recien-asignado");
    demo.querySelector("[data-sin-asignar]").textContent = "0";
    botonAsignar.disabled = true;
    botonAsignar.textContent = "Repartido ✓";
  });

  // Informes: recalcular cifras y gráfico
  const periodos = {
    convocatoria: { barras: [34, 48, 39, 68, 56, 83, 100], total: "1.471", leads: "2.444", conv: "60 %" },
    mes: { barras: [52, 44, 61, 38, 72, 59, 88], total: "312", leads: "521", conv: "60 %" },
    semana: { barras: [61, 39, 74, 52, 91, 46, 67], total: "74", leads: "118", conv: "63 %" }
  };
  demo.querySelectorAll("[data-periodo]").forEach((b) => {
    b.addEventListener("click", () => {
      const p = periodos[b.dataset.periodo];
      demo.querySelectorAll("[data-periodo]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      demo.querySelector("[data-total]").textContent = p.total;
      demo.querySelector("[data-leads]").textContent = p.leads;
      demo.querySelector("[data-conv]").textContent = p.conv;
      demo.querySelectorAll("[data-grafico] i").forEach((barra, n) => {
        barra.style.setProperty("--h", p.barras[n] + "%");
      });
    });
  });
}
