import { api } from "./api.js";
import { construirLayout } from "./layout.js";
import { crearTabla } from "./tabla.js";
import { bloquearScroll, desbloquearScroll } from "./ui.js";

let tabla;
const modalHistorial = document.getElementById("modal-historial");
const modalHistorialTitulo = document.getElementById("modal-historial-titulo");
const modalHistorialSubtitulo = document.getElementById(
  "modal-historial-subtitulo",
);
const historialContenido = document.getElementById("historial-contenido");
const btnCerrarHistorial = document.getElementById("btn-cerrar-historial");

// ─── Init ────────────────────────────────────────
const init = async () => {
  const usuario = await construirLayout({
    titulo: "Motos",
    subtitulo: "Listado de motos registradas",
    itemActivo: "motos",
  });

  if (!usuario) return;

  // Cargar marcas para el filtro
  let marcas = [];
  try {
    const data = await api.listarMarcas();
    marcas = data.marcas || [];
  } catch (e) {
    console.error("Error al cargar marcas:", e);
  }

  crearTablaMotos(marcas);
  bindEventos();
};

// ─── Tabla ───────────────────────────────────────
const crearTablaMotos = (marcas) => {
  // Filtros
  const filtros = [
    {
      label: "Estado",
      id: "estado",
      opciones: [
        { value: "", label: "Todas las motos" },
        { value: "enTaller", label: "En taller" },
        { value: "fueraTaller", label: "Fuera del taller" },
      ],
    },
  ];

  // Filtro de marca solo si hay marcas
  if (marcas.length > 0) {
    filtros.push({
      label: "Marca",
      id: "marca",
      opciones: [
        { value: "", label: "Todas las marcas" },
        ...marcas.map((m) => ({ value: m, label: m })),
      ],
    });
  }

  tabla = crearTabla({
    contenedor: document.getElementById("tabla-motos"),

    columnas: [
      {
        key: "placa",
        label: "Placa",
        render: (r) =>
          `<span class="font-mono font-bold text-white">${r.placa}</span>`,
      },
      {
        key: "modelo",
        label: "Nombre",
        render: (r) => `<span class="text-white">${r.modelo || "-"}</span>`,
      },
      {
        key: "marca",
        label: "Marca",
        render: (r) => `<span class="text-zinc-300">${r.marca || "-"}</span>`,
      },
      {
        key: "cliente",
        label: "Cliente",
        render: (r) => {
          const nombre = r.clienteId?.nombre || "Sin cliente";
          return `<span class="text-zinc-300">${nombre}</span>`;
        },
      },
      {
        key: "estado",
        label: "Estado",
        render: (r) => {
          if (r.enMantenimiento) {
            return `
              <span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                En taller
              </span>
            `;
          }
          return `
            <span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Disponible
            </span>
          `;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <button
            class="btn-ver-historial inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            data-moto-id="${r._id}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Ver historial
          </button>
        `,
      },
    ],

    cargar: async ({ page, limit, search, estado, marca }) => {
      const params = { page, limit, search };
      if (estado) params.estado = estado;
      if (marca) params.marca = marca;

      const data = await api.listarMotos(params);
      return { total: data.total, data: data.motos };
    },

    filtros,

    labelBuscador: "Buscar moto",
    placeholder: "Placa, marca o modelo...",
    mensajeVacio:
      "Aun no hay motos registradas en el sistema. Las motos se crean automaticamente al registrar un mantenimiento.",
    iconoVacio:
      '<circle cx="5.5" cy="17.5" r="3.5" stroke-width="2"/><circle cx="18.5" cy="17.5" r="3.5" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6h3l2 8M9 6h6l1 5H5l1-5h3zm0 0l-1-3H4"/>',
  });

  // Delegacion del boton "Ver historial"
  document
    .getElementById("tabla-motos")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-ver-historial");
      if (!btn) return;
      e.stopPropagation();

      const motoId = btn.dataset.motoId;
      await abrirHistorial(motoId);
    });
};

// ─── Historial ───────────────────────────────────
const abrirHistorial = async (motoId) => {
  modalHistorialTitulo.textContent = "Historial";
  modalHistorialSubtitulo.textContent = "Cargando...";
  historialContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;

  bloquearScroll();
  modalHistorial.classList.remove("hidden");
  modalHistorial.classList.add("flex");

  try {
    const data = await api.historialMoto(motoId);
    const { moto, mantenimientos } = data;

    modalHistorialTitulo.textContent = `${moto.placa} - ${moto.marca} ${moto.modelo}`;
    modalHistorialSubtitulo.textContent = `Cliente: ${moto.clienteId?.nombre || "Sin cliente"}`;

    if (!mantenimientos || mantenimientos.length === 0) {
      historialContenido.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-border/30 mb-4">
            <svg class="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p class="text-zinc-400 text-sm font-medium mb-1">Sin mantenimientos</p>
          <p class="text-zinc-500 text-xs">Esta moto no tiene mantenimientos registrados.</p>
        </div>
      `;
      return;
    }

    // Colores por estado
    const coloresEstado = {
      Recibido: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
      },
      "En Diagnostico": {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
      },
      "En Reparacion": {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
      },
      Listo: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/30",
      },
      Entregado: {
        bg: "bg-brand/10",
        text: "text-brand",
        border: "border-brand/30",
      },
    };

    historialContenido.innerHTML = `
      <div class="space-y-3">
        ${mantenimientos
          .map((m) => {
            const color = coloresEstado[m.estado] || coloresEstado["Recibido"];
            const fecha = new Date(m.fechaIngreso).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return `
            <div class="bg-ink border border-ink-border rounded-xl p-4 hover:border-brand/40 transition-colors">
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-white mb-1">${fecha}</p>
                  <p class="text-xs text-zinc-500">${m.mecanicoId?.nombre ? "Mecanico: " + m.mecanicoId.nombre : "Sin mecanico asignado"}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${color.bg} ${color.text} border ${color.border} shrink-0">
                  ${m.estado}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div>
                  <p class="text-zinc-500 mb-0.5">Kilometraje</p>
                  <p class="text-zinc-200">${m.kilometraje?.toLocaleString("es-CO") || "-"} km</p>
                </div>
                <div>
                  <p class="text-zinc-500 mb-0.5">Servicios</p>
                  <p class="text-zinc-200">${m.serviciosRealizados?.length || 0}</p>
                </div>
                <div>
                  <p class="text-zinc-500 mb-0.5">Repuestos</p>
                  <p class="text-zinc-200">${m.repuestosUtilizados?.length || 0}</p>
                </div>
                <div>
                  <p class="text-zinc-500 mb-0.5">Total</p>
                  <p class="text-brand font-medium">$${(m.costoTotal || 0).toLocaleString("es-CO")}</p>
                </div>
              </div>

              ${
                m.motivoIngreso
                  ? `
                <div class="pt-3 border-t border-ink-border">
                  <p class="text-xs text-zinc-500 mb-1">Motivo de ingreso</p>
                  <p class="text-xs text-zinc-300">${m.motivoIngreso}</p>
                </div>
              `
                  : ""
              }
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar historial:", error);
    historialContenido.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-400 text-sm">Error al cargar el historial</p>
      </div>
    `;
  }
};

const cerrarHistorial = () => {
  modalHistorial.classList.add("hidden");
  modalHistorial.classList.remove("flex");
  desbloquearScroll();
};

const bindEventos = () => {
  btnCerrarHistorial.addEventListener("click", cerrarHistorial);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalHistorial.classList.contains("hidden")) {
      cerrarHistorial();
    }
  });

  modalHistorial.addEventListener("click", (e) => {
    if (e.target === modalHistorial) cerrarHistorial();
  });
};

init();
