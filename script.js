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

const infoModal = document.querySelector("[data-info-modal]");
const modalTitle = infoModal?.querySelector("#info-modal-title");
const modalBody = infoModal?.querySelector("[data-modal-body]");
const modalSource = infoModal?.querySelector("[data-modal-source]");
const reiniciaSummaries = {
  "#": "Agencia Reinicia presenta un ecosistema de servicios y herramientas para acompañar proyectos de transformación digital, CRM y negocio.",
  "/servicio/consultoria-crm/": "La consultoría CRM parte del proceso comercial, los datos y las necesidades del equipo para diseñar una solución que se pueda utilizar y medir.",
  "/servicio/consultoria-erp/": "La consultoría ERP conecta la gestión operativa y administrativa con una arquitectura de datos y procesos más ordenada.",
  "/agencia-zoho-partner-oficial/zoho-crm/": "Zoho CRM centraliza oportunidades, clientes, tareas y automatizaciones para dar continuidad al proceso comercial.",
  "/agencia-zoho-partner-oficial/zoho-one/": "Zoho One reúne aplicaciones para ventas, operaciones, marketing, soporte, finanzas y colaboración dentro de un mismo ecosistema.",
  "/agencia-zoho-partner-oficial/zoho-analytics/": "Zoho Analytics permite consolidar datos y crear cuadros de mando para analizar actividad, rendimiento y evolución del negocio.",
  "/agencia-zoho-partner-oficial/zoho-books/": "Zoho Books organiza la gestión financiera, facturación y operaciones relacionadas con clientes y servicios.",
  "/agencia-zoho-partner-oficial/zoho-forms/": "Zoho Forms facilita la captura estructurada de información y su conexión con procesos y aplicaciones del ecosistema.",
  "/agencia-zoho-partner-oficial/zoho-campaigns/": "Zoho Campaigns ayuda a segmentar contactos y automatizar comunicaciones relacionadas con el ciclo de marketing.",
  "/agencia-zoho-partner-oficial/zoho-sign/": "Zoho Sign permite gestionar documentos y firmas electrónicas dentro de un flujo digital trazable.",
  "/servicio/desarrollo-de-api-zoho-crm/": "Las integraciones mediante API y webhooks conectan Zoho con otras aplicaciones, automatizando el intercambio de datos y eventos.",
  "/casos-exito/lider-system-whatsapp-business-api-zoho-crm/": "Caso de integración de WhatsApp Business API con Zoho CRM para relacionar conversaciones y gestión comercial.",
  "/casos-exito/breezom-digitalizacion-funnel-inmobiliario-zoho/": "Caso de digitalización de un funnel inmobiliario con Zoho para ordenar captación, seguimiento y conversión.",
  "/categoria-casos/crm-erp/": "Categoría de casos de CRM y ERP con proyectos de digitalización, automatización y mejora de procesos."
};

const closeInfoModal = () => {
  if (!infoModal) return;
  infoModal.hidden = true;
  document.body.classList.remove("modal-open");
};

document.querySelectorAll("a[href*='agenciareinicia.com']").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!infoModal || !modalTitle || !modalBody || !modalSource) return;
    event.preventDefault();
    const source = new URL(link.href).pathname || "/";
    modalTitle.textContent = link.closest(".related-card")?.querySelector("strong")?.textContent || link.textContent.trim();
    modalBody.textContent = reiniciaSummaries[source] || "Referencia profesional relacionada con consultoría, CRM, ERP o transformación digital.";
    modalSource.href = link.href;
    infoModal.hidden = false;
    document.body.classList.add("modal-open");
  });
});

infoModal?.querySelectorAll("[data-modal-close]").forEach((element) => element.addEventListener("click", closeInfoModal));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeInfoModal();
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

const fieldLabels = {
  nombre: "Nombre",
  email: "Email",
  telefono: "Teléfono",
  empresa: "Empresa",
  crm: "CRM actual",
  objetivo: "Objetivo o problema",
  plataforma: "Plataforma",
  fecha: "Fecha preferida",
  hora: "Hora preferida"
};

document.querySelectorAll("[data-mail-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const trap = form.querySelector("[name='website']");
    if (trap?.value) return;

    if (meetingDateInput && !meetingDateInput.value) {
      meetingDateInput.setCustomValidity("Selecciona una fecha.");
      meetingDateInput.reportValidity();
      return;
    }
    if (meetingTimeInput && !meetingTimeInput.value) {
      meetingTimeInput.setCustomValidity("Selecciona una hora.");
      meetingTimeInput.reportValidity();
      return;
    }

    const data = new FormData(form);
    const lines = [];
    for (const [key, value] of data.entries()) {
      if (!value || key === "website") continue;
      lines.push(`${fieldLabels[key] || key}: ${value}`);
    }

    const requestType = form.dataset.formType || "Consulta web";
    const subject = `${requestType} — ${data.get("nombre") || "Nueva solicitud"}`;
    const body = [`Nueva solicitud desde integracioncrm.com`, "", ...lines, "", "La fecha y hora quedan pendientes de confirmación."].join("\n");
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector("button[type='submit']");
    if (status) status.textContent = "Enviando solicitud…";
    if (submitButton) submitButton.disabled = true;

    try {
      const payload = Object.fromEntries(data.entries());
      payload.tipo = requestType;
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Automatic delivery unavailable");
      if (status) status.textContent = "Solicitud recibida. Te contactaremos para confirmar los siguientes pasos. ✓";
      form.reset();
      return;
    } catch {
      if (status) status.textContent = "El envío automático aún no está disponible. Abriendo tu correo con la solicitud preparada…";
      window.location.href = `mailto:info@integracioncrm.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
