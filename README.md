# Integración CRM

Landing estática de [integracioncrm.com](https://integracioncrm.com), preparada para desplegarse en Cloudflare Pages desde la raíz del repositorio.

## Configuración de Cloudflare Pages

- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `.` (raíz del repositorio)
- Production branch: `main`

## Desarrollo local

Sirve la raíz del repositorio con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8000
```
