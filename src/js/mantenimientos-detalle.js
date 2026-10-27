import { api } from "./api.js";
import {
  formatearMoneda,
  formatearFechaHora,
  badgeEstado,
  badgeEstadoPago,
  ESTADOS,
} from "./mantenimientos-utils.js";
import {
  bloquearScroll,
  desbloquearScroll,
  alertaExito,
  alertaError,
  confirmar,
} from "./ui.js";
import {
  mostrarMensajeFormulario,
  limpiarMensajesFormulario,
} from "./mensajes.js";
import { inicializarFechas, bindBotonesFechaHoy } from "./fechas.js";
import {
  inicializarDropdown,
  renderRepuestoItem,
} from "./mantenimientos-busqueda.js";

let mantenimientoActual = null;
let repuestosCache = [];
let dropdownRepuestoEdit = null;
let dropdownEstado = null;

let estadoEdit = {
  repuestos: [],
};

// ═══════════════════════════════════════════════════
// IMAGENES EN PANTALLA COMPLETA (LIGHTBOX)
// ═══════════════════════════════════════════════════
let lightbox = null;
let lightboxImagenes = [];
let lightboxIndex = 0;

const crearLightbox = () => {
  if (document.getElementById("lightbox-mant")) return;

  const div = document.createElement("div");
  div.id = "lightbox-mant";
  div.className =
    "fixed inset-0 z-[9999] hidden items-center justify-center bg-black/95";
  div.innerHTML = `
    <button id="lightbox-cerrar" class="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>

    <button id="lightbox-prev" class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>

    <button id="lightbox-next" class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-colors">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>

    <img id="lightbox-img" src="" alt="" class="max-w-[90vw] max-h-[90vh] object-contain">

    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
      <span id="lightbox-counter">1 / 1</span>
    </div>
  `;
  document.body.appendChild(div);
  lightbox = div;

  div
    .querySelector("#lightbox-cerrar")
    .addEventListener("click", cerrarLightbox);
  div
    .querySelector("#lightbox-prev")
    .addEventListener("click", () => navegarLightbox(-1));
  div
    .querySelector("#lightbox-next")
    .addEventListener("click", () => navegarLightbox(1));

  document.addEventListener("keydown", (e) => {
    if (!lightbox || lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") cerrarLightbox();
    if (e.key === "ArrowLeft") navegarLightbox(-1);
    if (e.key === "ArrowRight") navegarLightbox(1);
  });
};

const abrirLightbox = (imagenes, index) => {
  crearLightbox();
  lightboxImagenes = imagenes;
  lightboxIndex = index;
  actualizarLightbox();

  lightbox.classList.remove("hidden");
  lightbox.classList.add("flex");
  bloquearScroll();
};

const cerrarLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.add("hidden");
  lightbox.classList.remove("flex");
  desbloquearScroll();
};

const navegarLightbox = (direccion) => {
  if (lightboxImagenes.length <= 1) return;
  lightboxIndex =
    (lightboxIndex + direccion + lightboxImagenes.length) %
    lightboxImagenes.length;
  actualizarLightbox();
};

const actualizarLightbox = () => {
  const img = lightboxImagenes[lightboxIndex];
  lightbox.querySelector("#lightbox-img").src = img.url;
  lightbox.querySelector("#lightbox-counter").textContent =
    `${lightboxIndex + 1} / ${lightboxImagenes.length}`;
};

// ═══════════════════════════════════════════════════
// MODAL DETALLE
// ═══════════════════════════════════════════════════
let modalDetalle;
let detalleContenido;

