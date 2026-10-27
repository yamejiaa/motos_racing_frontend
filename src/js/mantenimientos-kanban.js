import { api } from "./api.js";
import {
  formatearMoneda,
  formatearFecha,
  ESTADOS,
} from "./mantenimientos-utils.js";

let mantenimientosCache = [];
let onCambioEstado = null;

// ─── Render principal ─────────────────────────────
export const renderKanbanMantenimientos = async () => {
  const contenedor = document.getElementById("kanban-contenido");

  contenedor.innerHTML = `
    <div id="kanban-header" class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <input type="text" id="kanban-buscador"
          class="bg-ink-soft border border-ink-border rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-brand transition-all w-64"
          placeholder="Buscar por placa o cliente...">
      </div>
      <button id="btn-kanban-refresh"
        class="bg-ink-soft border border-ink-border hover:border-brand text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Actualizar
      </button>
    </div>

    <div id="kanban-board" class="grid grid-cols-1 lg:grid-cols-5 gap-3 overflow-x-auto">
      <!-- Columnas se generan dinamicamente -->
    </div>
  `;

  await cargarMantenimientos();
  bindEventos();
};

// ─── Cargar datos ─────────────────────────────────
const cargarMantenimientos = async () => {
  const board = document.getElementById("kanban-board");
  board.innerHTML = `
    <div class="col-span-5 flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;

  try {
    const data = await api.listarMantenimientos({ limit: 100 });
    mantenimientosCache = data.mantenimientos || [];
    renderBoard();
  } catch (error) {
    console.error("Error al cargar:", error);
    board.innerHTML = `
      <div class="col-span-5 text-center py-12">
        <p class="text-red-400 text-sm">Error al cargar los mantenimientos</p>
      </div>
    `;
  }
};

// ─── Render del board ─────────────────────────────
const renderBoard = () => {
  const board = document.getElementById("kanban-board");
  const filtro = (document.getElementById("kanban-buscador")?.value || "")
    .trim()
    .toLowerCase();

  const filtrados = mantenimientosCache.filter((m) => {
    if (!filtro) return true;
    const placa = (m.motoId?.placa || "").toLowerCase();
    const cliente = (m.motoId?.clienteId?.nombre || "").toLowerCase();
    const mecanico = (m.mecanicoId?.nombre || "").toLowerCase();
    return (
      placa.includes(filtro) ||
      cliente.includes(filtro) ||
      mecanico.includes(filtro)
    );
  });

  board.innerHTML = ESTADOS.map((estado) => {
    const items = filtrados.filter((m) => m.estado === estado.value);
    return renderColumna(estado, items);
  }).join("");

  // Bind de eventos en las tarjetas
  bindTarjetas();
};

// ─── Render columna ───────────────────────────────
const renderColumna = (estado, items) => {
  const colores = {
    Recibido: "blue",
    "En Diagnostico": "yellow",
    "En Reparacion": "orange",
    Listo: "purple",
    Entregado: "brand",
  };
  const color = colores[estado.value] || "zinc";

  return `
    <div class="kanban-columna bg-ink-soft border border-ink-border rounded-xl p-3 min-w-[280px] flex flex-col"
         data-estado="${estado.value}">
      <div class="flex items-center justify-between mb-3 pb-3 border-b border-ink-border">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-${color}-500"></span>
          <h3 class="text-sm font-bold">${estado.label}</h3>
        </div>
        <span class="text-xs text-zinc-500 bg-ink px-2 py-0.5 rounded">${items.length}</span>
      </div>

      <div class="kanban-lista space-y-2 flex-1 min-h-[200px] overflow-y-auto max-h-[calc(100vh-260px)]"
           data-estado="${estado.value}">
        ${
          items.length === 0
            ? `<div class="text-center py-6 text-xs text-zinc-600">Sin mantenimientos</div>`
            : items.map((m) => renderTarjeta(m)).join("")
        }
      </div>
    </div>
  `;
};

// ─── Render tarjeta ───────────────────────────────
const renderTarjeta = (m) => {
  const placa = m.motoId?.placa || "-";
  const moto = `${m.motoId?.marca || ""} ${m.motoId?.modelo || ""}`.trim();
  const cliente = m.motoId?.clienteId?.nombre || "Sin cliente";
  const mecanico = m.mecanicoId?.nombre || "Sin mecanico";

  return `
    <div class="kanban-tarjeta bg-ink border border-ink-border rounded-lg p-3 cursor-move hover:border-brand/50 transition-colors"
         draggable="true"
         data-id="${m._id}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <p class="font-mono text-xs text-brand">${placa}</p>
        <span class="text-xs text-zinc-500">${formatearFecha(m.fechaIngreso)}</span>
      </div>
      <p class="text-xs text-white mb-1">${moto || "Sin modelo"}</p>
      <p class="text-xs text-zinc-400 mb-2 truncate">${cliente}</p>
      <div class="flex items-center justify-between pt-2 border-t border-ink-border">
        <p class="text-xs text-zinc-500 truncate">${mecanico}</p>
        <p class="text-xs font-medium text-brand">${formatearMoneda(m.costoTotal)}</p>
      </div>
    </div>
  `;
};

// ─── Bind eventos ─────────────────────────────────
const bindEventos = () => {
  const buscador = document.getElementById("kanban-buscador");
  const btnRefresh = document.getElementById("btn-kanban-refresh");

  buscador?.addEventListener("input", () => renderBoard());
  btnRefresh?.addEventListener("click", () => cargarMantenimientos());
};

// ─── Drag & Drop ──────────────────────────────────
let tarjetaArrastrada = null;

const bindTarjetas = () => {
  // Tarjetas
  document.querySelectorAll(".kanban-tarjeta").forEach((tarjeta) => {
    tarjeta.addEventListener("dragstart", (e) => {
      tarjetaArrastrada = tarjeta;
      tarjeta.classList.add("opacity-50");
      e.dataTransfer.effectAllowed = "move";
    });

    tarjeta.addEventListener("dragend", () => {
      tarjeta.classList.remove("opacity-50");
      tarjetaArrastrada = null;
    });

    // Abrir detalle al hacer click
    tarjeta.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      // TODO: Tanda 1.3
      console.log("Ver detalle:", tarjeta.dataset.id);
    });
  });

  // Contenedores de columnas
  document.querySelectorAll(".kanban-lista").forEach((lista) => {
    lista.addEventListener("dragover", (e) => {
      e.preventDefault();
      lista.classList.add("bg-brand/5", "border-brand/30");
    });

    lista.addEventListener("dragleave", () => {
      lista.classList.remove("bg-brand/5", "border-brand/30");
    });

    lista.addEventListener("drop", async (e) => {
      e.preventDefault();
      lista.classList.remove("bg-brand/5", "border-brand/30");

      if (!tarjetaArrastrada) return;

      const id = tarjetaArrastrada.dataset.id;
      const nuevoEstado = lista.dataset.estado;
      const mantenimiento = mantenimientosCache.find((m) => m._id === id);

      if (!mantenimiento) return;
      if (mantenimiento.estado === nuevoEstado) return;

      await cambiarEstado(id, nuevoEstado, mantenimiento);
    });
  });
};

// ─── Cambiar estado ───────────────────────────────
const cambiarEstado = async (id, nuevoEstado, mantenimiento) => {
  if (!window.Swal) return;

  const confirmado = await window.Swal.fire({
    icon: "question",
    title: `Cambiar a ${nuevoEstado}?`,
    input: "text",
    inputPlaceholder: "Nota (opcional)",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Si, cambiar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!confirmado.isConfirmed) return;

  const nota = confirmado.value || null;

  try {
    await api.cambiarEstadoMantenimiento(id, nuevoEstado, nota);

    // Actualizar local
    const index = mantenimientosCache.findIndex((m) => m._id === id);
    if (index !== -1) {
      mantenimientosCache[index].estado = nuevoEstado;
    }

    renderBoard();

    window.Swal.fire({
      icon: "success",
      title: `Estado cambiado a ${nuevoEstado}`,
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cambiar el estado",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};
