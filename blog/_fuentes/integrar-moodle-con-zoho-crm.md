---
titulo: Cómo integrar Moodle con Zoho CRM: qué sincronizar y cómo hacerlo
titulo_seo: Cómo integrar Moodle con Zoho CRM | IntegraciónCRM
descripcion: Cómo integrar Moodle con Zoho CRM: qué datos sincronizar y en qué dirección, cómo se conectan con los servicios web de Moodle y los errores que conviene evitar.
resumen: Qué conviene sincronizar entre Moodle y el CRM, cómo se conectan técnicamente y el detalle que rompe la mayoría de integraciones.
categoria: Integraciones
fecha: 2026-09-17
relacionados: /servicios/integracion-moodle-crm/, /consultoria-centros-formacion/, /integraciones/zoho-make-n8n/
pregunta: ¿Hace falta instalar un plugin en Moodle?
respuesta: No necesariamente. Moodle incluye servicios web con API REST que permiten crear usuarios, matricular y consultar progreso. Un plugin solo hace falta si se quiere que Moodle avise al CRM en el momento en que algo cambia.
pregunta: ¿Sirve para cualquier versión de Moodle?
respuesta: Los servicios web existen desde hace muchas versiones, pero las funciones disponibles varían. Antes de diseñar la integración conviene comprobar cuáles ofrece vuestra instalación.
pregunta: ¿Se puede hacer lo mismo con HubSpot?
respuesta: Sí. La parte de Moodle es la misma; cambia cómo se programa el lado del CRM, normalmente a través de su API o de una plataforma intermedia.
---
En muchos centros, el alumno se matricula en el CRM y alguien lo vuelve a dar de alta a mano en Moodle. Después, para saber si ha empezado el curso, otra persona entra en Moodle, mira el progreso y lo apunta en una hoja. La integración entre ambos elimina ese trabajo, pero solo si se diseña bien.

## Qué conviene sincronizar (y en qué dirección)

La primera decisión no es técnica: es qué sistema manda en cada dato. Esta es la configuración que mejor suele funcionar:

| Dato | Dirección | Cuándo |
| --- | --- | --- |
| Alta del usuario | CRM → Moodle | Al confirmarse la matrícula |
| Matrícula en el curso | CRM → Moodle | Al confirmarse la matrícula |
| Último acceso | Moodle → CRM | Periódicamente |
| Progreso y finalización | Moodle → CRM | Periódicamente |
| Calificaciones | Moodle → CRM | Solo si el CRM las necesita |
| Baja | CRM → Moodle | Al registrarse la baja |

La regla general: **lo administrativo nace en el CRM y lo formativo nace en Moodle.** Cuando los dos sistemas pueden modificar el mismo dato, aparecen los conflictos.

## Cómo se conectan

### El lado de Moodle: servicios web

Moodle incluye servicios web con una API REST. Para usarlos hay que habilitarlos, crear un servicio con las funciones necesarias y un usuario técnico con los permisos mínimos, y generar un token. Algunas funciones habituales en una integración con el CRM:

- `core_user_create_users` y `core_user_get_users_by_field` para crear usuarios y buscarlos
- `enrol_manual_enrol_users` para matricular en un curso
- `core_course_get_courses` para obtener los cursos
- `core_completion_get_course_completion_status` para saber si se ha completado
- `gradereport_user_get_grade_items` para consultar calificaciones

La disponibilidad exacta depende de la versión de Moodle, así que conviene comprobarla en vuestra instalación antes de diseñar nada. La referencia está en la [documentación de servicios web de Moodle](https://docs.moodle.org/all/es/Servicios_web).

### El lado de Zoho CRM: Deluge o una plataforma intermedia

En Zoho CRM, lo más habitual es escribir funciones en Deluge que llaman a la API de Moodle con `invokeurl`. Se disparan desde un workflow, por ejemplo al pasar la matrícula a «confirmada», o se programan para ejecutarse cada cierto tiempo y traer el progreso.

Otra opción es usar una plataforma intermedia como Make o n8n, útil cuando intervienen más sistemas además del CRM y Moodle. Lo comparamos en [automatizar Zoho CRM con Make y n8n](/integraciones/zoho-make-n8n/).

## El detalle que rompe la mayoría de integraciones

**Cómo se identifica a la misma persona en los dos sistemas.** Usar solo el correo electrónico parece lógico, pero falla en cuanto alguien lo cambia, se equivoca al escribirlo o usa el mismo correo para dos alumnos, algo frecuente en familias.

Lo más robusto es guardar en cada sistema el identificador del otro: el ID de usuario de Moodle en la ficha del CRM y, en Moodle, el identificador del CRM en el campo `idnumber` del usuario. Así la integración no depende de que un dato editable coincida.

Otros detalles que conviene resolver al principio:

- **Cursos:** vincularlos por identificador, no por nombre. Los nombres cambian cada convocatoria.
- **Duplicados:** decidir qué hacer si el usuario ya existe en Moodle antes de crearlo.
- **Errores:** registrar cada llamada fallida y avisar a alguien. Una matrícula que no llega a Moodle en silencio es un alumno sin acceso el primer día.

## En tiempo real o periódica

Moodle no avisa de serie a otros sistemas cuando algo cambia. Por eso lo habitual es combinar:

- **Tiempo real para lo que nace en el CRM:** altas y matrículas se envían en el momento, porque el alumno necesita acceso ya.
- **Consultas periódicas para lo que nace en Moodle:** progreso, accesos y finalización se actualizan cada hora o cada noche, que es suficiente para el seguimiento.

Si se necesita que Moodle notifique al instante, existen plugins que envían eventos a sistemas externos, pero añaden una pieza más que mantener.

## Seguridad y protección de datos

> Token con los permisos mínimos, conexión siempre por HTTPS y solo los datos que el CRM necesita de verdad. Si no vais a usar las calificaciones para nada, no las sincronicéis.

Documentad qué datos viajan entre sistemas y con qué finalidad: es información que os pedirán en cualquier revisión de protección de datos.

## Antes de empezar, comprobad esto

- Qué versión de Moodle tenéis y quién la administra
- Si los servicios web están habilitados o se pueden habilitar
- Qué dato identifica a cada alumno y a cada curso
- Qué sistema manda en cada dato
- Quién recibe el aviso cuando algo falla

Si queréis que lo revisemos con vuestro caso, en [integración de Moodle con CRM](/servicios/integracion-moodle-crm/) explicamos cómo trabajamos.

[[auditoria]]
