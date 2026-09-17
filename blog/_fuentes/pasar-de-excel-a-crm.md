---
titulo: Cómo pasar de Excel a un CRM sin perder datos
descripcion: Cómo pasar de Excel a un CRM sin perder datos: qué limpiar antes, cómo mapear columnas, qué hacer con duplicados e histórico y cómo comprobar que todo cuadra.
resumen: Excel funciona hasta que deja de hacerlo. Así se pasa a un CRM sin perder información por el camino y sin trasladar el desorden al sistema nuevo.
categoria: Zoho CRM
fecha: 2026-09-17
relacionados: /servicios/migracion-crm/, /servicios/datos-reporting-crm/, /servicios/implementacion-zoho-crm/
pregunta: ¿Puedo importar yo mismo los datos de Excel al CRM?
respuesta: Sí, todos los CRM tienen importadores de hojas de cálculo. Para listas sencillas funciona bien; se complica cuando hay duplicados, datos relacionados entre hojas o histórico que conservar.
pregunta: ¿Qué hago con los contactos duplicados?
respuesta: Resolverlos antes de importar siempre que se pueda, decidiendo qué dato prevalece en cada campo. Después de importar también se pueden fusionar, pero es más lento y más fácil equivocarse.
pregunta: ¿Tengo que importar todo el histórico?
respuesta: No. Conviene importar lo que se va a usar y guardar el resto archivado. Muchas veces basta con los contactos activos y las notas de los últimos años.
---
Excel es una herramienta excelente hasta que varias personas trabajan sobre el mismo archivo. Aparecen las versiones «final», «final2» y «buena», nadie sabe quién cambió qué, y la información de cada cliente depende de quién la apuntó y dónde.

Pasar a un CRM resuelve eso, pero solo si la migración se hace con cuidado. Importar las hojas tal cual suele trasladar el desorden al sistema nuevo, que además cuesta dinero.

## Señales de que ha llegado el momento

- Hay varias hojas con los mismos clientes y no está claro cuál es la buena.
- Solo una persona sabe cómo funciona el archivo.
- No se puede saber quién habló con un cliente, cuándo ni qué se dijo.
- Preparar un informe mensual lleva horas de copiar y pegar.
- Alguien ha perdido cambios por trabajar sobre una copia antigua.

## 1. Haz inventario antes de tocar nada

Reúne todas las hojas que contienen información de clientes, contactos u oportunidades, incluidas las que cada persona tiene en su ordenador. Para cada una, anota quién la mantiene, qué contiene y si es la fuente principal o una copia.

Es habitual descubrir que la misma información está en tres sitios con datos distintos. Decidir cuál manda es el primer paso.

## 2. Limpia antes, no después

Limpiar en Excel es más rápido que limpiar dentro del CRM. Lo que más problemas da:

- **Duplicados:** la misma persona escrita de formas distintas, o el mismo correo en dos filas.
- **Formatos:** teléfonos con y sin prefijo, fechas en varios formatos, provincias escritas de diez maneras.
- **Estados en texto libre:** «interesado», «Interesado», «int.» y «muy interesado» deberían ser un único valor de una lista.
- **Columnas vacías u obsoletas:** si nadie las rellena desde hace años, probablemente no hace falta migrarlas.

## 3. Decide dónde va cada columna

Cada columna de la hoja tiene que tener un destino claro en el CRM. Este es el tipo de tabla que conviene preparar:

| Columna en Excel | Destino en el CRM | Qué hacer |
| --- | --- | --- |
| Nombre completo | Nombre y Apellidos | Separar en dos campos |
| Empresa | Cuenta o empresa relacionada | Crear la empresa y vincular el contacto |
| Estado | Lista de valores | Unificar los textos en valores fijos |
| Notas | Notas con fecha | Importar como nota, no como campo |
| Curso o producto | Registro relacionado | Vincular, no copiar el texto |
| Última llamada | Actividad | Crear la actividad con su fecha |

## 4. Qué hacer con el histórico

No todo merece migrarse. Define una fecha de corte y decide qué entra: normalmente los contactos activos, las oportunidades abiertas y las notas recientes. El resto puede quedar archivado en las hojas originales, en solo lectura, por si alguna vez hace falta consultarlo.

## 5. Importa por fases y comprueba

1. **Prueba con una muestra.** Importa 50 registros y revísalos uno a uno: campos, relaciones y caracteres especiales como tildes y eñes.
2. **Compara los totales.** El número de registros importados debe cuadrar con el de la hoja limpia.
3. **Revisa al azar.** Elige 20 registros y compáralos con el original.
4. **Importa el resto** solo cuando la muestra esté perfecta.

> Guarda una copia de las hojas originales antes de empezar. Si algo sale mal, podrás volver a importar desde un punto conocido.

## 6. Después de la importación

- **Deja las hojas en solo lectura.** Si se sigue actualizando Excel en paralelo, en un mes habrá dos versiones de la verdad.
- **Define permisos.** Quién puede ver, editar y exportar datos.
- **Forma al equipo.** Un CRM que no se entiende acaba sustituido por una hoja nueva.
- **Nombra un responsable de la calidad de los datos.** Alguien que revise duplicados y campos vacíos cada cierto tiempo.

> Protección de datos: migrar es un buen momento para revisar que tenéis base legal para conservar cada contacto, sobre todo si pensáis usarlo para enviar comunicaciones comerciales.

[[auditoria]]

Si la migración incluye varios sistemas o mucho histórico, en [migración de CRM y datos](/servicios/migracion-crm/) explicamos cómo trabajamos.
