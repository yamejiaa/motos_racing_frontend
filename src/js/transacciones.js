// src/js/transacciones.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";
import { crearTabla } from "./tabla.js";
import { bloquearScroll, desbloquearScroll } from "./ui.js";

// ─── Query param ──────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const tipoQuery = urlParams.get("tipo");
const esIngreso = tipoQuery === "ingreso";
const esEgreso = tipoQuery === "egreso";

// ─── Layout ───────────────────────────────────────
await construirLayout({
  titulo: esIngreso ? "Ingresos" : esEgreso ? "Egresos" : "Transacciones",
  subtitulo: "Historial de movimientos financieros",
  itemActivo: "finanzas",
});

// ─── Referencias ──────────────────────────────────
const contenido = document.getElementById("contenido-transacciones");
const loader = document.getElementById("loader-transacciones");
const modalDetalles = document.getElementById("modal-detalles");
const btnCerrarDetalles = document.getElementById("btn-cerrar-detalles");
const detallesContenido = document.getElementById("detalles-contenido");

loader.classList.add("hidden");
contenido.classList.remove("hidden");

// ─── Constantes ───────────────────────────────────
const LABELS_CATEGORIA = {
  pago_cliente: "Pago de cliente",
  otro_ingreso: "Otro ingreso",
  compra_repuestos: "Compra de repuestos",
  pago_mecanico: "Pago a mecánico",
  gasto_operativo: "Gasto operativo",
  otro_egreso: "Otro egreso",
};

const CATEGORIAS_INGRESO = ["pago_cliente", "otro_ingreso"];
const CATEGORIAS_EGRESO = [
  "compra_repuestos",
  "pago_mecanico",
  "gasto_operativo",
  "otro_egreso",
];

const METODOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Nequi",
  "Daviplata",
  "Tarjeta",
  "Otro",
];

// ─── Formato ──────────────────────────────────────
const formatMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);

const formatFecha = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatFechaHora = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Columnas ─────────────────────────────────────
const columnas = [
  {
    key: "fecha",
    label: "Fecha",
    render: (t) =>
      `<span class="text-zinc-400 text-sm">${formatFecha(t.fecha)}</span>`,
  },
  {
    key: "categoria",
    label: "Categoría",
    render: (t) =>
      `<span class="font-medium text-white">${LABELS_CATEGORIA[t.categoria] || t.categoria}</span>`,
  },
  {
    key: "descripcion",
    label: "Descripción",
    render: (t) =>
      t.descripcion
        ? `<span class="text-zinc-400 text-sm">${t.descripcion}</span>`
        : '<span class="text-zinc-600">-</span>',
  },
  {
    key: "metodo",
    label: "Método",
    render: (t) =>
      `<span class="text-zinc-400 text-sm">${t.metodo || "-"}</span>`,
  },
  {
    key: "monto",
    label: "Monto",
    render: (t) => {
      const color = t.tipo === "ingreso" ? "text-brand" : "text-red-500";
      const signo = t.tipo === "ingreso" ? "+" : "-";
      return `<span class="font-bold ${color}">${signo} ${formatMoneda(t.monto)}</span>`;
    },
  },
  {
    key: "acciones",
    label: "Acciones",
    class: "text-right",
    render: (t) => `
    <div class="flex items-center justify-end gap-2">
      <button
        class="btn-detalles p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        data-id="${t._id}"
        title="Ver detalles"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      </button>
      <button class="btn-eliminar p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" data-id="${t._id}" title="Eliminar">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  `,
  },
];

// ─── Filtros ──────────────────────────────────────
const filtros = [
  {
    id: "categoria",
    label: "Categoría",
    opciones: [
      { value: "", label: "Todas" },
      ...(esIngreso || (!esIngreso && !esEgreso)
        ? CATEGORIAS_INGRESO.map((c) => ({
            value: c,
            label: LABELS_CATEGORIA[c],
          }))
        : []),
      ...(esEgreso || (!esIngreso && !esEgreso)
        ? CATEGORIAS_EGRESO.map((c) => ({
            value: c,
            label: LABELS_CATEGORIA[c],
          }))
        : []),
    ],
  },
  {
    id: "metodo",
    label: "Método",
    opciones: [
      { value: "", label: "Todos" },
      ...METODOS_PAGO.map((m) => ({ value: m, label: m })),
    ],
  },
];

