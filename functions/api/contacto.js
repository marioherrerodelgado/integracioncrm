const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });

const clean = (value, max = 1000) =>
  String(value || "")
    .replace(/[<>]/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const hostname = new URL(origin).hostname;
      const allowed = hostname === "integracioncrm.com" || hostname === "www.integracioncrm.com" || hostname === "integracioncrm.pages.dev" || hostname.endsWith(".integracioncrm.pages.dev");
      if (!allowed) return json({ ok: false, error: "Origen no permitido" }, 403);
    } catch {
      return json({ ok: false, error: "Origen no permitido" }, 403);
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12000) return json({ ok: false, error: "Solicitud demasiado grande" }, 413);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "Formato no válido" }, 400);
  }

  if (input.website) return json({ ok: true });

  const data = {
    tipo: clean(input.tipo, 100),
    nombre: clean(input.nombre, 120),
    email: clean(input.email, 180),
    telefono: clean(input.telefono, 50),
    empresa: clean(input.empresa, 150),
    crm: clean(input.crm, 100),
    objetivo: clean(input.objetivo, 2500),
    plataforma: clean(input.plataforma, 80),
    fecha: clean(input.fecha, 30),
    hora: clean(input.hora, 20)
  };

  if (!data.nombre || !data.email || !data.objetivo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return json({ ok: false, error: "Revisa los campos obligatorios" }, 400);
  }

  if (!env.EMAIL) return json({ ok: false, error: "Correo pendiente de configurar" }, 503);

  const rows = Object.entries(data)
    .filter(([, value]) => value)
    .map(([key, value]) => `<tr><th style="padding:8px;text-align:left;vertical-align:top">${escapeHtml(key)}</th><td style="padding:8px">${escapeHtml(value)}</td></tr>`)
    .join("");

  try {
    const result = await env.EMAIL.send({
      to: "info@integracioncrm.com",
      from: "formularios@integracioncrm.com",
      replyTo: data.email,
      subject: `${data.tipo || "Nueva solicitud web"} — ${data.nombre}`,
      text: Object.entries(data).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join("\n"),
      html: `<h2>Nueva solicitud desde integracioncrm.com</h2><table>${rows}</table>`
    });
    return json({ ok: true, messageId: result.messageId });
  } catch (error) {
    console.error("Contact form email failed", error?.code || "unknown");
    return json({ ok: false, error: "No se pudo enviar el mensaje" }, 503);
  }
}

export function onRequestGet() {
  return json({ ok: false, error: "Método no permitido" }, 405);
}
