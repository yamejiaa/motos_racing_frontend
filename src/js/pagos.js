import { api } from "./api.js";
import { crearTabla } from "./tabla.js";
import {
  bloquearScroll,
  desbloquearScroll,
  alertaExito,
  alertaError,
  toast,
} from "./ui.js";

// ─── Formateo ─────────────────────────────────────
const formatearMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);

const formatearFecha = (fecha) => {
  if (!fecha) return '<span class="text-zinc-600">-</span>';
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Render principal ─────────────────────────────
export const renderVistaPagos = async () => {
  const contenedor = document.getElementById("pagos-contenido");

  contenedor.innerHTML = `
    <div class="space-y-4">

      <!-- Tarjetas resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div class="bg-ink-soft border border-ink-border rounded-xl p-5">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total pendiente</p>
          <p id="total-pendiente" class="text-2xl font-bold text-yellow-500">$0</p>
        </div>
        <div class="bg-ink-soft border border-ink-border rounded-xl p-5">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total pagado</p>
          <p id="total-pagado" class="text-2xl font-bold text-green-500">$0</p>
        </div>
        <div class="bg-ink-soft border border-ink-border rounded-xl p-5">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total comisiones</p>
          <p id="total-comision" class="text-2xl font-bold text-white">$0</p>
        </div>
      </div>

      <!-- Tabla -->
      <div id="tabla-pagos"></div>

    </div>
  `;

  crearTablaPagos();
};

// ─── Tabla ────────────────────────────────────────
const crearTablaPagos = () => {
  const tabla = crearTabla({
    contenedor: document.getElementById("tabla-pagos"),

    columnas: [
      {
        key: "nombre",
        label: "Mecanico",
        render: (r) => `
          <div>
            <p class="font-medium text-white">${r.nombre}</p>
            <p class="text-xs text-zinc-500">${r.email || ""}</p>
          </div>
        `,
      },
      {
        key: "totalTrabajos",
        label: "Trabajos",
        render: (r) => `<span class="text-zinc-300">${r.totalTrabajos}</span>`,
      },
      {
        key: "totalComision",
        label: "Comision total",
        render: (r) =>
          `<span class="text-zinc-300">${formatearMoneda(r.totalComision)}</span>`,
      },
      {
        key: "pagado",
        label: "Pagado",
        render: (r) =>
          `<span class="text-green-500">${formatearMoneda(r.pagado)}</span>`,
      },
      {
        key: "pendiente",
        label: "Pendiente",
        render: (r) => {
          if (r.pendiente > 0) {
            return `<span class="font-medium text-yellow-500">${formatearMoneda(r.pendiente)}</span>`;
          }
          return `<span class="text-zinc-600">${formatearMoneda(0)}</span>`;
        },
      },
      {
        key: "ultimoPago",
        label: "Ultimo pago",
        render: (r) =>
          `<span class="text-zinc-400 text-xs">${formatearFecha(r.ultimoPago)}</span>`,
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => {
          if (r.pendiente <= 0) {
            return `<span class="text-xs text-zinc-600">Sin pendientes</span>`;
          }
          return `
            <button
              class="btn-pagar-mecanico inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              data-mecanico-id="${r._id}"
              data-mecanico-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}"
              title="Ver trabajos y pagar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Pagar
            </button>
          `;
        },
      },
    ],

    cargar: async ({ page, limit, search }) => {
      const data = await api.resumenPagosMecanicos({ search });

      document.getElementById("total-pendiente").textContent = formatearMoneda(
        data.totales.totalPendiente,
      );
      document.getElementById("total-pagado").textContent = formatearMoneda(
        data.totales.totalPagado,
      );
      document.getElementById("total-comision").textContent = formatearMoneda(
        data.totales.totalComision,
      );

      const inicio = (page - 1) * limit;
      const fin = inicio + limit;
      const datosPaginados = data.mecanicos.slice(inicio, fin);

      return { total: data.mecanicos.length, data: datosPaginados };
    },

    labelBuscador: "Buscar mecanico",
    placeholder: "Nombre o correo...",
    mensajeVacio: "No hay mecanicos registrados.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17h2m14 0h2M5 17V9a3 3 0 013-3h8a3 3 0 013 3v8M5 17h14M5 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M17 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M9 6V5a3 3 0 013-3h0a3 3 0 013 3v1"/>',
  });

  // Delegacion para el boton "Pagar"
  document
    .getElementById("tabla-pagos")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-pagar-mecanico");
      if (!btn) return;
      e.stopPropagation();

      await abrirModalPago(tabla, btn.dataset.mecanicoId);
    });
};