// ─── Crear tabla ──────────────────────────────────
const tabla = crearTabla({
  contenedor: contenido,
  columnas,
  filtros,
  placeholder: "Buscar por referencia o descripción...",
  labelBuscador: "Buscar transacción",
  mensajeVacio: "No hay transacciones registradas.",
  cargar: async ({ page, limit, search, categoria, metodo }) => {
    const params = { page, limit };
    if (esIngreso) params.tipo = "ingreso";
    if (esEgreso) params.tipo = "egreso";
    if (categoria) params.categoria = categoria;
    if (metodo) params.metodo = metodo;

    const res = await api.listarTransacciones(params);
    let data = res.transacciones || [];

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (t) =>
          (t.referencia || "").toLowerCase().includes(s) ||
          (t.descripcion || "").toLowerCase().includes(s),
      );
    }

    return { total: res.total, data };
  },
});

// ─── Delegación de eventos ────────────────────────
contenido.addEventListener("click", (e) => {
  const btnDetalles = e.target.closest(".btn-detalles");
  if (btnDetalles) {
    e.stopPropagation();
    abrirDetalles(btnDetalles.dataset.id);
    return;
  }

  const btnEliminar = e.target.closest(".btn-eliminar");
  if (btnEliminar) {
    e.stopPropagation();
    confirmarEliminar(btnEliminar.dataset.id);
  }
});

