import { api } from "./api.js";
import { construirLayout } from "./layout.js";
import { crearTabla } from "./tabla.js";
import { toast } from "./ui.js";

let tabla;

// ─── Init ────────────────────────────────────────
const init = async () => {
  const usuario = await construirLayout({
    titulo: "Clientes",
    subtitulo: "Listado de clientes del taller",
    itemActivo: "clientes",
  });

  if (!usuario) return;

  crearTablaClientes();
};

// ─── Tabla ───────────────────────────────────────
const crearTablaClientes = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-clientes"),

    columnas: [
      {
        key: "nombre",
        label: "Cliente",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombre}</span>`,
      },
      { key: "telefono", label: "Telefono" },
      {
        key: "placa",
        label: "Placa",
        render: (r) =>
          r.ultimaMoto?.placa
            ? `<span class="font-mono text-xs text-brand">${r.ultimaMoto.placa}</span>`
            : '<span class="text-zinc-600">Sin moto</span>',
      },
      {
        key: "moto",
        label: "Moto",
        render: (r) => {
          if (!r.ultimaMoto) return '<span class="text-zinc-600">-</span>';
          const moto =
            `${r.ultimaMoto.marca || ""} ${r.ultimaMoto.modelo || ""}`.trim();
          const extra =
            r.totalMotos > 1
              ? ` <span class="text-zinc-500">+${r.totalMotos - 1}</span>`
              : "";
          return `<span class="text-zinc-300 text-sm">${moto || "-"}</span>${extra}`;
        },
      },
      {
        key: "createdAt",
        label: "Registrado",
        render: (r) => new Date(r.createdAt).toLocaleDateString("es-CO"),
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <button
            class="btn-ver-mantenimientos inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            data-cliente-id="${r._id}"
            data-cliente-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Ver mantenimientos
          </button>
        `,
      },
    ],

    cargar: async ({ page, limit, search, tieneMantenimientos }) => {
      const params = { page, limit, search };

      // Filtro por tener o no mantenimientos
      if (tieneMantenimientos === "true") params.conMantenimientos = "true";
      if (tieneMantenimientos === "false") params.sinMantenimientos = "true";

      const data = await api.listarClientes(params);
      return { total: data.total, data: data.clientes };
    },

    filtros: [
      {
        label: "Mantenimientos",
        id: "tieneMantenimientos",
        opciones: [
          { value: "", label: "Todos los clientes" },
          { value: "true", label: "Con mantenimientos" },
          { value: "false", label: "Sin mantenimientos" },
        ],
      },
    ],

    labelBuscador: "Buscar cliente",
    placeholder: "Nombre o telefono...",
    mensajeVacio:
      "Aun no hay clientes registrados en el sistema. Los clientes se crean automaticamente al registrar un mantenimiento.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
  });

  // Boton "Ver mantenimientos" via delegacion
  document
    .getElementById("tabla-clientes")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-ver-mantenimientos");
      if (!btn) return;

      e.stopPropagation();

      const clienteId = btn.dataset.clienteId;
      const clienteNombre = btn.dataset.clienteNombre;

      await irAMantenimientos(clienteId, clienteNombre);
    });
};

// ─── Ir a mantenimientos del cliente ─────────────
const irAMantenimientos = async (clienteId, clienteNombre) => {
  try {
    const data = await api.listarMantenimientos({ clienteId, limit: 100 });

    if (!data.mantenimientos || data.mantenimientos.length === 0) {
      toast(
        `El cliente "${clienteNombre}" no tiene mantenimientos asignados`,
        "info",
        4000,
      );
      return;
    }

    window.location.href = `/src/pages/mantenimientos.html?clienteId=${clienteId}`;
  } catch (error) {
    console.error("Error:", error);
    window.location.href = `/src/pages/mantenimientos.html?clienteId=${clienteId}`;
  }
};

init();