// ─── Modal de pago ────────────────────────────────
const abrirModalPago = async (tabla, mecanicoId) => {
  // Crear el modal si no existe
  let modal = document.getElementById("modal-pago-mecanico");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-pago-mecanico";
    modal.className =
      "fixed inset-0 z-[500] hidden items-center justify-center p-4 bg-black/70 backdrop-blur-sm";
    modal.innerHTML = `
      <div class="w-full max-w-3xl bg-ink-soft border border-ink-border rounded-2xl max-h-[90vh] flex flex-col">

                <div class="flex items-center justify-between px-6 py-4 border-b border-ink-border shrink-0">
          <div class="min-w-0">
            <h2 id="modal-pago-titulo" class="text-lg font-bold truncate">Pagar a mecanico</h2>
            <p id="modal-pago-subtitulo" class="text-xs text-zinc-500 truncate">-</p>
          </div>
        </div>

        <div id="modal-pago-contenido" class="flex-1 overflow-y-auto px-6 py-5"></div>

        <div class="px-6 py-4 border-t border-ink-border flex flex-col sm:flex-row gap-3 shrink-0">
          <div class="flex-1 flex items-center justify-between sm:justify-start gap-3 order-2 sm:order-1">
            <span class="text-xs text-zinc-500 uppercase tracking-wider">Total a pagar:</span>
            <span id="modal-pago-total" class="text-lg font-bold text-brand">$0</span>
          </div>
          <div class="flex gap-3 order-1 sm:order-2">
            <button type="button" id="btn-cancelar-pago" class="bg-transparent border border-ink-border hover:border-brand text-white font-semibold py-3 px-6 rounded-lg transition-all">
              Cancelar
            </button>
            <button type="button" id="btn-confirmar-pago" class="bg-brand hover:bg-brand-dark text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              Confirmar pago
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const titulo = modal.querySelector("#modal-pago-titulo");
  const subtitulo = modal.querySelector("#modal-pago-subtitulo");
  const contenido = modal.querySelector("#modal-pago-contenido");
  const totalEl = modal.querySelector("#modal-pago-total");
  const btnCancelar = modal.querySelector("#btn-cancelar-pago");
  const btnConfirmar = modal.querySelector("#btn-confirmar-pago");

  // Mostrar loader
  titulo.textContent = "Pagar a mecanico";
  subtitulo.textContent = "Cargando...";
  totalEl.textContent = "$0";
  contenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;

  bloquearScroll();
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  const cerrar = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    desbloquearScroll();
  };

  // Cerrar con botones y click fuerabtnCerrar.onclick = cerrar;
  btnCancelar.onclick = cerrar;
  modal.onclick = (e) => {
    if (e.target === modal) cerrar();
  };

  // Escape
  const escapeHandler = (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      cerrar();
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  try {
    const data = await api.trabajosPendientesMecanico(mecanicoId);

    if (!data.trabajos || data.trabajos.length === 0) {
      titulo.textContent = "Sin trabajos pendientes";
      subtitulo.textContent = data.mecanico?.nombre || "";
      contenido.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="text-zinc-400 text-sm font-medium mb-1">Sin pendientes</p>
          <p class="text-zinc-500 text-xs">No hay trabajos pendientes de pago.</p>
        </div>
      `;
      btnConfirmar.disabled = true;
      btnConfirmar.classList.add("opacity-50", "cursor-not-allowed");
      totalEl.textContent = formatearMoneda(0);
      return;
    }

    titulo.textContent = `Pago a ${data.mecanico.nombre}`;
    subtitulo.textContent = `${data.totalTrabajos} trabajo(s) pendiente(s)`;
    totalEl.textContent = formatearMoneda(data.totalPendiente);

    // Renderizar historial de trabajos
    contenido.innerHTML = `
      <div class="space-y-3">
                ${data.trabajos
                  .map((t) => {
                    const fecha = new Date(t.fecha).toLocaleDateString(
                      "es-CO",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    );

                    const esDiario = t.tipo === "servicio_diario";

                    return `
            <div class="bg-ink border border-ink-border rounded-xl p-4">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${esDiario ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}">
                      ${esDiario ? "Servicio diario" : "Mantenimiento"}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-white">${t.descripcion || "-"}</p>
                  <p class="text-xs text-zinc-500">${fecha}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand/10 text-brand border border-brand/30 shrink-0">
                  ${t.estado || "Completado"}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3 text-xs pt-3 border-t border-ink-border">
                <div>
                  <p class="text-zinc-500 mb-0.5">Detalle</p>
                  <p class="text-zinc-200 truncate">${t.detalle || "-"}</p>
                </div>
                <div>
                  <p class="text-zinc-500 mb-0.5">Facturado</p>
                  <p class="text-zinc-200">${formatearMoneda(t.totalFacturado)}</p>
                </div>
                <div>
                  <p class="text-zinc-500 mb-0.5">Comision</p>
                  <p class="text-brand font-medium">${formatearMoneda(t.comision)}</p>
                </div>
              </div>
            </div>
          `;
                  })
                  .join("")}
      </div>
    `;

    // Habilitar confirmacion
    btnConfirmar.disabled = false;
    btnConfirmar.classList.remove("opacity-50", "cursor-not-allowed");

    // Handler de confirmacion
    btnConfirmar.onclick = async () => {
      btnConfirmar.disabled = true;
      btnConfirmar.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Procesando...
      `;

      try {
        const result = await api.pagarMecanico(mecanicoId);

        cerrar();
        await tabla.recargar();

        alertaExito(
          "Pago registrado",
          `Se pagaron ${result.trabajosPagados || 0} trabajo(s) por un total de ${formatearMoneda(result.totalPagado || 0)}`,
        );
      } catch (error) {
        alertaError("Error al registrar el pago", error.message);
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Confirmar pago
        `;
      }
    };
  } catch (error) {
    contenido.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-400 text-sm">Error al cargar los trabajos pendientes</p>
      </div>
    `;
    btnConfirmar.disabled = true;
    btnConfirmar.classList.add("opacity-50", "cursor-not-allowed");
  }
};