// ─── Abrir detalles ───────────────────────────────
const abrirDetalles = async (id) => {
  modalDetalles.classList.remove("hidden");
  bloquearScroll();

  detallesContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;

  try {
    const res = await api.obtenerTransaccion(id);
    const t = res.transaccion;

    if (!t) throw new Error("Transacción no encontrada");

    const esIngresoT = t.tipo === "ingreso";
    const colorMonto = esIngresoT ? "text-brand" : "text-red-500";
    const signo = esIngresoT ? "+" : "-";
    const labelCategoria = LABELS_CATEGORIA[t.categoria] || t.categoria;

    const mecanico = t.mecanicoId?.nombre || null;
    const proveedor = t.proveedorId?.nombre || null;
    const registradoPor = t.registradoPor?.nombre || "Sistema";

    // ─── Cargar trabajos asociados si es pago_mecanico ───
    let trabajosAsociados = [];
    if (t.categoria === "pago_mecanico" && t.mecanicoId?._id) {
      try {
        // Traer TODOS los trabajos (pendientes + pagados) del mecánico
        // y filtrar por los que tienen fechaPagoMecanico cercana a la fecha de esta transacción
        const [mantRes, diariosRes] = await Promise.all([
          api.listarMantenimientos({
            mecanicoId: t.mecanicoId._id,
            limit: 100,
          }),
          api.listarServiciosDiarios({
            mecanicoId: t.mecanicoId._id,
            limit: 100,
          }),
        ]);

        const fechaTransaccion = new Date(t.fecha).getTime();
        const margenMs = 5 * 60 * 1000; // 5 minutos de margen

        const mantenimientosPagados = (mantRes.mantenimientos || [])
          .filter(
            (m) =>
              m.pagadoAlMecanico &&
              m.fechaPagoMecanico &&
              Math.abs(
                new Date(m.fechaPagoMecanico).getTime() - fechaTransaccion,
              ) < margenMs,
          )
          .map((m) => ({
            tipo: "mantenimiento",
            _id: m._id,
            descripcion: m.motoId
              ? `${m.motoId.placa || "Sin placa"} - ${m.motoId.marca || ""} ${m.motoId.modelo || ""}`
              : "Moto eliminada",
            fecha: m.fechaIngreso,
            servicios: m.serviciosRealizados || [],
            repuestos: m.repuestosUtilizados || [],
            subtotalServicios: m.subtotalServicios || 0,
            subtotalRepuestos: m.subtotalRepuestos || 0,
            costoTotal: m.costoTotal || 0,
            comision: m.pagoMecanico || 0,
            estado: m.estado,
          }));

        const serviciosDiariosPagados = (
          diariosRes.serviciosDiarios ||
          diariosRes.servicios ||
          []
        )
          .filter(
            (s) =>
              s.pagadoAlMecanico &&
              s.fechaPagoMecanico &&
              Math.abs(
                new Date(s.fechaPagoMecanico).getTime() - fechaTransaccion,
              ) < margenMs,
          )
          .map((s) => ({
            tipo: "servicio_diario",
            _id: s._id,
            descripcion: s.nombreServicio,
            fecha: s.fecha,
            precioServicio: s.precioServicio || 0,
            comisionMecanico: s.comisionMecanico || 0,
            comisionTaller: s.comisionTaller || 0,
          }));

        trabajosAsociados = [
          ...mantenimientosPagados,
          ...serviciosDiariosPagados,
        ];
      } catch (err) {
        console.warn("No se pudieron cargar los trabajos asociados:", err);
      }
    }

    // ─── Render ────────────────────────────────────
    const bloqueMantenimiento = t.mantenimientoId
      ? `
        <div class="flex justify-between items-start gap-4">
          <span class="text-zinc-500 text-sm shrink-0">Mantenimiento</span>
          <span class="text-white text-sm text-right font-mono text-xs">${t.mantenimientoId}</span>
        </div>
      `
      : "";

    const bloqueItems =
      t.items && t.items.length > 0
        ? `
        <div class="pt-4 border-t border-ink-border mt-4">
          <h4 class="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">Ítems de la venta</h4>
          <div class="space-y-2">
            ${t.items
              .map(
                (item) => `
                <div class="bg-ink border border-ink-border rounded-lg p-3">
                  <div class="flex justify-between items-start gap-3 mb-1">
                    <span class="text-sm font-medium text-white">${item.nombre || "Ítem"}</span>
                    <span class="text-sm font-bold text-brand shrink-0">${formatMoneda(item.subtotal)}</span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-zinc-500">
                    ${item.referencia ? `<span>Ref: ${item.referencia}</span>` : ""}
                    <span>${item.cantidad} × ${formatMoneda(item.precioUnitario)}</span>
                  </div>
                </div>
              `,
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    const bloqueTotalesVenta = `
      ${
        t.subtotal !== null && t.subtotal !== undefined
          ? `<div class="flex justify-between items-center"><span class="text-zinc-500 text-sm">Subtotal</span><span class="text-white text-sm">${formatMoneda(t.subtotal)}</span></div>`
          : ""
      }
      ${
        t.iva !== null && t.iva !== undefined
          ? `<div class="flex justify-between items-center"><span class="text-zinc-500 text-sm">IVA</span><span class="text-white text-sm">${formatMoneda(t.iva)}</span></div>`
          : ""
      }
      ${
        t.descuento !== null && t.descuento !== undefined
          ? `<div class="flex justify-between items-center"><span class="text-zinc-500 text-sm">Descuento</span><span class="text-white text-sm">-${formatMoneda(t.descuento)}</span></div>`
          : ""
      }
      ${
        t.numeroRecibo
          ? `<div class="flex justify-between items-center"><span class="text-zinc-500 text-sm">N° Recibo</span><span class="text-white text-sm font-mono">${t.numeroRecibo}</span></div>`
          : ""
      }
    `;

    const bloqueReverso = t.reversada
      ? `
        <div class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-xs font-semibold text-red-500 mb-1">⚠ Transacción reversada</p>
          ${t.motivoReverso ? `<p class="text-xs text-zinc-400">Motivo: ${t.motivoReverso}</p>` : ""}
          ${t.fechaReverso ? `<p class="text-xs text-zinc-500 mt-1">Fecha: ${formatFechaHora(t.fechaReverso)}</p>` : ""}
        </div>
      `
      : "";

    // ─── Bloque de trabajos asociados (solo pago_mecanico) ───
    let bloqueTrabajos = "";

    if (t.categoria === "pago_mecanico") {
      if (trabajosAsociados.length > 0) {
        const totalComision = trabajosAsociados.reduce(
          (acc, w) => acc + (w.comision || w.comisionMecanico || 0),
          0,
        );

        bloqueTrabajos = `
          <div class="pt-4 border-t border-ink-border mt-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Trabajos pagados (${trabajosAsociados.length})
              </h4>
              <span class="text-xs font-bold text-brand">${formatMoneda(totalComision)}</span>
            </div>
            <div class="space-y-3">
              ${trabajosAsociados
                .map((w) => {
                  if (w.tipo === "mantenimiento") {
                    return `
                      <div class="bg-ink border border-ink-border rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded-full font-medium uppercase tracking-wide">
                            Mantenimiento
                          </span>
                          <span class="text-xs text-zinc-500">${formatFecha(w.fecha)}</span>
                        </div>
                        <p class="text-sm font-medium text-white mb-2">${w.descripcion}</p>
                        ${
                          w.servicios.length > 0
                            ? `
                              <div class="space-y-1 mb-2">
                                <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Servicios realizados</p>
                                ${w.servicios
                                  .map(
                                    (s) => `
                                    <div class="flex justify-between text-xs">
                                      <span class="text-zinc-300">• ${s.nombre}</span>
                                      <span class="text-zinc-500">${formatMoneda(s.precio)}</span>
                                    </div>
                                  `,
                                  )
                                  .join("")}
                              </div>
                            `
                            : ""
                        }
                        ${
                          w.repuestos.length > 0
                            ? `
                              <div class="space-y-1 mb-2">
                                <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Repuestos</p>
                                ${w.repuestos
                                  .map(
                                    (r) => `
                                    <div class="flex justify-between text-xs">
                                      <span class="text-zinc-300">• ${r.nombre} ×${r.cantidad}</span>
                                      <span class="text-zinc-500">${formatMoneda(r.subtotal)}</span>
                                    </div>
                                  `,
                                  )
                                  .join("")}
                              </div>
                            `
                            : ""
                        }
                        <div class="flex justify-between items-center pt-2 border-t border-ink-border mt-2">
                          <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Comisión mecánico</span>
                          <span class="text-sm font-bold text-brand">${formatMoneda(w.comision)}</span>
                        </div>
                      </div>
                    `;
                  } else {
                    return `
                      <div class="bg-ink border border-ink-border rounded-lg p-3">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="px-2 py-0.5 text-[10px] bg-green-500/10 text-green-400 rounded-full font-medium uppercase tracking-wide">
                            Servicio diario
                          </span>
                          <span class="text-xs text-zinc-500">${formatFecha(w.fecha)}</span>
                        </div>
                        <p class="text-sm font-medium text-white mb-2">${w.descripcion}</p>
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-zinc-500">Precio servicio</span>
                          <span class="text-zinc-300">${formatMoneda(w.precioServicio)}</span>
                        </div>
                        <div class="flex justify-between text-xs mb-2">
                          <span class="text-zinc-500">Comisión taller</span>
                          <span class="text-zinc-300">${formatMoneda(w.comisionTaller)}</span>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-ink-border mt-2">
                          <span class="text-[10px] text-zinc-500 uppercase tracking-wider">Comisión mecánico</span>
                          <span class="text-sm font-bold text-brand">${formatMoneda(w.comisionMecanico)}</span>
                        </div>
                      </div>
                    `;
                  }
                })
                .join("")}
            </div>
          </div>
        `;
      } else {
        bloqueTrabajos = `
          <div class="pt-4 border-t border-ink-border mt-4">
            <div class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p class="text-xs text-yellow-400">
                No se pudieron cargar los trabajos asociados. Verifica que los mantenimientos y servicios diarios tengan registrada la fecha de pago.
              </p>
            </div>
          </div>
        `;
      }
    }

    detallesContenido.innerHTML = `
      <div class="space-y-4">
        <!-- Monto destacado -->
        <div class="bg-ink border border-ink-border rounded-xl p-5 text-center">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Monto</p>
          <p class="text-3xl font-bold ${colorMonto}">${signo} ${formatMoneda(t.monto)}</p>
          <span class="inline-flex items-center gap-1.5 mt-2 text-xs ${esIngresoT ? "text-brand" : "text-red-500"}">
            <span class="w-1.5 h-1.5 rounded-full ${esIngresoT ? "bg-brand" : "bg-red-500"}"></span>
            ${esIngresoT ? "Ingreso" : "Egreso"}
          </span>
        </div>

        <!-- Detalles generales -->
        <div class="space-y-3">
          <div class="flex justify-between items-start gap-4">
            <span class="text-zinc-500 text-sm shrink-0">Fecha</span>
            <span class="text-white text-sm text-right">${formatFechaHora(t.fecha)}</span>
          </div>
          <div class="flex justify-between items-start gap-4">
            <span class="text-zinc-500 text-sm shrink-0">Categoría</span>
            <span class="text-white text-sm text-right">${labelCategoria}</span>
          </div>
          <div class="flex justify-between items-start gap-4">
            <span class="text-zinc-500 text-sm shrink-0">Método de pago</span>
            <span class="text-white text-sm text-right">${t.metodo || "-"}</span>
          </div>
          ${
            t.referencia
              ? `<div class="flex justify-between items-start gap-4">
                  <span class="text-zinc-500 text-sm shrink-0">Referencia</span>
                  <span class="text-white text-sm text-right font-mono">${t.referencia}</span>
                </div>`
              : ""
          }
          ${
            t.descripcion
              ? `<div class="flex justify-between items-start gap-4">
                  <span class="text-zinc-500 text-sm shrink-0">Descripción</span>
                  <span class="text-white text-sm text-right">${t.descripcion}</span>
                </div>`
              : ""
          }
        </div>

        <!-- Relaciones -->
        ${
          mecanico ||
          proveedor ||
          t.mantenimientoId ||
          bloqueTotalesVenta.trim()
            ? `
          <div class="pt-4 border-t border-ink-border space-y-3">
            <h4 class="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Información adicional</h4>
            ${
              mecanico
                ? `<div class="flex justify-between items-start gap-4">
                    <span class="text-zinc-500 text-sm shrink-0">Mecánico</span>
                    <span class="text-white text-sm text-right">${mecanico}</span>
                  </div>`
                : ""
            }
            ${
              proveedor
                ? `<div class="flex justify-between items-start gap-4">
                    <span class="text-zinc-500 text-sm shrink-0">Proveedor</span>
                    <span class="text-white text-sm text-right">${proveedor}</span>
                  </div>`
                : ""
            }
            ${bloqueMantenimiento}
            ${bloqueTotalesVenta}
          </div>
        `
            : ""
        }

        ${bloqueTrabajos}
        ${bloqueItems}

        <!-- Registrado por -->
        <div class="pt-4 border-t border-ink-border flex justify-between items-center">
          <span class="text-zinc-500 text-xs">Registrado por</span>
          <span class="text-zinc-400 text-xs">${registradoPor}</span>
        </div>

        ${bloqueReverso}
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar detalles:", error);
    detallesContenido.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-400 text-sm mb-1">Error al cargar los detalles</p>
        <p class="text-zinc-500 text-xs">${error.message || ""}</p>
      </div>
    `;
  }
};

// ─── Cerrar modal detalles ────────────────────────
const cerrarDetalles = () => {
  modalDetalles.classList.add("hidden");
  desbloquearScroll();
};

btnCerrarDetalles.addEventListener("click", cerrarDetalles);
modalDetalles.addEventListener("click", (e) => {
  if (e.target === modalDetalles) cerrarDetalles();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalDetalles.classList.contains("hidden")) {
    cerrarDetalles();
  }
});

// ─── Eliminar ─────────────────────────────────────
const confirmarEliminar = async (id) => {
  const result = await window.Swal.fire({
    title: "¿Eliminar transacción?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;

  try {
    await api.eliminarTransaccion(id);
    await window.Swal.fire({
      icon: "success",
      title: "Transacción eliminada",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1500,
      showConfirmButton: false,
    });
    tabla.recargar();
  } catch (error) {
    console.error("Error al eliminar:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo eliminar",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};
