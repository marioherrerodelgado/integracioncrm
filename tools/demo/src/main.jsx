/* Demo de IntegraciónCRM: un CRM y un portal de clientes a medida, con Zoho
   como base de datos. Empresa y datos ficticios; las llamadas a Zoho se simulan. */
const { useState, useReducer, useEffect, useRef } = React;

/* ------------------------------------------------------------ utilidades */

const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const fecha = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const hora = () => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const zid = (n) => "584300000" + String(n).padStart(7, "0"); // identificadores al estilo de Zoho
const HOY = "2026-10-02";
const cx = (...c) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------ datos ficticios */

const ETAPAS = ["Nuevo", "Visita técnica", "Presupuesto enviado", "Aceptado", "Instalado"];

const CLIENTES = [
  { id: "c1", n: 101, nombre: "Hotel Puerta del Sur", contacto: "Laura Méndez", cargo: "Directora de mantenimiento", email: "laura@puertadelsur.example", ciudad: "Sevilla", revision: "2026-10-14",
    equipos: [["Enfriadora de la planta técnica", "2026-03-12"], ["Fancoils de habitaciones (48 uds.)", "2026-03-12"], ["Recuperador de calor de cocina", "2026-06-03"]] },
  { id: "c2", n: 102, nombre: "Clínica Dental Sonrisa Clara", contacto: "Javier Ortega", cargo: "Gerente", email: "javier@sonrisaclara.example", ciudad: "Madrid", revision: "2026-10-22",
    equipos: [["Split del gabinete 1", "2026-04-08"], ["Split del gabinete 2", "2026-04-08"], ["Cassette de recepción", "2026-04-08"]] },
  { id: "c3", n: 103, nombre: "Coworking La Nave", contacto: "Marta Ruiz", cargo: "Responsable de instalaciones", email: "marta@lanave.example", ciudad: "Valencia", revision: "2026-11-05",
    equipos: [["VRF de la planta 1 (12 uds.)", "2026-05-20"], ["Ventilación con recuperación", "2026-05-20"]] },
  { id: "c4", n: 104, nombre: "Colegio Los Almendros", contacto: "Sergio Pastor", cargo: "Administrador", email: "sergio@losalmendros.example", ciudad: "Málaga", revision: "2026-12-01",
    equipos: [["Bomba de calor del aulario", "2026-01-15"]] },
  { id: "c5", n: 105, nombre: "Restaurante El Olivo Azul", contacto: "Elena Campos", cargo: "Propietaria", email: "elena@olivoazul.example", ciudad: "Valladolid", revision: "2027-01-10",
    equipos: [["Extracción de cocina", "2026-02-02"]] },
  { id: "c6", n: 106, nombre: "Gimnasio Pulso", contacto: "David Navas", cargo: "Director", email: "david@gimnasiopulso.example", ciudad: "Madrid", revision: "2026-10-30",
    equipos: [["Sala de máquinas", "2026-07-01"], ["Climatizadora de la sala de clases", "2026-07-01"]] },
];

const DEALS = [
  { id: "d1", n: 201, cliente: "c1", titulo: "Sustitución de la enfriadora", importe: 38400, etapa: "Presupuesto enviado", comercial: "Ana Torres" },
  { id: "d2", n: 202, cliente: "c2", titulo: "Climatización del gabinete 3", importe: 4950, etapa: "Presupuesto enviado", comercial: "Rubén Sáez" },
  { id: "d3", n: 203, cliente: "c3", titulo: "Ampliación VRF planta 2", importe: 26700, etapa: "Visita técnica", comercial: "Ana Torres" },
  { id: "d4", n: 204, cliente: "c4", titulo: "Contrato de mantenimiento 2027", importe: 7800, etapa: "Nuevo", comercial: "Rubén Sáez" },
  { id: "d5", n: 205, cliente: "c5", titulo: "Extracción y clima del comedor", importe: 12300, etapa: "Aceptado", comercial: "Ana Torres" },
  { id: "d6", n: 206, cliente: "c6", titulo: "Renovación de la sala de máquinas", importe: 18900, etapa: "Visita técnica", comercial: "Rubén Sáez" },
  { id: "d7", n: 207, cliente: "c3", titulo: "Mantenimiento anual 2026", importe: 3600, etapa: "Instalado", comercial: "Ana Torres" },
  { id: "d8", n: 208, cliente: "c1", titulo: "Mantenimiento preventivo 2027", importe: 9200, etapa: "Nuevo", comercial: "Ana Torres" },
];

const QUOTES = [
  { id: "P-2026-041", n: 301, cliente: "c1", deal: "d1", titulo: "Sustitución de la enfriadora de la planta técnica", fecha: "2026-09-25", valido: "2026-10-25", estado: "Enviado",
    lineas: [["Enfriadora aire-agua de 180 kW", 29800], ["Desmontaje y retirada de la enfriadora actual", 3200], ["Grúa y maniobra en cubierta", 2400], ["Puesta en marcha y legalización", 3000]] },
  { id: "P-2026-043", n: 302, cliente: "c2", deal: "d2", titulo: "Split para el gabinete 3", fecha: "2026-09-29", valido: "2026-10-29", estado: "Enviado",
    lineas: [["Split inverter de 3,5 kW", 1890], ["Instalación y línea frigorífica", 1460], ["Adecuación eléctrica", 600], ["Rejillas y remates", 1000]] },
  { id: "P-2026-038", n: 303, cliente: "c3", deal: "d7", titulo: "Mantenimiento anual 2026", fecha: "2026-08-28", valido: "2026-09-28", estado: "Aceptado", aceptado: "2026-09-02",
    lineas: [["Dos revisiones preventivas al año", 2400], ["Asistencia en 24 h laborables", 1200]] },
];

const INVOICES = [
  { id: "F-2026-118", cliente: "c1", concepto: "Reparación de fancoils, planta 3", importe: 860, estado: "Pendiente", vence: "2026-10-10" },
  { id: "F-2026-109", cliente: "c1", concepto: "Revisión semestral de marzo", importe: 1450, estado: "Pagada", pagada: "2026-03-20" },
  { id: "F-2026-120", cliente: "c2", concepto: "Recarga de gas, gabinete 1", importe: 310, estado: "Pendiente", vence: "2026-10-15" },
  { id: "F-2026-115", cliente: "c2", concepto: "Revisión anual de equipos", importe: 540, estado: "Pagada", pagada: "2026-09-18" },
  { id: "F-2026-121", cliente: "c3", concepto: "Mantenimiento anual 2026, primer plazo", importe: 1800, estado: "Pagada", pagada: "2026-10-01" },
  { id: "F-2026-122", cliente: "c3", concepto: "Mantenimiento anual 2026, segundo plazo", importe: 1800, estado: "Pendiente", vence: "2026-12-01" },
];

