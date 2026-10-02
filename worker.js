import { onRequestEstado, onRequestGet, onRequestPost } from "./functions/api/contacto.js";
import { onRequestVisita } from "./functions/api/visita.js";

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (url.pathname === "/api/visita") return onRequestVisita({ request, env, context });

    if (url.pathname === "/api/contacto/estado") return onRequestEstado({ request, env, context });

    if (url.pathname === "/api/contacto") {
      if (request.method === "POST") return onRequestPost({ request, env, context });
      return onRequestGet({ request, env, context });
    }

    return env.ASSETS.fetch(request);
  }
};