export const inicializarModalDetalle = () => {
  let existente = document.getElementById("modal-detalle-mant");
  if (existente) existente.remove();

  const modal = document.createElement("div");
  modal.id = "modal-detalle-mant";
  modal.className =
    "fixed inset-0 z-[500] hidden items-center justify-center p-4 bg-black/70 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="w-full max-w-3xl bg-ink-soft border border-ink-border rounded-2xl max-h-[95vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-ink-border shrink-0">
        <div class="min-w-0">
          <h2 id="detalle-mant-titulo" class="text-lg font-bold truncate">Detalle del mantenimiento</h2>
          <p id="detalle-mant-subtitulo" class="text-xs text-zinc-500 truncate">-</p>
        </div>
        <div id="detalle-mant-header-actions" class="flex items-center gap-2 shrink-0"></div>
      </div>
      <div id="detalle-mant-contenido" class="flex-1 overflow-y-auto px-6 py-5"></div>
      <div class="px-6 py-4 border-t border-ink-border flex gap-3 shrink-0">
        <button type="button" id="btn-cerrar-detalle-mant" class="flex-1 bg-transparent border border-ink-border hover:border-brand text-white font-semibold py-3 rounded-lg transition-all">
          Cerrar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modalDetalle = modal;
  detalleContenido = modal.querySelector("#detalle-mant-contenido");

  modal
    .querySelector("#btn-cerrar-detalle-mant")
    .addEventListener("click", cerrarDetalle);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarDetalle();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      cerrarDetalle();
    }
  });
};

export const abrirDetalle = async (id) => {
  detalleContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;
  bloquearScroll();
  modalDetalle.classList.remove("hidden");
  modalDetalle.classList.add("flex");

  try {
    const data = await api.obtenerMantenimiento(id);
    mantenimientoActual = data.mantenimiento;
    renderDetalle();
  } catch (error) {
    console.error("Error al cargar:", error);
    detalleContenido.innerHTML = `<p class="text-red-400 text-center py-8 text-sm">Error al cargar</p>`;
  }
};