const TICKETS = [
  { id: 1041, cliente: "c2", equipo: "Split del gabinete 1", texto: "Gotea agua por la parte de abajo.", prioridad: "Media", estado: "En curso", origen: "Teléfono", fecha: "2026-09-30" },
  { id: 1039, cliente: "c6", equipo: "Sala de máquinas", texto: "Salta la alarma de alta presión cada pocas horas.", prioridad: "Alta", estado: "Abierta", origen: "Correo", fecha: "2026-09-29" },
  { id: 1036, cliente: "c1", equipo: "Fancoils de habitaciones (48 uds.)", texto: "La habitación 214 no enfría.", prioridad: "Baja", estado: "Resuelta", origen: "Portal", fecha: "2026-09-24" },
];

const ACTIVIDAD = [
  { id: 3, cuando: "1 oct", texto: "Coworking La Nave pagó la factura F-2026-121", origen: "Portal" },
  { id: 2, cuando: "30 sep", texto: "La incidencia #1041 de Clínica Dental Sonrisa Clara pasó a En curso", origen: "CRM" },
  { id: 1, cuando: "29 sep", texto: "Presupuesto P-2026-043 enviado a Clínica Dental Sonrisa Clara", origen: "CRM" },
];

const RETOS = [
  ["aceptar", "Acepta un presupuesto en el portal"],
  ["incidencia", "Abre una incidencia desde el portal"],
  ["estado", "Cámbiala a «En curso» en el CRM"],
  ["zoho", "Activa «Ver Zoho por detrás»"],
];

const estadoInicial = () => ({
  clientes: CLIENTES, deals: DEALS, quotes: QUOTES, invoices: INVOICES, tickets: TICKETS,
  actividad: ACTIVIDAD, log: [], cambios: {}, retos: {}, siguiente: 1042,
});

/* ------------------------------------------------------------ "Zoho" simulado */

function reducer(s, a) {
  const t = Date.now();
  const marca = (...ids) => { const c = { ...s.cambios }; ids.forEach((i) => (c[i] = t)); return c; };
  const registra = (llamadas) => [...llamadas.map((l, i) => ({ ...l, hora: hora(), id: `${t}-${i}-${Math.random()}` })), ...s.log].slice(0, 60);
  const anota = (texto, origen) => [{ id: t, cuando: "Ahora", texto, origen }, ...s.actividad].slice(0, 14);
  const nombre = (id) => s.clientes.find((c) => c.id === id).nombre;

  switch (a.type) {
    case "leer":
      return { ...s, log: registra(a.llamadas) };

    case "moverDeal": {
      const d = s.deals.find((x) => x.id === a.id);
      const etapa = ETAPAS[ETAPAS.indexOf(d.etapa) + a.paso];
      if (!etapa) return s;
      return {
        ...s,
        deals: s.deals.map((x) => (x.id === a.id ? { ...x, etapa } : x)),
        cambios: marca(a.id),
        actividad: anota(`«${d.titulo}» (${nombre(d.cliente)}) pasó a ${etapa}`, "CRM"),
        log: registra([{ app: "CRM", metodo: "PUT", ruta: `crm/v8/Deals/${zid(d.n)}`, cuerpo: `{"Stage": "${etapa}"}` }]),
      };
    }

    case "aceptar": {
      const q = s.quotes.find((x) => x.id === a.id);
      const d = s.deals.find((x) => x.id === q.deal);
      return {
        ...s,
        quotes: s.quotes.map((x) => (x.id === a.id ? { ...x, estado: "Aceptado", aceptado: HOY } : x)),
        deals: s.deals.map((x) => (x.id === q.deal ? { ...x, etapa: "Aceptado" } : x)),
        cambios: marca(q.id, q.deal),
        retos: { ...s.retos, aceptar: true },
        actividad: [
          { id: t + 1, cuando: "Ahora", texto: `Tarea creada para ${d.comercial}: planificar la instalación de «${d.titulo}»`, origen: "Automático" },
          ...anota(`${nombre(q.cliente)} aceptó el presupuesto ${q.id} desde el portal`, "Portal"),
        ],
        log: registra([
          { app: "CRM", metodo: "POST", ruta: "crm/v8/Tasks", cuerpo: `{"Subject": "Planificar instalación", "What_Id": "${zid(d.n)}"}` },
          { app: "CRM", metodo: "PUT", ruta: `crm/v8/Deals/${zid(d.n)}`, cuerpo: `{"Stage": "Aceptado"}` },
          { app: "CRM", metodo: "PUT", ruta: `crm/v8/Quotes/${zid(q.n)}`, cuerpo: `{"Quote_Stage": "Aceptado"}` },
        ]),
      };
    }

    case "cambios": {
      const q = s.quotes.find((x) => x.id === a.id);
      return {
        ...s,
        quotes: s.quotes.map((x) => (x.id === a.id ? { ...x, estado: "Cambios pedidos", nota: a.nota } : x)),
        cambios: marca(q.id),
        actividad: anota(`${nombre(q.cliente)} pidió cambios en ${q.id}: «${a.nota}»`, "Portal"),
        log: registra([
          { app: "CRM", metodo: "POST", ruta: `crm/v8/Quotes/${zid(q.n)}/Notes`, cuerpo: `{"Note_Content": "${a.nota.slice(0, 40)}…"}` },
          { app: "CRM", metodo: "PUT", ruta: `crm/v8/Quotes/${zid(q.n)}`, cuerpo: `{"Quote_Stage": "Cambios pedidos"}` },
        ]),
      };
    }

    case "pagar": {
      const f = s.invoices.find((x) => x.id === a.id);
      return {
        ...s,
        invoices: s.invoices.map((x) => (x.id === a.id ? { ...x, estado: "Pagada", pagada: HOY } : x)),
        cambios: marca(f.id),
        actividad: anota(`${nombre(f.cliente)} pagó la factura ${f.id} (${eur(f.importe)})`, "Portal"),
        log: registra([{ app: "Books", metodo: "POST", ruta: "books/v3/customerpayments", cuerpo: `{"invoice_number": "${f.id}", "amount": ${f.importe}, "payment_mode": "card"}` }]),
      };
    }

    case "incidencia": {
      const id = s.siguiente;
      const nueva = { id, cliente: a.cliente, equipo: a.equipo, texto: a.texto, prioridad: a.prioridad, estado: "Abierta", origen: "Portal", fecha: HOY };
      return {
        ...s,
        siguiente: id + 1,
        tickets: [nueva, ...s.tickets],
        cambios: marca(`t${id}`),
        retos: { ...s.retos, incidencia: true },
        actividad: anota(`${nombre(a.cliente)} abrió la incidencia #${id} desde el portal: ${a.equipo}`, "Portal"),
        log: registra([{ app: "Desk", metodo: "POST", ruta: "desk/api/v1/tickets", cuerpo: `{"subject": "${a.equipo}", "priority": "${a.prioridad}", "channel": "Web"}` }]),
      };
    }

    case "estadoTicket": {
      const k = s.tickets.find((x) => x.id === a.id);
      return {
        ...s,
        tickets: s.tickets.map((x) => (x.id === a.id ? { ...x, estado: a.estado } : x)),
        cambios: marca(`t${a.id}`),
        retos: a.estado === "En curso" && k.origen === "Portal" && k.fecha === HOY ? { ...s.retos, estado: true } : s.retos,
        actividad: anota(`La incidencia #${a.id} de ${nombre(k.cliente)} pasó a ${a.estado}`, "CRM"),
        log: registra([{ app: "Desk", metodo: "PATCH", ruta: `desk/api/v1/tickets/${zid(k.id)}`, cuerpo: `{"status": "${a.estado}"}` }]),
      };
    }

    case "reto":
      return { ...s, retos: { ...s.retos, [a.clave]: true } };

    case "reiniciar":
      return estadoInicial();

    default:
      return s;
  }
}

