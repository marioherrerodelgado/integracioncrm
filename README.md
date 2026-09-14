# Integración CRM

Landing estática de [integracioncrm.com](https://integracioncrm.com), preparada para desplegarse en Cloudflare Pages.

## Configuración de Cloudflare Pages

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `public`
- Production branch: `main`

## Desarrollo local

Sirve la carpeta `public` con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000 --directory public
```
