import { crearDropdown } from "./dropdown.js";
/**
 * Renderiza una tabla responsive con buscador, paginacion, filtros y estados vacios.
 *
 * @param {Object} opciones
 * @param {HTMLElement} opciones.contenedor
 * @param {Array} opciones.columnas
 * @param {Function} opciones.cargar
 * @param {Function} [opciones.onRowClick]
 * @param {String} [opciones.placeholder]
 * @param {String} [opciones.mensajeVacio]
 * @param {String} [opciones.iconoVacio]
 * @param {Boolean} [opciones.mostrarBuscador]
 * @param {String} [opciones.labelBuscador]
 * @param {Array}  [opciones.filtros]
 */
export const crearTabla = ({
  contenedor,
  columnas,
  cargar,
  onRowClick,
  placeholder = "Buscar...",
  mensajeVacio = "No hay registros",
  iconoVacio = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>',
  mostrarBuscador = true,
  labelBuscador = "Buscar",
  filtros = [],
}) => {
  const estado = {
    page: 1,
    limit: 10,
    search: "",
    filtros: {},
    total: 0,
    data: [],
    cargando: false,
    cargadoInicial: false,
    error: null,
  };

  let timeoutBusqueda = null;

  // ─── Generar filtros HTML ───────────────────────
  const filtrosHTML = filtros
    .map(
      (f) => `
    <div class="w-full sm:w-auto" data-filtro-container="${f.id}"></div>
  `,
    )
    .join("");

  // ─── Estructura base ────────────────────────────
  contenedor.innerHTML = `
    <div class="space-y-4">

      <!-- Seccion de filtros -->
      <div class="bg-ink-soft border border-ink-border rounded-xl p-4 sm:p-5">
        <div class="flex flex-col lg:flex-row lg:items-end gap-4">

          ${
            mostrarBuscador
              ? `
            <div class="flex-1 min-w-0">
              <span class="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                ${labelBuscador}
              </span>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input type="text" class="tabla-buscador w-full bg-ink border border-ink-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all" placeholder="${placeholder}">
              </div>
            </div>
          `
              : ""
          }

          ${filtrosHTML}

          <div class="tabla-acciones flex gap-2 lg:ml-auto"></div>

        </div>
      </div>

      <!-- Contenedor de la tabla -->
      <div class="tabla-wrapper"></div>

      <!-- Paginacion -->
      <div class="tabla-paginacion"></div>

    </div>
  `;

  // ─── Crear dropdowns personalizados ─────────────
  const dropdowns = {};
  filtros.forEach((f) => {
    const container = contenedor.querySelector(
      `[data-filtro-container="${f.id}"]`,
    );
    if (!container) return;

    const dropdown = crearDropdown({
      id: f.id,
      label: f.label,
      opciones: f.opciones,
      valorInicial: f.opciones[0].value,
    });

    dropdown.setOnChange(({ value }) => {
      estado.filtros[f.id] = value;
      estado.page = 1;
      cargarDatos();
    });

    container.appendChild(dropdown.wrapper);
    dropdowns[f.id] = dropdown;
  });

  const buscador = contenedor.querySelector(".tabla-buscador");
  const tablaWrapper = contenedor.querySelector(".tabla-wrapper");
  const paginacion = contenedor.querySelector(".tabla-paginacion");
  const acciones = contenedor.querySelector(".tabla-acciones");

  // ─── Cargar datos ───────────────────────────────
  const cargarDatos = async () => {
    estado.cargando = true;
    estado.error = null;
    renderizar();

    try {
      const resultado = await cargar({
        page: estado.page,
        limit: estado.limit,
        search: estado.search,
        ...estado.filtros,
      });

      estado.total = resultado.total || 0;
      estado.data = resultado.data || [];
    } catch (error) {
      console.error("Error al cargar tabla:", error);
      estado.data = [];
      estado.total = 0;
      estado.error = error.message || "Error al cargar los datos";
    } finally {
      estado.cargando = false;
      estado.cargadoInicial = true;
      renderizar();
    }
  };

  // ─── Renderizar ─────────────────────────────────
  const renderizar = () => {
    // Loader inicial
    if (estado.cargando && !estado.cargadoInicial) {
      tablaWrapper.innerHTML = `
        <div class="bg-ink-soft border border-ink-border rounded-xl overflow-hidden">
          <div class="hidden md:block">
            <table class="w-full text-sm">
              <thead class="bg-ink border-b border-ink-border">
                <tr>
                  ${columnas.map((c) => `<th class="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider ${c.class || ""}">${c.label}</th>`).join("")}
                </tr>
              </thead>
            </table>
          </div>
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
            <p class="text-zinc-500 text-sm mt-4">Cargando...</p>
          </div>
        </div>
      `;
      paginacion.innerHTML = "";
      return;
    }

    // Error
    if (estado.error) {
      tablaWrapper.innerHTML = `
        <div class="bg-ink-soft border border-red-500/30 rounded-xl p-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="text-red-400 text-sm font-medium mb-1">Error al cargar</p>
          <p class="text-zinc-500 text-xs max-w-sm mx-auto">${estado.error}</p>
        </div>
      `;
      paginacion.innerHTML = "";
      return;
    }

    // Estado vacio (con encabezados visibles siempre)
    if (estado.data.length === 0) {
      tablaWrapper.innerHTML = `
        <div class="bg-ink-soft border border-ink-border rounded-xl overflow-hidden">
          <div class="w-full overflow-x-auto">
            <table class="min-w-[700px] w-full text-sm">
              <thead class="bg-ink border-b border-ink-border">
                <tr>
                  ${columnas
                    .map(
                      (c) => `
                    <th class="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider whitespace-nowrap ${c.class || ""}">
                      ${c.label}
                    </th>
                  `,
                    )
                    .join("")}
                </tr>
              </thead>
            </table>
          </div>
          <div class="p-8 sm:p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-border/30 mb-4">
              <svg class="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${iconoVacio}
              </svg>
            </div>
            <p class="text-zinc-400 text-sm font-medium mb-1">Tabla vacia</p>
            <p class="text-zinc-500 text-xs max-w-sm mx-auto">${mensajeVacio}</p>
          </div>
        </div>
      `;
      paginacion.innerHTML = "";
      return;
    }

    // Tabla con datos (con scroll horizontal en pantallas pequenas)
    tablaWrapper.innerHTML = `
      <div class="bg-ink-soft border border-ink-border rounded-xl overflow-hidden">
        <div class="w-full overflow-x-auto">
          <table class="min-w-[700px] w-full text-sm">
            <thead class="bg-ink border-b border-ink-border">
              <tr>
                ${columnas
                  .map(
                    (c) => `
                  <th class="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider whitespace-nowrap ${c.class || ""}">
                    ${c.label}
                  </th>
                `,
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${estado.data
                .map(
                  (row, i) => `
                <tr class="tabla-fila border-b border-ink-border last:border-0 hover:bg-white/5 transition-colors ${onRowClick ? "cursor-pointer" : ""}" data-index="${i}">
                  ${columnas
                    .map(
                      (c) => `
                    <td class="px-4 py-3 text-zinc-300 whitespace-nowrap ${c.class || ""}">
                      ${c.render ? c.render(row) : (row[c.key] ?? "-")}
                    </td>
                  `,
                    )
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Click en fila
    if (onRowClick) {
      tablaWrapper.querySelectorAll(".tabla-fila").forEach((el) => {
        el.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const row = estado.data[parseInt(el.dataset.index)];
          onRowClick(row);
        });
      });
    }

    renderizarPaginacion();
  };

  // ─── Paginacion ─────────────────────────────────
  const renderizarPaginacion = () => {
    const totalPaginas = Math.ceil(estado.total / estado.limit);

    if (totalPaginas <= 1) {
      paginacion.innerHTML =
        estado.total > 0
          ? `<div class="text-xs text-zinc-500 text-center">${estado.total} registro(s)</div>`
          : "";
      return;
    }

    const paginas = [];
    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 ||
        i === totalPaginas ||
        (i >= estado.page - 1 && i <= estado.page + 1)
      ) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== "...") {
        paginas.push("...");
      }
    }

    paginacion.innerHTML = `
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-xs text-zinc-500">${estado.total} registro(s) - Pagina ${estado.page} de ${totalPaginas}</p>
        <div class="flex items-center gap-1">
          <button class="btn-pag p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" data-page="${estado.page - 1}" ${estado.page === 1 ? "disabled" : ""}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          ${paginas
            .map((p) => {
              if (p === "...")
                return `<span class="px-2 text-zinc-600 text-sm">...</span>`;
              const activo = p === estado.page;
              return `<button class="btn-pag min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${activo ? "bg-brand text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}" data-page="${p}">${p}</button>`;
            })
            .join("")}
          <button class="btn-pag p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" data-page="${estado.page + 1}" ${estado.page === totalPaginas ? "disabled" : ""}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    paginacion.querySelectorAll(".btn-pag:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        estado.page = parseInt(btn.dataset.page);
        cargarDatos();
      });
    });
  };

  // ─── Busqueda con debounce ──────────────────────
  if (buscador) {
    buscador.addEventListener("input", (e) => {
      clearTimeout(timeoutBusqueda);
      timeoutBusqueda = setTimeout(() => {
        estado.search = e.target.value.trim();
        estado.page = 1;
        cargarDatos();
      }, 350);
    });
  }

  // ─── Render inicial (para mostrar loader y luego datos) ─
  renderizar();
  cargarDatos();

  return {
    recargar: () => cargarDatos(),
    get acciones() {
      return acciones;
    },
    get estado() {
      return estado;
    },
  };
};