const renderDetalle = () => {
  const m = mantenimientoActual;
  const moto = m.motoId;
  const cliente = moto?.clienteId;

  document.getElementById("detalle-mant-titulo").textContent =
    `Mantenimiento ${moto?.placa || ""}`;
  document.getElementById("detalle-mant-subtitulo").textContent =
    `${moto?.marca || ""} ${moto?.modelo || ""} - ${cliente?.nombre || "Sin cliente"}`;

  // Header actions
  const headerActions = document.getElementById("detalle-mant-header-actions");
  headerActions.innerHTML = m.bloqueado
    ? `
      <span class="inline-flex items-center gap-1.5 text-zinc-500 text-xs font-medium bg-zinc-500/10 px-3 py-2 rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Bloqueado
      </span>
    `
    : `
      <button id="btn-editar-mant" class="bg-brand/10 hover:bg-brand/20 text-brand text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Editar
      </button>
      <button id="btn-eliminar-mant" class="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    `;

  if (!m.bloqueado) {
    headerActions
      .querySelector("#btn-editar-mant")
      .addEventListener("click", () => {
        cerrarDetalle();
        setTimeout(
          () => abrirModalEditarMantenimiento(mantenimientoActual),
          150,
        );
      });
    headerActions
      .querySelector("#btn-eliminar-mant")
      .addEventListener("click", eliminarMantenimiento);
  }

  // Contenido
  detalleContenido.innerHTML = `
    <div class="space-y-5">

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-ink border border-ink-border rounded-lg p-3">
          <p class="text-xs text-zinc-500 mb-1">Estado</p>
          ${badgeEstado(m.estado)}
        </div>
        <div class="bg-ink border border-ink-border rounded-lg p-3">
          <p class="text-xs text-zinc-500 mb-1">Pago</p>
          ${badgeEstadoPago(m.estadoPago)}
        </div>
        <div class="bg-ink border border-ink-border rounded-lg p-3">
          <p class="text-xs text-zinc-500 mb-1">Kilometraje</p>
          <p class="text-sm font-medium">${m.kilometraje?.toLocaleString("es-CO") || 0} km</p>
        </div>
        <div class="bg-ink border border-ink-border rounded-lg p-3">
          <p class="text-xs text-zinc-500 mb-1">Mecanico</p>
          <p class="text-sm font-medium truncate">${m.mecanicoId?.nombre || "-"}</p>
        </div>
      </div>

      <div class="bg-ink border border-ink-border rounded-lg p-4">
        <h3 class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Cliente y moto</h3>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Placa</p>
            <p class="font-mono text-brand">${moto?.placa || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Moto</p>
            <p>${moto?.marca || ""} ${moto?.modelo || ""}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Cliente</p>
            <p>${cliente?.nombre || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Telefono</p>
            <p>${cliente?.telefono || "-"}</p>
          </div>
        </div>
      </div>

      <div class="bg-ink border border-ink-border rounded-lg p-4">
        <h3 class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Fechas</h3>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Ingreso</p>
            <p>${formatearFechaHora(m.fechaIngreso)}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Promesa</p>
            <p>${m.fechaPromesa ? formatearFechaHora(m.fechaPromesa) : "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 mb-0.5">Entrega</p>
            <p>${m.fechaEntrega ? formatearFechaHora(m.fechaEntrega) : "-"}</p>
          </div>
        </div>
      </div>

      ${
        m.motivoIngreso ||
        m.diagnostico ||
        m.observaciones ||
        m.recomendacionesProxima
          ? `
        <div class="bg-ink border border-ink-border rounded-lg p-4 space-y-3">
          <h3 class="text-xs text-zinc-500 uppercase tracking-wider">Descripciones</h3>
          ${m.motivoIngreso ? `<div><p class="text-xs text-zinc-500 mb-0.5">Motivo</p><p class="text-sm text-zinc-300">${m.motivoIngreso}</p></div>` : ""}
          ${m.diagnostico ? `<div><p class="text-xs text-zinc-500 mb-0.5">Diagnostico</p><p class="text-sm text-zinc-300">${m.diagnostico}</p></div>` : ""}
          ${m.observaciones ? `<div><p class="text-xs text-zinc-500 mb-0.5">Observaciones</p><p class="text-sm text-zinc-300">${m.observaciones}</p></div>` : ""}
          ${m.recomendacionesProxima ? `<div><p class="text-xs text-zinc-500 mb-0.5">Recomendaciones</p><p class="text-sm text-zinc-300">${m.recomendacionesProxima}</p></div>` : ""}
        </div>
      `
          : ""
      }

      <!-- Repuestos (solo si hay) -->
      ${
        m.repuestosUtilizados?.length > 0
          ? `
        <div class="bg-ink border border-ink-border rounded-lg p-4">
          <h3 class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Repuestos utilizados (${m.repuestosUtilizados.length})</h3>
          <div class="space-y-2">
            ${m.repuestosUtilizados
              .map(
                (r) => `
              <div class="flex items-center justify-between text-sm py-2 border-b border-ink-border last:border-0">
                <div>
                  <p>${r.nombre}</p>
                  <p class="text-xs text-zinc-500">${r.cantidad} x ${formatearMoneda(r.precioUnitario)}</p>
                </div>
                <span class="text-brand font-medium">${formatearMoneda(r.subtotal)}</span>
              </div>
            `,
              )
              .join("")}
            <div class="flex justify-between pt-2 text-sm font-bold">
              <span>Subtotal repuestos:</span>
              <span class="text-brand">${formatearMoneda(m.subtotalRepuestos)}</span>
            </div>
          </div>
        </div>
      `
          : ""
      }

      <!-- Economia -->
      <div class="bg-ink border border-brand/30 rounded-lg p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-zinc-500">Valor del mantenimiento:</span>
          <span>${formatearMoneda(m.valorMantenimiento || 0)}</span>
        </div>
        ${
          m.subtotalRepuestos > 0
            ? `
          <div class="flex justify-between">
            <span class="text-zinc-500">Subtotal repuestos:</span>
            <span>${formatearMoneda(m.subtotalRepuestos)}</span>
          </div>
        `
            : ""
        }
        <div class="flex justify-between pt-2 border-t border-ink-border font-bold text-base">
          <span>Total:</span>
          <span class="text-brand">${formatearMoneda(m.costoTotal)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Anticipo:</span>
          <span>${formatearMoneda(m.anticipo)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">Saldo pendiente:</span>
          <span class="${m.saldoPendiente > 0 ? "text-red-500 font-bold" : "text-brand"}">${formatearMoneda(m.saldoPendiente)}</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-ink-border text-xs">
          <span class="text-zinc-500">Comision del mecanico (50%):</span>
          <span class="text-yellow-500">${formatearMoneda(m.pagoMecanico)}</span>
        </div>
      </div>

      <!-- Imagenes -->
      ${
        m.imagenes?.length > 0
          ? `
        <div class="bg-ink border border-ink-border rounded-lg p-4">
          <h3 class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Imagenes (${m.imagenes.length})</h3>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            ${m.imagenes
              .map(
                (img, idx) => `
              <div class="relative group cursor-pointer btn-abrir-img" data-idx="${idx}">
                <img src="${img.url}" class="w-full h-24 object-cover rounded-lg border border-ink-border hover:opacity-80 transition-opacity">
                <span class="absolute top-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white uppercase">
                  ${img.momento}
                </span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      ${
        m.historialEstados?.length > 0
          ? `
        <div class="bg-ink border border-ink-border rounded-lg p-4">
          <h3 class="text-xs text-zinc-500 uppercase tracking-wider mb-3">Historial de estados</h3>
          <div class="space-y-2">
            ${m.historialEstados
              .map(
                (h) => `
              <div class="flex items-start gap-3 text-sm">
                <div class="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-white">${h.estado}</p>
                  <p class="text-xs text-zinc-500">${formatearFechaHora(h.fecha)}</p>
                  ${h.nota ? `<p class="text-xs text-zinc-400 mt-0.5">${h.nota}</p>` : ""}
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

    </div>
  `;

  // Bind de imágenes → lightbox
  detalleContenido.querySelectorAll(".btn-abrir-img").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.idx);
      abrirLightbox(m.imagenes, idx);
    });
  });
};