/* ------------------------------------------------------------ iconos */

const Icono = ({ d, className = "size-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d.split("|").map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const I = {
  inicio: "M4 11.5 12 5l8 6.5|M6 10v9h12v-9",
  embudo: "M4 5h16|M7 12h10|M10 19h4",
  clientes: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z|M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5|M16 4.5a3.5 3.5 0 0 1 0 6.6|M18 15c1.6.6 2.6 2.2 3 5",
  llave: "M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17v3h3l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-2.5 2.5-2.5Z",
  doc: "M7 3h7l4 4v14H7Z|M14 3v4h4|M10 12h5|M10 16h5",
  recibo: "M6 3h12v18l-3-2-3 2-3-2-3 2Z|M9 8h6|M9 12h6",
  equipo: "M4 6h16v8H4Z|M7 18h10|M8 10h.01|M12 10h4",
  izq: "M14 6l-6 6 6 6",
  der: "M10 6l6 6-6 6",
  ok: "M5 12.5 10 17l9-10",
  db: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Z|M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6|M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  reinicio: "M4 12a8 8 0 1 0 2.4-5.7L4 8.5|M4 4v4.5h4.5",
};

/* ------------------------------------------------------------ piezas comunes */

const PILL = {
  ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", bad: "bg-bad-soft text-bad",
  accent: "bg-accent-soft text-accent-text", neutro: "bg-surface-2 text-muted border border-line", mint: "bg-mint-soft text-mint-text",
};
const Pill = ({ tono = "neutro", children }) => (
  <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold", PILL[tono])}>{children}</span>
);
const tonoEstado = { Enviado: "warn", Aceptado: "ok", "Cambios pedidos": "accent", Pendiente: "warn", Pagada: "ok", Abierta: "bad", "En curso": "warn", Resuelta: "ok" };
const tonoPrioridad = { Alta: "bad", Media: "warn", Baja: "neutro" };
const tonoOrigen = { Portal: "mint", CRM: "accent", Automático: "neutro" };

const ZohoTag = ({ ver, children }) =>
  ver ? (
    <span className="entra inline-flex items-center gap-1 rounded-md border border-dashed border-zoho/50 bg-zoho-soft px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-zoho">
      <Icono d={I.db} className="size-3" />
      {children}
    </span>
  ) : null;

const Destello = ({ cambio, className, children, ...resto }) => (
  <div key={cambio || "x"} className={cx(className, cambio && Date.now() - cambio < 3000 && "destello")} {...resto}>
    {children}
  </div>
);

const Iniciales = ({ nombre, className }) => (
  <span className={cx("grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-text", className)} aria-hidden="true">
    {nombre.split(" ").map((p) => p[0]).slice(0, 2).join("")}
  </span>
);

const LogoAltavento = ({ claro }) => (
  <span className="inline-flex items-center gap-2">
    <svg viewBox="0 0 28 28" className="size-6" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="var(--accent)" />
      <path d="M6 11h11a3 3 0 1 0-3-3M6 15h15a3 3 0 1 1-3 3M6 19h7" fill="none" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span className={cx("text-[15px] font-bold tracking-tight", claro ? "text-frame-ink" : "text-ink")}>Altavento</span>
  </span>
);

const Tabs = ({ items, actual, onChange, etiqueta }) => (
  <div role="tablist" aria-label={etiqueta} className="flex gap-1 overflow-x-auto border-b border-line px-3 @3xl:px-5">
    {items.map(([id, texto, icono, badge]) => (
      <button key={id} role="tab" aria-selected={actual === id} onClick={() => onChange(id)}
        className={cx("-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[13px] font-semibold transition-colors",
          actual === id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink")}>
        <Icono d={icono} />
        {texto}
        {badge ? <span className="num rounded-full bg-accent px-1.5 text-[10.5px] font-bold text-accent-ink">{badge}</span> : null}
      </button>
    ))}
  </div>
);

const Bloque = ({ titulo, zoho, ver, extra, children, className }) => (
  <section className={cx("rounded-xl border border-line bg-surface", className)}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
      <h3 className="text-[13px] font-bold">{titulo}</h3>
      <div className="flex items-center gap-2">{extra}<ZohoTag ver={ver}>{zoho}</ZohoTag></div>
    </header>
    {children}
  </section>
);

/* ------------------------------------------------------------ CRM del equipo */

function CRM({ s, dispatch, ver, aviso }) {
  const [tab, setTab] = useState("inicio");
  const [sel, setSel] = useState("c1");
  const cliente = (id) => s.clientes.find((c) => c.id === id);
  const abiertas = s.tickets.filter((t) => t.estado !== "Resuelta");

  useEffect(() => {
    dispatch({ type: "leer", llamadas: [
      { app: "CRM", metodo: "GET", ruta: "crm/v8/Deals?fields=Deal_Name,Stage,Amount,Owner", cuerpo: "" },
      { app: "CRM", metodo: "GET", ruta: "crm/v8/Quotes?fields=Subject,Quote_Stage,Grand_Total", cuerpo: "" },
      { app: "Desk", metodo: "GET", ruta: "desk/api/v1/tickets?status=Open,On Hold", cuerpo: "" },
    ] });
  }, []);

  const mover = (d, paso) => { dispatch({ type: "moverDeal", id: d.id, paso }); aviso("Etapa actualizada en Zoho CRM"); };

  return (
    <div className="@container flex min-h-0 flex-col">
      <Tabs etiqueta="Secciones del CRM" actual={tab} onChange={setTab} items={[
        ["inicio", "Inicio", I.inicio], ["embudo", "Oportunidades", I.embudo],
        ["clientes", "Clientes", I.clientes], ["incidencias", "Incidencias", I.llave, abiertas.length],
      ]} />

      <div className="grid gap-4 p-3 @3xl:p-5">
        {tab === "inicio" && <InicioCRM s={s} ver={ver} cliente={cliente} irA={setTab} />}

        {tab === "embudo" && (
          <Bloque titulo="Oportunidades por etapa" zoho="Zoho CRM · Deals" ver={ver}>
            <div className="overflow-x-auto p-3">
              <div className="flex gap-3">
                {ETAPAS.map((etapa, i) => {
                  const lista = s.deals.filter((d) => d.etapa === etapa);
                  return (
                    <div key={etapa} className="w-52 shrink-0 rounded-lg bg-surface-2 p-2">
                      <div className="mb-2 flex items-baseline justify-between px-1">
                        <span className="text-[12px] font-bold">{etapa}</span>
                        <span className="num text-[11.5px] text-muted">{eur(lista.reduce((a, d) => a + d.importe, 0))}</span>
                      </div>
                      <div className="grid gap-2">
                        {lista.map((d) => (
                          <Destello key={d.id} cambio={s.cambios[d.id]} className="rounded-lg border border-line bg-surface p-2.5">
                            <p className="text-[11.5px] text-muted">{cliente(d.cliente).nombre}</p>
                            <p className="mt-0.5 text-[13px] font-semibold leading-snug">{d.titulo}</p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="num text-[13px] font-bold">{eur(d.importe)}</span>
                              <span className="flex items-center gap-1">
                                <button disabled={i === 0} onClick={() => mover(d, -1)} aria-label={`Mover «${d.titulo}» a la etapa anterior`}
                                  className="grid size-6 place-items-center rounded-md border border-line text-muted hover:text-ink disabled:opacity-30"><Icono d={I.izq} /></button>
                                <button disabled={i === ETAPAS.length - 1} onClick={() => mover(d, 1)} aria-label={`Mover «${d.titulo}» a la etapa siguiente`}
                                  className="grid size-6 place-items-center rounded-md border border-line text-muted hover:text-ink disabled:opacity-30"><Icono d={I.der} /></button>
                              </span>
                            </div>
                            <p className="mt-1.5 text-[11px] text-muted">{d.comercial}</p>
                          </Destello>
                        ))}
                        {!lista.length && <p className="px-1 pb-1 text-[12px] text-muted">Sin oportunidades</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Bloque>
        )}

        {tab === "clientes" && (
          <div className="grid gap-4 @3xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <Bloque titulo="Clientes" zoho="Zoho CRM · Accounts" ver={ver}>
              <ul className="divide-y divide-line">
                {s.clientes.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setSel(c.id)} aria-current={sel === c.id}
                      className={cx("flex w-full items-center gap-2.5 px-4 py-2.5 text-left", sel === c.id ? "bg-accent-soft" : "hover:bg-surface-2")}>
                      <Iniciales nombre={c.nombre} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold">{c.nombre}</span>
                        <span className="block text-[11.5px] text-muted">{c.ciudad}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Bloque>
            <FichaCliente s={s} c={cliente(sel)} ver={ver} />
          </div>
        )}

        {tab === "incidencias" && (
          <Bloque titulo="Incidencias" zoho="Zoho Desk · Tickets" ver={ver}>
            <ul className="divide-y divide-line">
              {s.tickets.map((t) => (
                <li key={t.id}>
                  <Destello cambio={s.cambios[`t${t.id}`]} className="grid gap-2 px-4 py-3 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="num font-mono text-[12px] text-muted">#{t.id}</span>
                        <span className="text-[13px] font-semibold">{cliente(t.cliente).nombre}</span>
                        <Pill tono={tonoPrioridad[t.prioridad]}>{t.prioridad}</Pill>
                        <Pill tono={tonoOrigen[t.origen] || "neutro"}>{t.origen}</Pill>
                      </div>
                      <p className="mt-1 text-[13px]"><span className="text-muted">{t.equipo}:</span> {t.texto}</p>
                    </div>
                    <label className="flex items-center gap-2 text-[12px] text-muted">
                      Estado
                      <select id={`estado-${t.id}`} value={t.estado}
                        onChange={(e) => { dispatch({ type: "estadoTicket", id: t.id, estado: e.target.value }); aviso("Estado guardado en Zoho Desk"); }}
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[13px] font-semibold text-ink">
                        {["Abierta", "En curso", "Resuelta"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </label>
                  </Destello>
                </li>
              ))}
            </ul>
          </Bloque>
        )}
      </div>
    </div>
  );
}

function InicioCRM({ s, ver, cliente, irA }) {
  const pipeline = s.deals.filter((d) => d.etapa !== "Instalado").reduce((a, d) => a + d.importe, 0);
  const porFirmar = s.quotes.filter((q) => q.estado === "Enviado");
  const abiertas = s.tickets.filter((t) => t.estado !== "Resuelta");
  const urgentes = abiertas.filter((t) => t.prioridad === "Alta").length;
  const cobrado = s.invoices.filter((f) => f.estado === "Pagada" && f.pagada.startsWith("2026-10")).reduce((a, f) => a + f.importe, 0);
  const kpis = [
    ["Pipeline abierto", eur(pipeline), `${s.deals.filter((d) => d.etapa !== "Instalado").length} oportunidades`, "Zoho CRM · Deals", "embudo"],
    ["Presupuestos por firmar", String(porFirmar.length), porFirmar.length ? eur(porFirmar.reduce((a, q) => a + q.lineas.reduce((b, l) => b + l[1], 0), 0)) : "Ninguno pendiente", "Zoho CRM · Quotes", "embudo"],
    ["Incidencias abiertas", String(abiertas.length), urgentes ? `${urgentes} con prioridad alta` : "Ninguna urgente", "Zoho Desk · Tickets", "incidencias"],
    ["Cobrado en octubre", eur(cobrado), "Facturas pagadas este mes", "Zoho Books · Payments", null],
  ];
  return (
    <>
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
        {kpis.map(([t, v, sub, z, ir]) => (
          <div key={t} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-[12px] font-semibold text-muted">{t}</p>
            <p className="num mt-1 text-[24px] font-bold tracking-tight">{v}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              {ir ? <button onClick={() => irA(ir)} className="text-[12px] font-semibold text-accent-text hover:underline">{sub}</button> : <span className="text-[12px] text-muted">{sub}</span>}
              <ZohoTag ver={ver}>{z}</ZohoTag>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Bloque titulo="Actividad" zoho="Zoho CRM · Timeline" ver={ver}>
          <ul className="divide-y divide-line">
            {s.actividad.map((a) => (
              <li key={a.id} className={cx("flex items-start gap-3 px-4 py-2.5", a.cuando === "Ahora" && "entra")}>
                <span className="w-12 shrink-0 pt-0.5 text-[11.5px] text-muted">{a.cuando}</span>
                <span className="min-w-0 flex-1 text-[13px]">{a.texto}</span>
                <Pill tono={tonoOrigen[a.origen]}>{a.origen}</Pill>
              </li>
            ))}
          </ul>
        </Bloque>
        <Bloque titulo="Próximas revisiones" zoho="Zoho CRM · Events" ver={ver}>
          <ul className="divide-y divide-line">
            {[...s.clientes].sort((a, b) => a.revision.localeCompare(b.revision)).slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{c.nombre}</span>
                  <span className="block text-[11.5px] text-muted">{c.equipos.length} equipos · {c.ciudad}</span>
                </span>
                <span className="num shrink-0 text-[13px] font-semibold">{fecha(c.revision)}</span>
              </li>
            ))}
          </ul>
        </Bloque>
      </div>
    </>
  );
}

function FichaCliente({ s, c, ver }) {
  const qs = s.quotes.filter((q) => q.cliente === c.id);
  const fs = s.invoices.filter((f) => f.cliente === c.id);
  const ts = s.tickets.filter((t) => t.cliente === c.id);
  const fila = "flex items-center justify-between gap-3 px-4 py-2";
  return (
    <div className="grid content-start gap-4">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Iniciales nombre={c.nombre} className="size-10 text-[13px]" />
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold">{c.nombre}</h3>
            <p className="text-[12.5px] text-muted">{c.contacto} · {c.cargo} · {c.ciudad}</p>
          </div>
          <ZohoTag ver={ver}>Accounts + Contacts</ZohoTag>
        </div>
      </div>
      <div className="grid gap-4 @4xl:grid-cols-2">
        <Bloque titulo="Presupuestos" zoho="Quotes" ver={ver}>
          <ul className="divide-y divide-line">
            {qs.map((q) => (
              <li key={q.id}><Destello cambio={s.cambios[q.id]} className={fila}>
                <span className="min-w-0"><span className="block font-mono text-[11.5px] text-muted">{q.id}</span><span className="block truncate text-[13px]">{q.titulo}</span></span>
                <Pill tono={tonoEstado[q.estado]}>{q.estado}</Pill>
              </Destello></li>
            ))}
            {!qs.length && <li className="px-4 py-3 text-[12.5px] text-muted">Sin presupuestos</li>}
          </ul>
        </Bloque>
        <Bloque titulo="Facturas" zoho="Zoho Books" ver={ver}>
          <ul className="divide-y divide-line">
            {fs.map((f) => (
              <li key={f.id}><Destello cambio={s.cambios[f.id]} className={fila}>
                <span className="min-w-0"><span className="block font-mono text-[11.5px] text-muted">{f.id}</span><span className="num block text-[13px] font-semibold">{eur(f.importe)}</span></span>
                <Pill tono={tonoEstado[f.estado]}>{f.estado}</Pill>
              </Destello></li>
            ))}
            {!fs.length && <li className="px-4 py-3 text-[12.5px] text-muted">Sin facturas</li>}
          </ul>
        </Bloque>
        <Bloque titulo="Equipos instalados" zoho="Módulo propio: Equipos" ver={ver}>
          <ul className="divide-y divide-line">
            {c.equipos.map(([e, r]) => (
              <li key={e} className={fila}><span className="text-[13px]">{e}</span><span className="shrink-0 text-[11.5px] text-muted">Revisado {fecha(r)}</span></li>
            ))}
          </ul>
        </Bloque>
        <Bloque titulo="Incidencias" zoho="Zoho Desk" ver={ver}>
          <ul className="divide-y divide-line">
            {ts.map((t) => (
              <li key={t.id}><Destello cambio={s.cambios[`t${t.id}`]} className={fila}>
                <span className="min-w-0 truncate text-[13px]"><span className="font-mono text-muted">#{t.id}</span> {t.equipo}</span>
                <Pill tono={tonoEstado[t.estado]}>{t.estado}</Pill>
              </Destello></li>
            ))}
            {!ts.length && <li className="px-4 py-3 text-[12.5px] text-muted">Sin incidencias</li>}
          </ul>
        </Bloque>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Portal del cliente */

const PORTAL_CLIENTES = ["c1", "c2", "c3"];

function Portal({ s, dispatch, ver, aviso }) {
  const [cid, setCid] = useState("c1");
  const [tab, setTab] = useState("resumen");
  const [equipoPre, setEquipoPre] = useState("");
  const c = s.clientes.find((x) => x.id === cid);
  const qs = s.quotes.filter((q) => q.cliente === cid);
  const fs = s.invoices.filter((f) => f.cliente === cid);
  const ts = s.tickets.filter((t) => t.cliente === cid);
  const pendQ = qs.filter((q) => q.estado === "Enviado");
  const pendF = fs.filter((f) => f.estado === "Pendiente");
  const abiertas = ts.filter((t) => t.estado !== "Resuelta");

  useEffect(() => {
    dispatch({ type: "leer", llamadas: [
      { app: "CRM", metodo: "GET", ruta: `crm/v8/Quotes/search?criteria=(Account_Name.id:equals:${zid(c.n)})`, cuerpo: "" },
      { app: "Books", metodo: "GET", ruta: `books/v3/invoices?customer_id=${zid(c.n)}`, cuerpo: "" },
      { app: "Desk", metodo: "GET", ruta: `desk/api/v1/tickets/search?accountId=${zid(c.n)}`, cuerpo: "" },
    ] });
  }, [cid]);

  return (
    <div className="@container flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-3 @3xl:px-5">
        <div className="flex items-center gap-3">
          <Iniciales nombre={c.contacto} className="size-9 text-[12px]" />
          <div>
            <p className="text-[13.5px] font-bold">{c.nombre}</p>
            <p className="text-[12px] text-muted">{c.contacto} · {c.cargo}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-dashed border-line px-2 py-1 text-[11.5px] text-muted">
          Demo: entrar como
          <select id="portal-cliente" value={cid} onChange={(e) => { setCid(e.target.value); setTab("resumen"); }}
            className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[12px] font-semibold text-ink">
            {PORTAL_CLIENTES.map((id) => <option key={id} value={id}>{s.clientes.find((x) => x.id === id).nombre}</option>)}
          </select>
        </label>
      </div>
      <Tabs etiqueta="Secciones del portal" actual={tab} onChange={setTab} items={[
        ["resumen", "Resumen", I.inicio], ["presupuestos", "Presupuestos", I.doc, pendQ.length],
        ["facturas", "Facturas", I.recibo], ["equipos", "Mis equipos", I.equipo], ["incidencias", "Incidencias", I.llave],
      ]} />

      <div className="grid gap-4 p-3 @3xl:p-5">
        {tab === "resumen" && (
          <>
            <div>
              <h3 className="text-[20px] font-bold tracking-tight">Hola, {c.contacto.split(" ")[0]}</h3>
              <p className="text-[13px] text-muted">Todo lo de {c.nombre} con Altavento, en un sitio.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
              <TarjetaResumen titulo="Presupuestos por revisar" valor={pendQ.length ? `${pendQ.length} pendiente${pendQ.length > 1 ? "s" : ""}` : "Al día"}
                texto={pendQ[0] ? pendQ[0].titulo : "No tienes presupuestos pendientes."} accion={pendQ.length ? "Revisar" : null} onAccion={() => setTab("presupuestos")} ver={ver} zoho="Zoho CRM · Quotes" />
              <TarjetaResumen titulo="Facturas pendientes" valor={pendF.length ? eur(pendF.reduce((a, f) => a + f.importe, 0)) : "Al día"}
                texto={pendF[0] ? `${pendF[0].id}, vence el ${fecha(pendF[0].vence)}` : "No tienes nada pendiente de pago."} accion={pendF.length ? "Pagar" : null} onAccion={() => setTab("facturas")} ver={ver} zoho="Zoho Books · Invoices" />
              <TarjetaResumen titulo="Próxima revisión" valor={fecha(c.revision)} texto={`${c.equipos.length} equipos incluidos en tu contrato.`} accion="Ver equipos" onAccion={() => setTab("equipos")} ver={ver} zoho="Zoho CRM · Events" />
              <TarjetaResumen titulo="Incidencias abiertas" valor={String(abiertas.length)} texto={abiertas[0] ? `#${abiertas[0].id}: ${abiertas[0].estado}` : "Ninguna abierta ahora mismo."} accion="Abrir una incidencia" onAccion={() => setTab("incidencias")} ver={ver} zoho="Zoho Desk · Tickets" />
            </div>
          </>
        )}

        {tab === "presupuestos" && (
          <div className="grid gap-3">
            {qs.map((q) => <Presupuesto key={q.id} q={q} s={s} dispatch={dispatch} ver={ver} aviso={aviso} />)}
            {!qs.length && <p className="text-[13px] text-muted">No hay presupuestos.</p>}
          </div>
        )}

        {tab === "facturas" && <Facturas fs={fs} s={s} dispatch={dispatch} ver={ver} aviso={aviso} />}

        {tab === "equipos" && (
          <Bloque titulo="Mis equipos" zoho="Módulo propio: Equipos" ver={ver}>
            <ul className="divide-y divide-line">
              {c.equipos.map(([e, r]) => (
                <li key={e} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span>
                    <span className="block text-[13.5px] font-semibold">{e}</span>
                    <span className="block text-[12px] text-muted">Última revisión: {fecha(r)} · Próxima: {fecha(c.revision)}</span>
                  </span>
                  <button onClick={() => { setEquipoPre(e); setTab("incidencias"); }} className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-accent-text hover:bg-accent-soft">
                    Avisar de un problema
                  </button>
                </li>
              ))}
            </ul>
          </Bloque>
        )}

        {tab === "incidencias" && <Incidencias c={c} ts={ts} s={s} dispatch={dispatch} ver={ver} aviso={aviso} equipoPre={equipoPre} />}
      </div>
    </div>
  );
}

const TarjetaResumen = ({ titulo, valor, texto, accion, onAccion, ver, zoho }) => (
  <div className="flex flex-col rounded-xl border border-line bg-surface p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-[12px] font-semibold text-muted">{titulo}</p>
      <ZohoTag ver={ver}>{zoho}</ZohoTag>
    </div>
    <p className="num mt-1 text-[20px] font-bold tracking-tight">{valor}</p>
    <p className="mt-0.5 flex-1 text-[12.5px] text-muted">{texto}</p>
    {accion && (
      <button onClick={onAccion} className="mt-3 self-start rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink hover:opacity-90">{accion}</button>
    )}
  </div>
);

function Presupuesto({ q, s, dispatch, ver, aviso }) {
  const [pidiendo, setPidiendo] = useState(false);
  const [nota, setNota] = useState("");
  const total = q.lineas.reduce((a, l) => a + l[1], 0);
  return (
    <Destello cambio={s.cambios[q.id]} className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11.5px] text-muted">{q.id} · {fecha(q.fecha)}</p>
          <h3 className="text-[14.5px] font-bold">{q.titulo}</h3>
        </div>
        <div className="flex items-center gap-2"><ZohoTag ver={ver}>Zoho CRM · Quotes</ZohoTag><Pill tono={tonoEstado[q.estado]}>{q.estado}</Pill></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <tbody className="divide-y divide-line">
            {q.lineas.map(([concepto, imp]) => (
              <tr key={concepto}><td className="px-4 py-2">{concepto}</td><td className="num px-4 py-2 text-right whitespace-nowrap">{eur(imp)}</td></tr>
            ))}
            <tr className="bg-surface-2"><td className="px-4 py-2 font-bold">Total <span className="font-normal text-muted">(sin IVA)</span></td><td className="num px-4 py-2 text-right font-bold whitespace-nowrap">{eur(total)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3">
        {q.estado === "Enviado" && !pidiendo && (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { dispatch({ type: "aceptar", id: q.id }); aviso("Presupuesto aceptado. Guardado en Zoho CRM"); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink hover:opacity-90"><Icono d={I.ok} />Aceptar presupuesto</button>
            <button onClick={() => setPidiendo(true)} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold hover:bg-surface-2">Pedir cambios</button>
            <span className="text-[12px] text-muted">Válido hasta el {fecha(q.valido)}</span>
          </div>
        )}
        {q.estado === "Enviado" && pidiendo && (
          <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); if (!nota.trim()) return; dispatch({ type: "cambios", id: q.id, nota: nota.trim() }); aviso("Petición enviada. Guardada en Zoho CRM"); setPidiendo(false); }}>
            <label htmlFor={`nota-${q.id}`} className="text-[12.5px] font-semibold">¿Qué quieres cambiar?</label>
            <textarea id={`nota-${q.id}`} rows="2" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Por ejemplo: ¿podéis hacer la instalación en dos fases?"
              className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px]" />
            <div className="flex gap-2">
              <button className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink disabled:opacity-40" disabled={!nota.trim()}>Enviar</button>
              <button type="button" onClick={() => setPidiendo(false)} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold">Cancelar</button>
            </div>
          </form>
        )}
        {q.estado === "Aceptado" && <p className="text-[13px] text-ok">Aceptado el {fecha(q.aceptado)}. Te llamaremos para fijar la fecha de instalación.</p>}
        {q.estado === "Cambios pedidos" && <p className="text-[13px] text-accent-text">Has pedido cambios: «{q.nota}». Te enviaremos una versión nueva.</p>}
      </div>
    </Destello>
  );
}

function Facturas({ fs, s, dispatch, ver, aviso }) {
  const [pagando, setPagando] = useState(null);
  return (
    <Bloque titulo="Facturas" zoho="Zoho Books · Invoices" ver={ver}>
      <ul className="divide-y divide-line">
        {fs.map((f) => (
          <li key={f.id}>
            <Destello cambio={s.cambios[f.id]} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block font-mono text-[11.5px] text-muted">{f.id}</span>
                  <span className="block text-[13.5px] font-semibold">{f.concepto}</span>
                  <span className="block text-[12px] text-muted">{f.estado === "Pagada" ? `Pagada el ${fecha(f.pagada)}` : `Vence el ${fecha(f.vence)}`}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="num text-[14px] font-bold">{eur(f.importe)}</span>
                  {f.estado === "Pendiente" && pagando !== f.id
                    ? <button onClick={() => setPagando(f.id)} className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink hover:opacity-90">Pagar</button>
                    : <Pill tono={tonoEstado[f.estado]}>{f.estado}</Pill>}
                </span>
              </div>
              {pagando === f.id && f.estado === "Pendiente" && (
                <div className="entra mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 p-3">
                  <span className="flex-1 text-[12.5px] text-muted">Pago con tarjeta. En la demo no se cobra nada.</span>
                  <button onClick={() => { dispatch({ type: "pagar", id: f.id }); setPagando(null); aviso("Pago registrado en Zoho Books"); }}
                    className="rounded-lg bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink">Confirmar pago de {eur(f.importe)}</button>
                  <button onClick={() => setPagando(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold">Cancelar</button>
                </div>
              )}
            </Destello>
          </li>
        ))}
      </ul>
    </Bloque>
  );
}

function Incidencias({ c, ts, s, dispatch, ver, aviso, equipoPre }) {
  const [equipo, setEquipo] = useState(equipoPre || c.equipos[0][0]);
  const [prioridad, setPrioridad] = useState("Media");
  const [texto, setTexto] = useState("");
  useEffect(() => { setEquipo(equipoPre || c.equipos[0][0]); }, [c.id, equipoPre]);
  const enviar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    dispatch({ type: "incidencia", cliente: c.id, equipo, prioridad, texto: texto.trim() });
    aviso("Incidencia creada en Zoho Desk");
    setTexto("");
  };
  return (
    <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Bloque titulo="Abrir una incidencia" zoho="Zoho Desk · POST" ver={ver}>
        <form onSubmit={enviar} className="grid gap-3 p-4">
          <label className="grid gap-1 text-[12.5px] font-semibold" htmlFor="inc-equipo">Equipo
            <select id="inc-equipo" value={equipo} onChange={(e) => setEquipo(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-normal">
              {c.equipos.map(([e]) => <option key={e}>{e}</option>)}
            </select>
          </label>
          <fieldset className="grid gap-1">
            <legend className="text-[12.5px] font-semibold">Urgencia</legend>
            <div className="flex flex-wrap gap-2">
              {["Baja", "Media", "Alta"].map((p) => (
                <label key={p} className={cx("cursor-pointer rounded-lg border px-3 py-1 text-[12.5px] font-semibold", prioridad === p ? "border-accent bg-accent-soft text-accent-text" : "border-line text-muted")}>
                  <input type="radio" name="prioridad" value={p} checked={prioridad === p} onChange={() => setPrioridad(p)} className="sr-only" />{p}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1 text-[12.5px] font-semibold" htmlFor="inc-texto">¿Qué pasa?
            <textarea id="inc-texto" rows="3" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Por ejemplo: hace ruido al arrancar por la mañana."
              className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-normal" />
          </label>
          <button disabled={!texto.trim()} className="justify-self-start rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink disabled:opacity-40">Enviar incidencia</button>
        </form>
      </Bloque>
      <Bloque titulo="Mis incidencias" zoho="Zoho Desk · Tickets" ver={ver}>
        <ul className="divide-y divide-line">
          {ts.map((t) => (
            <li key={t.id}>
              <Destello cambio={s.cambios[`t${t.id}`]} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold"><span className="font-mono font-normal text-muted">#{t.id}</span> {t.equipo}</span>
                  <Pill tono={tonoEstado[t.estado]}>{t.estado}</Pill>
                </div>
                <p className="mt-0.5 text-[12.5px] text-muted">{t.texto}</p>
              </Destello>
            </li>
          ))}
          {!ts.length && <li className="px-4 py-3 text-[12.5px] text-muted">No has abierto ninguna incidencia.</li>}
        </ul>
      </Bloque>
    </div>
  );
}

/* ------------------------------------------------------------ marco de la demo */

const METODO = { GET: "bg-accent-soft text-accent-text", POST: "bg-ok-soft text-ok", PUT: "bg-warn-soft text-warn", PATCH: "bg-warn-soft text-warn" };
const DOMINIO = { CRM: "www.zohoapis.eu/", Books: "www.zohoapis.eu/", Desk: "desk.zoho.eu/" };

function RegistroZoho({ log }) {
  return (
    <section aria-label="Llamadas a Zoho" className="entra rounded-xl border border-dashed border-zoho/50 bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="flex items-center gap-2 text-[14px] font-bold"><Icono d={I.db} className="size-4 text-zoho" />Zoho por detrás</h2>
        <p className="text-[12px] text-muted">Cada pantalla lee y escribe en Zoho por su API. Centro de datos de la UE. Llamadas simuladas.</p>
      </header>
      <ol className="max-h-64 divide-y divide-line overflow-y-auto font-mono text-[11.5px]">
        {log.map((l) => (
          <li key={l.id} className="entra grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-0.5 px-4 py-1.5">
            <span className="num text-muted">{l.hora}</span>
            <span className={cx("rounded px-1.5 font-semibold", METODO[l.metodo])}>{l.metodo}</span>
            <span className="min-w-0 break-all"><span className="text-muted">{DOMINIO[l.app]}</span>{l.ruta}{l.cuerpo && <span className="block text-muted">{l.cuerpo}</span>}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Panel({ titulo, chip, children }) {
  return (
    <section className="@container flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_18px_50px_-24px_rgba(7,17,31,.35)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-3 py-2.5 @3xl:px-5">
        <span className="flex items-center gap-2"><LogoAltavento /><span className="text-[13px] font-semibold text-muted">{titulo}</span></span>
        <Pill tono="neutro">{chip}</Pill>
      </header>
      {children}
    </section>
  );
}

function App() {
  const [s, dispatch] = useReducer(reducer, undefined, estadoInicial);
  const ancho = typeof window !== "undefined" ? window.innerWidth : 1400;
  const [vista, setVista] = useState(ancho >= 1280 ? "ambos" : "portal");
  const [ver, setVer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [, tick] = useState(0);

  // Quita el destello cuando termina, para que el siguiente cambio vuelva a verse
  useEffect(() => { const t = setTimeout(() => tick((n) => n + 1), 3100); return () => clearTimeout(t); }, [s.cambios]);

  const aviso = (texto) => {
    const id = Date.now() + Math.random();
    setToasts((l) => [...l, { id, texto }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 2600);
  };
  const toggleZoho = () => { setVer((v) => !v); if (!ver) dispatch({ type: "reto", clave: "zoho" }); };
  const hechos = RETOS.filter(([k]) => s.retos[k]).length;

  const opciones = [["crm", "CRM del equipo"], ["portal", "Portal del cliente"], ["ambos", "Los dos"]];

  return (
    <div className="min-h-full">
      <header className="bg-frame text-frame-ink">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <a href="https://integracioncrm.com/" className="text-[15px] font-bold tracking-tight">Integración<span className="text-mint">CRM</span></a>
            <span className="rounded-full border border-frame-muted/40 px-2 py-0.5 text-[11px] font-semibold text-frame-muted">Demo</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Qué ver" className="flex rounded-lg bg-white/8 p-0.5">
              {opciones.map(([id, t]) => (
                <button key={id} role="radio" aria-checked={vista === id} onClick={() => setVista(id)}
                  className={cx("rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold", id === "ambos" && "hidden xl:block",
                    vista === id ? "bg-mint text-frame" : "text-frame-muted hover:text-frame-ink")}>{t}</button>
              ))}
            </div>
            <button role="switch" aria-checked={ver} onClick={toggleZoho}
              className={cx("inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold",
                ver ? "border-mint bg-mint/15 text-mint" : "border-frame-muted/40 text-frame-muted hover:text-frame-ink")}>
              <Icono d={I.db} />Ver Zoho por detrás
            </button>
            <button onClick={() => dispatch({ type: "reiniciar" })} aria-label="Reiniciar la demo"
              className="grid size-8 place-items-center rounded-lg border border-frame-muted/40 text-frame-muted hover:text-frame-ink"><Icono d={I.reinicio} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-[62ch]">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">Un CRM y un portal de clientes a medida, con Zoho como base de datos</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">
              El equipo de Altavento trabaja en su CRM; sus clientes, en su portal. Las dos pantallas leen y escriben los mismos datos en Zoho, así que lo que hace el cliente aparece al momento en el CRM.
              Altavento Climatización y todos los datos son ficticios.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="flex items-center justify-between gap-4 text-[12px] font-bold">Pruébalo <span className="num font-semibold text-muted">{hechos} de {RETOS.length}</span></p>
            <ol className="mt-1.5 grid gap-1">
              {RETOS.map(([k, t]) => (
                <li key={k} className={cx("flex items-center gap-2 text-[12.5px]", s.retos[k] ? "text-mint-text" : "text-muted")}>
                  <span className={cx("grid size-4 place-items-center rounded-full border", s.retos[k] ? "border-mint-text bg-mint-soft" : "border-line")}>
                    {s.retos[k] && <Icono d={I.ok} className="size-3" />}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {ver && <RegistroZoho log={s.log} />}

        <div className={cx("grid gap-4", vista === "ambos" && "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]")}>
          {(vista === "crm" || vista === "ambos") && (
            <Panel titulo="CRM del equipo" chip="Uso interno"><CRM s={s} dispatch={dispatch} ver={ver} aviso={aviso} /></Panel>
          )}
          {(vista === "portal" || vista === "ambos") && (
            <Panel titulo="Área de clientes" chip="Lo ve el cliente"><Portal s={s} dispatch={dispatch} ver={ver} aviso={aviso} /></Panel>
          )}
        </div>

        <p className="pb-2 text-center text-[12px] text-muted">
          Demo de IntegraciónCRM. Empresa, personas y datos ficticios.{" "}
          <a href="https://integracioncrm.com/crm-a-medida/" className="font-semibold text-accent-text hover:underline">Cómo lo hacemos a medida →</a>
        </p>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
        {toasts.map((t) => (
          <div key={t.id} className="entra flex items-center gap-2 rounded-lg bg-frame px-3.5 py-2 text-[12.5px] font-semibold text-frame-ink shadow-lg">
            <Icono d={I.ok} className="size-4 text-mint" />{t.texto}
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
