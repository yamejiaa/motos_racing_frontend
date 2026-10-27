import { api } from "./api.js";
import { crearTabla } from "./tabla.js";
import {
  formatearMoneda,
  formatearFecha,
  badgeEstado,
  badgeEstadoPago,
  ESTADOS,
} from "./mantenimientos-utils.js";
import {
  inicializarModalCrear,
  abrirModalCrearMantenimiento,
} from "./mantenimientos-crear.js";
import {
  inicializarModalDetalle,
  inicializarModalEditar,
  abrirDetalle,
} from "./mantenimientos-detalle.js";

let tabla;

export const renderListaMantenimientos = async () => {
  // Inicializar los 3 modales
  await inicializarModalCrear();
  inicializarModalDetalle();
  inicializarModalEditar();

  // Exponer funcion global para recargar la tabla
  window.recargarTablaMantenimientos = () => tabla?.recargar();

  crearTablaMantenimientos();
};

const crearTablaMantenimientos = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-mantenimientos"),

    columnas: [
      {
        key: "fechaIngreso",
        label: "Fecha",
        render: (r) =>
          `<span class="text-zinc-300 text-xs whitespace-nowrap">${formatearFecha(r.fechaIngreso)}</span>`,
      },
      {
        key: "motoId",
        label: "Moto",
        render: (r) => {
          const placa = r.motoId?.placa || "-";
          const marca = r.motoId?.marca || "";
          const modelo = r.motoId?.modelo || "";
          return `
            <div>
              <p class="font-mono text-xs text-brand">${placa}</p>
              <p class="text-xs text-zinc-500">${marca} ${modelo}</p>
            </div>
          `;
        },
      },
      {
        key: "cliente",
        label: "Cliente",
        render: (r) => {
          const nombre = r.motoId?.clienteId?.nombre || "Sin cliente";
          return `<span class="text-zinc-300 text-sm">${nombre}</span>`;
        },
      },
      {
        key: "mecanicoId",
        label: "Mecanico",
        render: (r) =>
          `<span class="text-zinc-300 text-sm">${r.mecanicoId?.nombre || "-"}</span>`,
      },
      {
        key: "estado",
        label: "Estado",
        render: (r) => badgeEstado(r.estado),
      },
      {
        key: "estadoPago",
        label: "Pago",
        render: (r) => badgeEstadoPago(r.estadoPago),
      },
      {
        key: "costoTotal",
        label: "Total",
        render: (r) =>
          `<span class="text-brand font-medium">${formatearMoneda(r.costoTotal)}</span>`,
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <button
            class="btn-ver-mantenimiento inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            data-mantenimiento-id="${r._id}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Ver detalle
          </button>
        `,
      },
    ],

    cargar: async ({
      page,
      limit,
      search,
      estado,
      estadoPago,
      desde,
      hasta,
    }) => {
      const params = { page, limit, search };
      if (estado) params.estado = estado;
      if (estadoPago) params.estadoPago = estadoPago;
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;

      const data = await api.listarMantenimientos(params);
      return { total: data.total, data: data.mantenimientos };
    },

    filtros: [
      {
        label: "Estado",
        id: "estado",
        opciones: [
          { value: "", label: "Todos" },
          ...ESTADOS.map((e) => ({ value: e.value, label: e.label })),
        ],
      },
      {
        label: "Pago",
        id: "estadoPago",
        opciones: [
          { value: "", label: "Todos" },
          { value: "Pendiente", label: "Pendiente" },
          { value: "Abonado", label: "Abonado" },
          { value: "Pagado", label: "Pagado" },
        ],
      },
    ],

    labelBuscador: "Buscar mantenimiento",
    placeholder: "Placa, cliente o mecanico...",
    mensajeVacio:
      'Aun no hay mantenimientos registrados. Crea el primero con el boton "Nuevo mantenimiento".',
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>',
  });

  // Boton "Nuevo mantenimiento"
  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Nuevo mantenimiento
  `;
  btnNuevo.addEventListener("click", async () => {
    await abrirModalCrearMantenimiento();
  });
  tabla.acciones.appendChild(btnNuevo);

  // Delegacion de clicks en filas
  document
    .getElementById("tabla-mantenimientos")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-ver-mantenimiento");
      if (!btn) return;
      e.stopPropagation();

      await abrirDetalle(btn.dataset.mantenimientoId);
    });
};