const cerrarDetalle = () => {
  modalDetalle.classList.add("hidden");
  modalDetalle.classList.remove("flex");
  desbloquearScroll();
};

// ═══════════════════════════════════════════════════
// ELIMINAR
// ═══════════════════════════════════════════════════
const eliminarMantenimiento = async () => {
  const confirmado = await confirmar(
    "Eliminar mantenimiento",
    "Se eliminara este mantenimiento, se devolveran los repuestos al stock y se borraran las imagenes. Esta accion no se puede deshacer.",
    "Si, eliminar",
  );

  if (!confirmado) return;

  try {
    await api.eliminarMantenimiento(mantenimientoActual._id);
    cerrarDetalle();
    alertaExito("Eliminado", "El mantenimiento se elimino correctamente");
    if (window.recargarTablaMantenimientos)
      window.recargarTablaMantenimientos();
  } catch (error) {
    alertaError("Error", error.message);
  }
};

// ═══════════════════════════════════════════════════
// MODAL EDITAR
// ═══════════════════════════════════════════════════
let modalEditar;
let formEditar;

export const inicializarModalEditar = () => {
  let existente = document.getElementById("modal-editar-mant");
  if (existente) existente.remove();

  const modal = document.createElement("div");
  modal.id = "modal-editar-mant";
  modal.className =
    "fixed inset-0 z-[500] hidden items-center justify-center p-4 bg-black/70 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="w-full max-w-3xl bg-ink-soft border border-ink-border rounded-2xl max-h-[95vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-ink-border shrink-0">
        <h2 class="text-lg font-bold">Editar mantenimiento</h2>
      </div>

      <form id="form-editar-mant" class="flex-1 overflow-y-auto px-6 py-5" novalidate>

        <section class="mb-6">
          <h3 class="text-sm font-bold text-brand mb-3">Estado y datos generales</h3>

          <div class="mb-4">
            <label class="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Estado del mantenimiento</label>
            <div class="relative" data-dropdown-estado-edit>
              <button type="button" class="estado-dropdown-toggle w-full bg-ink border border-ink-border rounded-lg px-4 py-3 text-sm text-white flex items-center justify-between gap-2 hover:border-brand transition-all">
                <span class="estado-dropdown-label text-zinc-500">Seleccionar estado...</span>
                <svg class="w-4 h-4 shrink-0 text-zinc-500 estado-dropdown-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <input type="hidden" id="edit-mant-estado">
              <div class="estado-dropdown-menu hidden absolute z-50 mt-1.5 w-full bg-ink-soft border border-ink-border rounded-lg shadow-2xl py-1.5">
                ${ESTADOS.map(
                  (e) => `
                  <button type="button" class="opcion-estado-edit w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors" data-value="${e.value}">${e.label}</button>
                `,
                ).join("")}
              </div>
            </div>
          </div>

          <!-- Valor del mantenimiento (solo si entregado) -->
          <div id="edit-valor-container" class="field mb-4 hidden">
            <input type="text" id="edit-mant-valor" placeholder=" " inputmode="numeric">
            <label for="edit-mant-valor">Valor del mantenimiento</label>
          </div>

          <!-- Estado de pago -->
          <div class="mb-4">
            <label class="flex items-center gap-3 cursor-pointer bg-ink border border-ink-border rounded-lg p-3 hover:border-brand transition-colors">
              <input type="checkbox" id="edit-mant-pagado" class="w-5 h-5 accent-brand">
              <div>
                <p class="text-sm text-white font-medium">Marcar como pagado</p>
                <p class="text-xs text-zinc-500">El cliente ya pago el total</p>
              </div>
            </label>
          </div>

          <div class="field mb-4">
            <input type="text" id="edit-mant-kilometraje" placeholder=" " inputmode="numeric">
            <label for="edit-mant-kilometraje">Kilometraje</label>
          </div>

          <div class="field mb-4">
            <input type="text" id="edit-mant-fecha-promesa" placeholder=" " class="input-fecha">
            <label for="edit-mant-fecha-promesa">Fecha promesa</label>
            <button type="button" class="btn-fecha-hoy field-icon" data-target="edit-mant-fecha-promesa">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke-width="2"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>
              </svg>
            </button>
          </div>

          <div class="field mb-4">
            <textarea id="edit-mant-motivo" placeholder=" " rows="2"></textarea>
            <label for="edit-mant-motivo">Motivo de ingreso</label>
          </div>

          <div class="field mb-4">
            <textarea id="edit-mant-diagnostico" placeholder=" " rows="2"></textarea>
            <label for="edit-mant-diagnostico">Diagnostico</label>
          </div>

          <div class="field mb-4">
            <textarea id="edit-mant-observaciones" placeholder=" " rows="2"></textarea>
            <label for="edit-mant-observaciones">Observaciones</label>
          </div>

          <div class="field mb-4">
            <textarea id="edit-mant-recomendaciones" placeholder=" " rows="2"></textarea>
            <label for="edit-mant-recomendaciones">Recomendaciones para la proxima revision</label>
          </div>
        </section>

        <section class="mb-6">
          <h3 class="text-sm font-bold text-brand mb-3">Repuestos utilizados</h3>
          <div id="edit-lista-repuestos" class="space-y-2 mb-3"></div>
          <div class="relative" data-dropdown-repuesto-edit>
            <button type="button" class="repuesto-edit-dropdown-toggle w-full bg-ink border border-dashed border-ink-border rounded-lg px-4 py-3 text-sm text-zinc-500 flex items-center justify-center gap-2 hover:border-brand hover:text-brand transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Agregar repuesto
            </button>
            <div class="repuesto-edit-dropdown-menu hidden absolute z-50 mt-1.5 w-full bg-ink-soft border border-ink-border rounded-lg shadow-2xl py-1.5 max-h-64 overflow-y-auto">
              <div class="px-3 pb-2 pt-1 sticky top-0 bg-ink-soft border-b border-ink-border">
                <input type="text" class="repuesto-edit-dropdown-search w-full bg-ink border border-ink-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-brand transition-all" placeholder="Buscar por referencia o nombre...">
              </div>
              <div class="repuesto-edit-dropdown-list"></div>
            </div>
          </div>
        </section>

        <div id="edit-resumen" class="bg-ink border border-brand/30 rounded-lg p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-zinc-500">Valor del mantenimiento:</span>
            <span id="edit-subtotal-serv" class="font-medium">$0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Subtotal repuestos:</span>
            <span id="edit-subtotal-rep" class="font-medium">$0</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-ink-border font-bold">
            <span>Total:</span>
            <span id="edit-total" class="text-brand">$0</span>
          </div>
        </div>

      </form>

      <div class="px-6 py-4 border-t border-ink-border flex gap-3 shrink-0">
        <button type="button" id="btn-cancelar-editar-mant" class="flex-1 bg-transparent border border-ink-border hover:border-brand text-white font-semibold py-3 rounded-lg transition-all">
          Cancelar
        </button>
        <button type="submit" form="form-editar-mant" id="btn-guardar-editar-mant" class="flex-1 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-all">
          Guardar cambios
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modalEditar = modal;
  formEditar = modal.querySelector("#form-editar-mant");

  modal
    .querySelector("#btn-cancelar-editar-mant")
    .addEventListener("click", cerrarEditar);
  modal
    .querySelector("#btn-guardar-editar-mant")
    .addEventListener("click", manejarGuardarEditar);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarEditar();
  });

  inicializarFechas(formEditar);
  bindBotonesFechaHoy(formEditar);

  formEditar.querySelectorAll(".field input, .field textarea").forEach((el) => {
    const sync = () => {
      if (el.value) el.setAttribute("data-has-value", "true");
      else el.removeAttribute("data-has-value");
    };
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
  });
};

