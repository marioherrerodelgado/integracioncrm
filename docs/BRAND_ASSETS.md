# Recursos de marca · IntegraciónCRM

Identidad visual oficial (brand kit v1). Todos los archivos están en la raíz pública
del sitio, así que se sirven con URLs normales:

```
/brand/integracioncrm/
├── logos/       logotipo horizontal, isotipo y lockups (SVG)
├── favicons/    favicons SVG, PNG e ICO en tres variantes
├── social/      avatares 1080×1080 para perfiles
├── animation/   logo animado y banner
└── preview/     hoja de previsualización del kit
```

> Esta web es HTML estático sin framework ni carpeta `/public`: la raíz del
> repositorio es lo que publica Cloudflare (`wrangler.jsonc` → `assets.directory: "."`).
> Por eso la carpeta es `/brand/...` en la raíz. `docs/` no se publica (`.assetsignore`).

Los archivos del kit se guardan **sin modificar** (verificado por hash). La única pieza
derivada es `favicons/apple-touch-icon_mint_180.png` (ver más abajo).

## Qué logo usar

| Fondo | Archivo | URL |
| --- | --- | --- |
| Claro o blanco | `integracioncrm_logo_primary.svg` | `/brand/integracioncrm/logos/integracioncrm_logo_primary.svg` |
| Oscuro | `integracioncrm_logo_dark.svg` | `/brand/integracioncrm/logos/integracioncrm_logo_dark.svg` |
| Mint | `integracioncrm_logo_mint.svg` | `/brand/integracioncrm/logos/integracioncrm_logo_mint.svg` |

**Isotipo** (sin texto) para favicon, avatar, app icon, loaders o cuando el horizontal no quepa:
`integracioncrm_icon_primary.svg` (claro), `integracioncrm_icon_dark.svg` (oscuro),
`integracioncrm_icon_mint.svg` (mint).

**Lockup con lema** («Conecta · Automatiza · Haz crecer»): `integracioncrm_lockup_primary.svg`
y `integracioncrm_lockup_dark.svg`. No usar en la cabecera: a esa altura el lema no se lee.
Ojo: en los lockups el lema es texto (`<text>` en Inter Medium), no contornos; si Inter no
está instalada se muestra con la fuente de reserva. El wordmark sí está en contornos.

### Dónde está puesto hoy

- **Cabecera** (37 páginas): `logo_primary`. La cabecera siempre es clara (también al
  hacer scroll sobre la zona oscura: lleva su propio velo claro).
- **Pie** (37 páginas): `logo_primary`, carga diferida.
- **Imágenes Open Graph** (`/og/og-*.svg` → `.png`): `logo_dark`, referenciado por URL.
  Si se cambian, regenerar el PNG a 1200×630.

### Cómo insertarlo

Siempre como `<img>`, nunca pegando el SVG dentro del HTML: todos los SVG del kit usan
el mismo `id="ringGrad"` y, incrustados juntos en una página, los degradados chocarían.

```html
<a class="brand" href="/"><img class="brand-logo" src="/brand/integracioncrm/logos/integracioncrm_logo_primary.svg" width="893" height="208" alt="IntegraciónCRM"/></a>
```

- `width`/`height` son las proporciones reales del SVG: reservan el hueco y evitan saltos de maquetación.
- El tamaño se controla con `--logo-h` en `styles.css` (46 px en escritorio, 40 px en móvil y pie).
- El SVG trae aire alrededor del dibujo; `.brand-logo` lo compensa con márgenes negativos.

No hay componente reutilizable (tipo `<BrandLogo />`) a propósito: el sitio no tiene
plantillas ni build, y generar el logo con JavaScript lo retrasaría y lo haría
desaparecer sin JS. La reutilización está en las URLs estables y en la clase `.brand-logo`.

## Favicons

Carpeta: `/brand/integracioncrm/favicons/`. Variantes `light`, `dark` y `mint`, cada una en
`.svg`, `.ico` (16–256 px) y `.png` de 32, 64, 180 y 512.

**Activo: mint** (continuidad con el favicon anterior y buen contraste en pestañas claras y oscuras).

```html
<link rel="icon" href="/brand/integracioncrm/favicons/favicon_mint.ico" sizes="32x32"/>
<link rel="icon" href="/brand/integracioncrm/favicons/favicon_mint.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/brand/integracioncrm/favicons/apple-touch-icon_mint_180.png"/>
```

- `/favicon.ico` y `/favicon.svg` redirigen (301) a los nuevos desde `_redirects`.
- `apple-touch-icon_mint_180.png` es **derivado**: los PNG de 180 del kit tienen las esquinas
  redondeadas transparentes e iOS las pinta de negro al aplicar su máscara. El derivado es el
  mismo `favicon_mint.svg` a sangre completa. Si se cambia de variante, regenerarlo igual.
- No existe web manifest.

## Redes sociales

`/brand/integracioncrm/social/`: `integracioncrm_social_light_1080.png`,
`integracioncrm_social_dark_1080.png`, `integracioncrm_social_mint_1080.png`.
Para LinkedIn, Instagram, X, Facebook, WhatsApp Business y perfiles de empresa.
No usar como logo de la web ni como `og:image` (las OG propias están mejor diseñadas).
El `light` figura como `logo` de la organización en el JSON-LD de la portada.

## Animaciones

`/brand/integracioncrm/animation/` — **almacenadas, no integradas en la web**:

| Archivo | Tamaño | Uso |
| --- | --- | --- |
| `integracioncrm_logo_animated.svg` | 8 KB | Recomendado para web (vectorial y ligero) |
| `integracioncrm_logo_reveal.mp4` | 54 KB | Vídeo, presentaciones |
| `integracioncrm_logo_reveal.gif` | 185 KB | Donde no quepa vídeo (email, etc.) |
| `integracioncrm_banner_dark_reference_style.gif` | 730 KB, 1120×320 | Banner oscuro: campañas, presentaciones. No es un logo |

Antes de usar `logo_animated.svg` en la web: se repite en bucle infinito y **no incluye
`prefers-reduced-motion`**. Como `<img>` no se puede pausar desde el CSS de la página,
así que hay que mostrar el logo estático a quien tenga el movimiento reducido
(`<picture>` con `<source media="(prefers-reduced-motion: no-preference)">`).

## Colores oficiales

Registrados como variables en `styles.css`:

| Token | Valor | Nombre |
| --- | --- | --- |
| `--brand-navy` | `#081426` | Azul profundo |
| `--brand-mint` | `#2DE6A6` | Verde mint |
| `--brand-dark-green` | `#0A5F4B` | Verde de transición |
| `--brand-soft-gray` | `#E9EEF2` | Gris suave |
| `--brand-white` | `#FFFFFF` | Blanco |

La interfaz actual todavía usa sus tokens anteriores (`--ink: #07111f`, `--mint: #86f7c0`,
`--mint-dark: #29c782`). Migrarla a los de marca es un cambio de diseño aparte.

## Tipografía

Marca: Inter ExtraBold (wordmark) e Inter Medium (secundario). El wordmark de los SVG
está en contornos y no necesita la fuente. La web sigue con su pila de sistema
(`Avenir Next`, `Segoe UI`, `system-ui`) y no carga fuentes externas.

## Nombre

Se escribe **IntegraciónCRM** (junto y con tilde). Solo sin tilde donde no se admite:
dominio, rutas y nombres de archivo (`integracioncrm`). «Integración CRM» con espacio se
conserva únicamente como `alternateName` en el JSON-LD, para la búsqueda.
