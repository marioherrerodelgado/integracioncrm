// POST /api/visita: una página vista del contador propio (ver script.js).
// Responde al momento y guarda en segundo plano con la función registrar_visita
// de Supabase (supabase/visitas.sql), usando la clave publishable. Sin secretos.

const ROBOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|inspection|monitor|curl|wget|python|axios|node-fetch|go-http/i;

const vacio = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function onRequestVisita({ request, env, context }) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).hostname !== "integracioncrm.com") return vacio();
    } catch {
      return vacio();
    }
  }

  const ua = request.headers.get("user-agent") || "";
  if (!ua || ROBOTS.test(ua)) return vacio();
  if (Number(request.headers.get("content-length") || 0) > 2000) return vacio();

  let input;
  try {
    input = await request.json();
  } catch {
    return vacio();
  }

  const pagina = String(input.pagina || "").slice(0, 200);
  if (!pagina.startsWith("/")) return vacio();

  const datos = {
    pagina,
    referente: String(input.referente || "").replace(/[^a-z0-9.-]/gi, "").slice(0, 120),
    nueva: Boolean(input.nueva),
    pais: request.cf?.country || "",
    dispositivo: /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "móvil" : "escritorio"
  };

  if (env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) {
    context.waitUntil(
      fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/registrar_visita`, {
        method: "POST",
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, "content-type": "application/json" },
        body: JSON.stringify({ datos })
      })
        .then((r) => { if (!r.ok) console.error("registrar_visita", r.status); })
        .catch((e) => console.error("registrar_visita", e?.message))
    );
  }
  return vacio();
}
