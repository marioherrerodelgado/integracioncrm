---
# ── PLANTILLA DE ARTÍCULO ──────────────────────────────────────────────
# 1. Copia este archivo con el nombre de la URL:  mi-articulo.md  → /blog/mi-articulo/
# 2. Rellena la cabecera y escribe debajo del segundo ---
# 3. Ejecuta:  python3 tools/blog.py      y publica (commit + push)
# Las líneas que empiezan por # se ignoran. Los archivos que empiezan por _ no se publican.

titulo: Título del artículo tal como se verá en la página
# Opcional. Si no se pone: "Título | IntegraciónCRM". Ideal: 50-60 caracteres.
titulo_seo: Título para Google | IntegraciónCRM
# Obligatoria. Lo que sale en Google bajo el título. Máximo 160 caracteres.
descripcion: Resumen de 140-160 caracteres con la búsqueda principal al principio.
# Frase de entrada que aparece bajo el titular y en el listado del blog.
resumen: Una o dos frases que expliquen qué va a aprender quien lo lea.
# Categorías en uso: Centros de formación · Zoho CRM · Automatización · Integraciones
categoria: Centros de formación
# Fecha de publicación (AAAA-MM-DD). Si es futura, el artículo no se publica hasta ese día.
fecha: 2026-09-17
# Opcional: fecha de la última revisión importante.
actualizado: 2026-09-17
# Opcional: páginas de la web relacionadas, separadas por comas.
relacionados: /consultoria-centros-formacion/, /servicios/automatizacion-crm/
# Opcional: "si" para que no se publique aunque la fecha haya pasado.
borrador: no
# Opcional: preguntas frecuentes (salen al final y en el marcado para Google).
pregunta: ¿Primera pregunta?
respuesta: Respuesta breve y directa.
pregunta: ¿Segunda pregunta?
respuesta: Otra respuesta.
---
Primer párrafo: el problema, en dos o tres frases. Sin introducciones genéricas.

## Un subtítulo por idea (aparece en el índice)

Texto normal. **Negrita**, *cursiva*, `código` y [enlaces internos](/sectores/) o [externos](https://moodle.org).

### Subapartado

- Lista con guiones
- Otro punto

1. Lista numerada
2. Segundo paso

> Nota destacada: un consejo, una advertencia o un matiz importante.

| Columna | Otra columna |
| --- | --- |
| Dato | Dato |

Llamadas a la acción listas para usar (una línea sola):

[[checklist]]

[[auditoria]]