export const abrirModalEditarMantenimiento = async (m) => {
  if (repuestosCache.length === 0) {
    try {
      const r = await api.listarRepuestos({ limit: 500, activo: "true" });
      repuestosCache = r.repuestos || [];
    } catch (e) {
      console.error(e);
    }
  }

  estadoEdit = {
    repuestos: [...(m.repuestosUtilizados || [])],
    valorMantenimiento: m.valorMantenimiento || 0,
  };

  formEditar.reset();
  document.getElementById("edit-mant-kilometraje").value =
    m.kilometraje?.toLocaleString("es-CO") || "";
  document.getElementById("edit-mant-motivo").value = m.motivoIngreso || "";
  document.getElementById("edit-mant-diagnostico").value = m.diagnostico || "";
  document.getElementById("edit-mant-observaciones").value =
    m.observaciones || "";
  document.getElementById("edit-mant-recomendaciones").value =
    m.recomendacionesProxima || "";
  document.getElementById("edit-mant-valor").value = (
    m.valorMantenimiento || 0
  ).toLocaleString("es-CO");
  document.getElementById("edit-mant-pagado").checked =
    m.estadoPago === "Pagado";

  if (m.fechaPromesa) {
    const fecha = new Date(m.fechaPromesa);
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    document.getElementById("edit-mant-fecha-promesa").value =
      `${yyyy}-${mm}-${dd}`;
  }

  // Dropdown estado
  const wrapperEstado = document.querySelector("[data-dropdown-estado-edit]");
  const toggleEstado = wrapperEstado.querySelector(".estado-dropdown-toggle");
  const menuEstado = wrapperEstado.querySelector(".estado-dropdown-menu");
  const labelEstado = wrapperEstado.querySelector(".estado-dropdown-label");
  const chevronEstado = wrapperEstado.querySelector(".estado-dropdown-chevron");
  const inputEstado = document.getElementById("edit-mant-estado");

  inputEstado.value = m.estado;
  labelEstado.textContent = m.estado;
  labelEstado.classList.remove("text-zinc-500");

  toggleEstado.onclick = (e) => {
    e.stopPropagation();
    menuEstado.classList.toggle("hidden");
    chevronEstado.classList.toggle("rotate-180");
  };

  wrapperEstado.querySelectorAll(".opcion-estado-edit").forEach((btn) => {
    btn.onclick = () => {
      inputEstado.value = btn.dataset.value;
      labelEstado.textContent = btn.dataset.value;
      menuEstado.classList.add("hidden");
      chevronEstado.classList.remove("rotate-180");

      // Mostrar el campo valor solo si esta entregado
      const valorContainer = document.getElementById("edit-valor-container");
      if (btn.dataset.value === "Entregado") {
        valorContainer.classList.remove("hidden");
      } else {
        valorContainer.classList.add("hidden");
      }
    };
  });

  // Mostrar valor si ya esta entregado
  const valorContainer = document.getElementById("edit-valor-container");
  if (m.estado === "Entregado") {
    valorContainer.classList.remove("hidden");
  } else {
    valorContainer.classList.add("hidden");
  }

  // Formatear valor
  const inputValor = document.getElementById("edit-mant-valor");
  inputValor.oninput = (e) => {
    const valor = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
    e.target.value = valor ? valor.toLocaleString("es-CO") : "";
    estadoEdit.valorMantenimiento = valor;
    actualizarResumenEdit();
  };

  // Dropdown repuesto
  const wrapperRep = document.querySelector("[data-dropdown-repuesto-edit]");
  dropdownRepuestoEdit = inicializarDropdown({
    wrapper: wrapperRep,
    items: repuestosCache,
    placeholder: "Agregar repuesto",
    renderItem: renderRepuestoItem,
    onSeleccionar: (repuesto) => {
      if (estadoEdit.repuestos.find((r) => r.repuestoId === repuesto._id)) {
        alertaError("Ya agregado", "Este repuesto ya esta en la lista");
        return;
      }
      if (repuesto.stock <= 0) {
        alertaError("Sin stock", "Este repuesto no tiene stock disponible");
        return;
      }
      estadoEdit.repuestos.push({
        repuestoId: repuesto._id,
        nombre: repuesto.nombre,
        referencia: repuesto.referencia,
        cantidad: 1,
        precioUnitario: repuesto.precioVenta,
        subtotal: repuesto.precioVenta,
        stockDisponible: repuesto.stock,
      });
      renderRepuestosEdit();
      actualizarResumenEdit();
    },
  });

  renderRepuestosEdit();
  actualizarResumenEdit();

  formEditar.querySelectorAll(".field input, .field textarea").forEach((el) => {
    if (el.value) el.setAttribute("data-has-value", "true");
    else el.removeAttribute("data-has-value");
  });

  const inputKm = document.getElementById("edit-mant-kilometraje");
  inputKm.oninput = (e) => {
    const valor = e.target.value.replace(/\D/g, "");
    e.target.value = valor ? parseInt(valor, 10).toLocaleString("es-CO") : "";
  };

  bloquearScroll();
  modalEditar.classList.remove("hidden");
  modalEditar.classList.add("flex");

  window.__mantEditando = m;
};

