import { onRequestGet, onRequestPost } from "./functions/api/contacto.js";

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contacto") {
      if (request.method === "POST") return onRequestPost({ request, env, context });
      return onRequestGet({ request, env, context });
    }

    return env.ASSETS.fetch(request);
  }
};
