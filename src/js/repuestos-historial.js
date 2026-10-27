import { api } from "./api.js";
import { crearTabla } from "./tabla.js";
import {
  bloquearScroll,
  desbloquearScroll,
  alertaExito,
  alertaError,
  confirmar,
  toast,
} from "./ui.js";

const formatearMoneda = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

let tabla;

// Modal detalle
let modalDetalle;
let detalleContenido;
let btnCerrarDetalle;

// ─── Render principal ─────────────────────────────
export const renderHistorial = async () => {
  const contenedor = document.getElementById("historial-contenido");

  contenedor.innerHTML = `
    <div id="tabla-ventas-historial"></div>
  `;

  // Crear modal detalle dinamicamente
  crearModalDetalle();

  crearTablaHistorial();
  bindEventos();
};

// ─── Tabla ────────────────────────────────────────
const crearTablaHistorial = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-ventas-historial"),

    columnas: [
      {
        key: "numeroRecibo",
        label: "Recibo",
        render: (r) =>
          `<span class="font-mono text-xs text-brand">${r.numeroRecibo || "-"}</span>`,
      },
      {
        key: "fecha",
        label: "Fecha",
        render: (r) =>
          `<span class="text-zinc-300 text-xs whitespace-nowrap">${formatearFecha(r.fecha)}</span>`,
      },
      {
        key: "cliente",
        label: "Cliente",
        render: (r) => {
          const nombre = r.clienteInfo?.nombre || "Consumidor Final";
          const cedula = r.clienteInfo?.cedula || "";
          return `
            <div>
              <p class="text-white text-sm">${nombre}</p>
              <p class="text-xs text-zinc-500">${cedula}</p>
            </div>
          `;
        },
      },
      {
        key: "items",
        label: "Items",
        render: (r) => {
          if (!r.items || r.items.length === 0)
            return '<span class="text-zinc-600">-</span>';
          if (r.items.length === 1) {
            return `<span class="text-zinc-300 text-sm">${r.items[0].nombre}</span>`;
          }
          return `<span class="text-zinc-300 text-sm">${r.items[0].nombre} <span class="text-zinc-500">+${r.items.length - 1} mas</span></span>`;
        },
      },
      {
        key: "monto",
        label: "Total",
        render: (r) =>
          `<span class="text-brand font-medium">${formatearMoneda(r.monto)}</span>`,
      },
      {
        key: "metodoPago",
        label: "Metodo",
        render: (r) =>
          `<span class="text-zinc-400 text-xs">${r.metodoPago || r.metodo || "-"}</span>`,
      },
      {
        key: "reversada",
        label: "Estado",
        render: (r) => {
          if (r.reversada) {
            return `<span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Reversada
            </span>`;
          }
          return `<span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activa
          </span>`;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <div class="flex items-center justify-end gap-1">
            <button class="btn-ver-venta bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" title="Ver detalle">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            ${
              !r.reversada
                ? `
              <button class="btn-reversar-venta bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-recibo="${r.numeroRecibo || ""}" title="Reversar venta">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
              </button>
            `
                : ""
            }
          </div>
        `,
      },
    ],

    cargar: async ({
      page,
      limit,
      search,
      desde,
      hasta,
      metodoPago,
      reversada,
    }) => {
      const params = { page, limit, search };
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (metodoPago) params.metodo = metodoPago;
      if (reversada !== undefined && reversada !== "")
        params.reversada = reversada;

      const data = await api.historialVentas(params);
      return { total: data.total, data: data.ventas };
    },

    filtros: [
      {
        label: "Estado",
        id: "reversada",
        opciones: [
          { value: "", label: "Todas" },
          { value: "false", label: "Solo activas" },
          { value: "true", label: "Solo reversadas" },
        ],
      },
      {
        label: "Metodo",
        id: "metodoPago",
        opciones: [
          { value: "", label: "Todos" },
          { value: "Efectivo", label: "Efectivo" },
          { value: "Transferencia", label: "Transferencia" },
          { value: "Nequi", label: "Nequi" },
          { value: "Daviplata", label: "Daviplata" },
          { value: "Tarjeta", label: "Tarjeta" },
        ],
      },
    ],

    labelBuscador: "Buscar venta",
    placeholder: "Recibo, cliente, cedula, item...",
    mensajeVacio: "Aun no hay ventas registradas.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  });

  // Delegacion de clicks
  document
    .getElementById("tabla-ventas-historial")
    .addEventListener("click", async (e) => {
      const btnVer = e.target.closest(".btn-ver-venta");
      if (btnVer) {
        e.stopPropagation();
        await abrirDetalleVenta(btnVer.dataset.id);
        return;
      }

      const btnReversar = e.target.closest(".btn-reversar-venta");
      if (btnReversar) {
        e.stopPropagation();
        await reversarVenta(btnReversar.dataset.id, btnReversar.dataset.recibo);
        return;
      }
    });
};

// ─── Modal detalle dinamico ───────────────────────
const crearModalDetalle = () => {
  // Eliminar si ya existe
  const existente = document.getElementById("modal-detalle-venta");
  if (existente) existente.remove();

  const modal = document.createElement("div");
  modal.id = "modal-detalle-venta";
  modal.className =
    "fixed inset-0 z-[500] hidden items-center justify-center p-4 bg-black/70 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="w-full max-w-lg bg-ink-soft border border-ink-border rounded-2xl max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-ink-border shrink-0">
        <h2 class="text-lg font-bold">Detalle de la venta</h2>
      </div>
      <div id="detalle-venta-contenido" class="flex-1 overflow-y-auto px-6 py-5"></div>
      <div class="px-6 py-4 border-t border-ink-border flex gap-3 shrink-0">
        <button type="button" id="btn-cerrar-detalle-venta" class="flex-1 bg-transparent border border-ink-border hover:border-brand text-white font-semibold py-3 rounded-lg transition-all">
          Cerrar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modalDetalle = modal;
  detalleContenido = modal.querySelector("#detalle-venta-contenido");
  btnCerrarDetalle = modal.querySelector("#btn-cerrar-detalle-venta");

  btnCerrarDetalle.addEventListener("click", cerrarDetalle);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarDetalle();
  });
};

const abrirDetalleVenta = async (id) => {
  detalleContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;
  bloquearScroll();
  modalDetalle.classList.remove("hidden");
  modalDetalle.classList.add("flex");

  try {
    // Obtener la venta desde el listado (ya la tenemos cacheada en la tabla)
    // Pero como no tenemos un endpoint especifico, usamos el listado general
    const data = await api.historialVentas({ limit: 1, search: id });
    // El endpoint no soporta busqueda por ID directo, pero como la tabla tiene el objeto,
    // podemos usar el _id en el search para encontrar la venta. Si falla, mostramos error.

    // Mejor: accedemos a los datos locales de la tabla (que ya tiene los objetos)
    // Buscamos la venta por su _id en los datos cargados
    // Usamos el objeto completo que ya tenemos en memoria
    const venta = document.querySelector(`.btn-ver-venta[data-id="${id}"]`)
      ? null
      : null;

    // Solucion robusta: buscamos en la tabla actual
    const ventaEncontrada = tabla.estado.data.find((v) => v._id === id);

    if (!ventaEncontrada) {
      detalleContenido.innerHTML = `<p class="text-red-400 text-sm text-center py-8">No se encontro la venta</p>`;
      return;
    }

    const v = ventaEncontrada;
    const items = v.items || [];

    detalleContenido.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Recibo</p>
            <p class="text-sm font-mono text-brand">${v.numeroRecibo || "-"}</p>
          </div>
          ${
            v.reversada
              ? `<span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium bg-red-500/10 px-3 py-1 rounded-lg">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Reversada
              </span>`
              : `<span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium bg-green-500/10 px-3 py-1 rounded-lg">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activa
              </span>`
          }
        </div>

        <div>
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fecha</p>
          <p class="text-sm">${formatearFecha(v.fecha)}</p>
        </div>

        <div class="pt-4 border-t border-ink-border">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Cliente</p>
          <p class="text-sm text-white font-medium">${v.clienteInfo?.nombre || "Consumidor Final"}</p>
          <p class="text-xs text-zinc-500">CC/NIT: ${v.clienteInfo?.cedula || "-"}</p>
          ${v.clienteInfo?.telefono ? `<p class="text-xs text-zinc-500">Tel: ${v.clienteInfo.telefono}</p>` : ""}
          ${v.clienteInfo?.email ? `<p class="text-xs text-zinc-500">Email: ${v.clienteInfo.email}</p>` : ""}
        </div>

        <div class="pt-4 border-t border-ink-border">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Items</p>
          <div class="space-y-2">
            ${items
              .map(
                (it) => `
              <div class="bg-ink border border-ink-border rounded-lg p-3">
                <p class="text-sm text-white font-medium">${it.nombre}</p>
                <div class="flex items-center justify-between mt-1 text-xs text-zinc-500">
                  <span>Ref: ${it.referencia || "-"}</span>
                  <span>${it.cantidad} x ${formatearMoneda(it.precioUnitario)} = <span class="text-brand">${formatearMoneda(it.subtotal)}</span></span>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        <div class="pt-4 border-t border-ink-border space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-zinc-500">Subtotal:</span>
            <span class="text-white">${formatearMoneda(v.subtotal || 0)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">IVA (19%):</span>
            <span class="text-white">${formatearMoneda(v.iva || 0)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Descuento (5%):</span>
            <span class="text-yellow-500">-${formatearMoneda(v.descuento || 0)}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-ink-border">
            <span class="text-white font-bold">TOTAL:</span>
            <span class="text-brand font-bold text-lg">${formatearMoneda(v.monto)}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-ink-border">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Metodo de pago</p>
          <p class="text-sm">${v.metodoPago || v.metodo || "-"}</p>
        </div>

        ${
          v.registradoPor
            ? `
          <div class="pt-4 border-t border-ink-border">
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Registrado por</p>
            <p class="text-sm text-zinc-300">${v.registradoPor.nombre || "-"}</p>
          </div>
        `
            : ""
        }

        ${
          v.reversada
            ? `
          <div class="pt-4 border-t border-ink-border bg-red-500/5 rounded-lg p-3">
            <p class="text-xs text-red-400 uppercase tracking-wider mb-1">Motivo del reverso</p>
            <p class="text-sm text-red-300">${v.motivoReverso || "Sin motivo"}</p>
            ${v.fechaReverso ? `<p class="text-xs text-red-400 mt-1">${formatearFecha(v.fechaReverso)}</p>` : ""}
          </div>
        `
            : ""
        }
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar detalle:", error);
    detalleContenido.innerHTML = `<p class="text-red-400 text-sm text-center py-8">Error al cargar</p>`;
  }
};

const cerrarDetalle = () => {
  modalDetalle.classList.add("hidden");
  modalDetalle.classList.remove("flex");
  desbloquearScroll();
};

// ─── Reversar venta ──────────────────────────────
const reversarVenta = async (id, recibo) => {
  const confirmado = await confirmar(
    "Reversar venta",
    `¿Estas seguro de reversar la venta ${recibo || ""}? Se devolvera el stock y el dinero al cliente. Los repuestos electricos y de lubricacion NO se pueden reversar.`,
    "Si, reversar",
  );
  if (!confirmado) return;

  // Pedir motivo
  const { value: motivo } = await window.Swal.fire({
    title: "Motivo del reverso",
    input: "textarea",
    inputPlaceholder: "Describe el motivo del reverso...",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Reversar",
    cancelButtonText: "Cancelar",
    inputValidator: (value) => {
      if (!value || value.trim().length < 3) {
        return "Debes describir el motivo (minimo 3 caracteres)";
      }
    },
  });

  if (!motivo) return;

  try {
    const data = await api.reversarVenta(id, motivo);
    await tabla.recargar();
    alertaExito("Reverso exitoso", data.msg);
  } catch (error) {
    alertaError("Error al reversar", error.message);
  }
};

// ─── Eventos ─────────────────────────────────────
const bindEventos = () => {
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      modalDetalle &&
      !modalDetalle.classList.contains("hidden")
    ) {
      cerrarDetalle();
    }
  });
};