const cerrarEditar = () => {
  modalEditar.classList.add("hidden");
  modalEditar.classList.remove("flex");
  desbloquearScroll();
  window.__mantEditando = null;
};

const renderRepuestosEdit = () => {
  const contenedor = document.getElementById("edit-lista-repuestos");
  if (estadoEdit.repuestos.length === 0) {
    contenedor.innerHTML = "";
    return;
  }
  contenedor.innerHTML = estadoEdit.repuestos
    .map(
      (r, i) => `
    <div class="bg-ink border border-ink-border rounded-lg p-3">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="min-w-0 flex-1">
          <p class="font-mono text-xs text-brand">${r.referencia || ""}</p>
          <p class="text-sm text-white">${r.nombre}</p>
        </div>
        <button type="button" class="btn-quitar-rep-edit text-red-500 hover:text-red-400 p-1 shrink-0" data-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div>
          <label class="block text-zinc-500 mb-1">Cantidad</label>
          <input type="text" value="${r.cantidad}" data-index="${i}" class="input-cant-rep-edit w-full bg-ink-soft border border-ink-border rounded px-2 py-1 text-sm text-white text-center focus:border-brand">
        </div>
        <div>
          <label class="block text-zinc-500 mb-1">Precio unit.</label>
          <input type="text" value="${(r.precioUnitario || 0).toLocaleString("es-CO")}" data-index="${i}" class="input-precio-rep-edit w-full bg-ink-soft border border-ink-border rounded px-2 py-1 text-sm text-brand text-right focus:border-brand">
        </div>
        <div>
          <label class="block text-zinc-500 mb-1">Subtotal</label>
          <p class="text-sm text-brand font-medium text-right pt-1">${formatearMoneda(r.subtotal)}</p>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  contenedor.querySelectorAll(".btn-quitar-rep-edit").forEach((btn) => {
    btn.onclick = () => {
      estadoEdit.repuestos.splice(parseInt(btn.dataset.index), 1);
      renderRepuestosEdit();
      actualizarResumenEdit();
    };
  });

  contenedor.querySelectorAll(".input-cant-rep-edit").forEach((input) => {
    input.oninput = (e) => {
      const cant = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
      const index = parseInt(input.dataset.index);
      const r = estadoEdit.repuestos[index];
      if (cant > r.stockDisponible) {
        e.target.value = r.stockDisponible;
        r.cantidad = r.stockDisponible;
      } else {
        r.cantidad = cant;
      }
      r.subtotal = r.cantidad * r.precioUnitario;
      renderRepuestosEdit();
      actualizarResumenEdit();
    };
  });

  contenedor.querySelectorAll(".input-precio-rep-edit").forEach((input) => {
    input.oninput = (e) => {
      const valor = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
      e.target.value = valor ? valor.toLocaleString("es-CO") : "";
      const index = parseInt(input.dataset.index);
      const r = estadoEdit.repuestos[index];
      r.precioUnitario = valor;
      r.subtotal = r.cantidad * valor;
      renderRepuestosEdit();
      actualizarResumenEdit();
    };
  });
};

// ═══════════════════════════════════════════════════
// CALCULO DE TOTALES CON IVA Y DESCUENTO
// ═══════════════════════════════════════════════════
const IVA = 0.19;
const DESCUENTO = 0.05;

const actualizarResumenEdit = () => {
  // Subtotal repuestos (sin IVA)
  const subtotalRepuestosBruto = estadoEdit.repuestos.reduce(
    (acc, r) => acc + (r.subtotal || 0),
    0,
  );
  // IVA sobre repuestos
  const ivaRepuestos = subtotalRepuestosBruto * IVA;
  // Subtotal con IVA
  const subtotalRepuestosConIva = subtotalRepuestosBruto + ivaRepuestos;
  // Descuento sobre repuestos
  const descuentoRepuestos = subtotalRepuestosConIva * DESCUENTO;
  // Subtotal repuestos final (con IVA y descuento)
  const subtotalRepuestosFinal = subtotalRepuestosConIva - descuentoRepuestos;

  const valorMant = estadoEdit.valorMantenimiento || 0;
  const total = valorMant + subtotalRepuestosFinal;

  document.getElementById("edit-subtotal-serv").textContent =
    formatearMoneda(valorMant);
  document.getElementById("edit-subtotal-rep").textContent = formatearMoneda(
    subtotalRepuestosFinal,
  );
  document.getElementById("edit-total").textContent = formatearMoneda(total);
};

// ═══════════════════════════════════════════════════
// GUARDAR EDICION
// ═══════════════════════════════════════════════════
const manejarGuardarEditar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formEditar);

  const m = window.__mantEditando;
  if (!m) return;

  const estadoNuevo = document.getElementById("edit-mant-estado").value;
  const km =
    parseInt(
      document.getElementById("edit-mant-kilometraje").value.replace(/\D/g, ""),
      10,
    ) || 0;
  const pagado = document.getElementById("edit-mant-pagado").checked;
  const valor =
    parseInt(
      document.getElementById("edit-mant-valor").value.replace(/\D/g, ""),
      10,
    ) || 0;

  const datos = {
    kilometraje: km,
    motivoIngreso:
      document.getElementById("edit-mant-motivo").value.trim() || null,
    diagnostico:
      document.getElementById("edit-mant-diagnostico").value.trim() || null,
    observaciones:
      document.getElementById("edit-mant-observaciones").value.trim() || null,
    recomendacionesProxima:
      document.getElementById("edit-mant-recomendaciones").value.trim() || null,
    fechaPromesa:
      document.getElementById("edit-mant-fecha-promesa").value || null,
    estado: estadoNuevo,
    valorMantenimiento: valor,
    estadoPago: pagado ? "Pagado" : m.estadoPago || "Pendiente",
    repuestosUtilizados: estadoEdit.repuestos.map((r) => ({
      repuestoId: r.repuestoId,
      nombre: r.nombre,
      cantidad: r.cantidad,
      precioUnitario: r.precioUnitario,
      subtotal: r.subtotal,
    })),
  };

  const btn = document.getElementById("btn-guardar-editar-mant");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    await api.actualizarMantenimientoCompleto(m._id, datos);
    cerrarEditar();
    alertaExito("Actualizado", "El mantenimiento se actualizo correctamente");
    if (window.recargarTablaMantenimientos)
      window.recargarTablaMantenimientos();
  } catch (error) {
    mostrarMensajeFormulario(
      formEditar,
      error.message || "Error al guardar",
      "error",
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar cambios";
  }
};
