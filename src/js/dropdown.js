/**
 * Crea un dropdown personalizado (reemplazo del <select> nativo) para filtros.
 *
 * @param {Object} config
 * @param {String} config.id             - ID unico del filtro
 * @param {String} config.label          - Texto arriba del dropdown
 * @param {Array}  config.opciones       - [{ value, label }]
 * @param {String} [config.valorInicial] - Valor seleccionado por defecto (default: '')
 * @returns {Object} { wrapper, valorActual, onChange }
 */
export const crearDropdown = ({ id, label, opciones, valorInicial = "" }) => {
  let valorActual = valorInicial;
  let abierto = false;

  // ─── Encontrar la opcion inicial ─────────────────
  const opcionInicial =
    opciones.find((o) => o.value === valorInicial) || opciones[0];
  valorActual = opcionInicial.value;

  // ─── Wrapper ─────────────────────────────────────
  const wrapper = document.createElement("div");
  wrapper.className = "w-full sm:w-auto";
  wrapper.dataset.dropdownWrapper = id;

  wrapper.innerHTML = `
    <span class="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">${label}</span>

    <div class="relative" data-dropdown>
      <!-- Boton visible -->
      <button
        type="button"
        class="dropdown-toggle w-full sm:min-w-[180px] flex items-center justify-between gap-2 bg-ink border border-ink-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all"
        aria-haspopup="listbox"
        aria-expanded="false"
        data-dropdown-toggle
      >
        <span class="truncate" data-dropdown-label>${opcionInicial.label}</span>
        <svg
          class="w-4 h-4 shrink-0 text-zinc-500 transition-transform duration-200"
          data-dropdown-chevron
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Menu -->
      <ul
        class="dropdown-menu hidden absolute z-50 mt-1.5 w-full sm:min-w-[180px] bg-ink-soft border border-ink-border rounded-lg shadow-2xl py-1.5 max-h-64 overflow-y-auto"
        role="listbox"
        data-dropdown-menu
      >
        ${opciones
          .map(
            (op) => `
          <li
            role="option"
            data-dropdown-option
            data-value="${op.value}"
            class="dropdown-option flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${op.value === opcionInicial.value ? "text-brand" : "text-zinc-300 hover:bg-white/5"} "
          >
            <span class="truncate">${op.label}</span>
            <svg class="w-4 h-4 shrink-0 ${op.value === opcionInicial.value ? "" : "hidden"}" data-check fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;

  // ─── Referencias internas ────────────────────────
  const toggle = wrapper.querySelector("[data-dropdown-toggle]");
  const menu = wrapper.querySelector("[data-dropdown-menu]");
  const labelEl = wrapper.querySelector("[data-dropdown-label]");
  const chevron = wrapper.querySelector("[data-dropdown-chevron]");
  const optionEls = wrapper.querySelectorAll("[data-dropdown-option]");

  // ─── Callback (lo rellenara el consumidor) ───────
  let _onChange = null;

  // ─── Abrir / cerrar ──────────────────────────────
  const abrir = () => {
    // Cerrar cualquier otro dropdown abierto en la pagina
    document.querySelectorAll("[data-dropdown-menu]").forEach((m) => {
      if (m !== menu) m.classList.add("hidden");
    });
    document.querySelectorAll("[data-dropdown-toggle]").forEach((t) => {
      if (t !== toggle) t.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll("[data-dropdown-chevron]").forEach((c) => {
      if (c !== chevron) c.classList.remove("rotate-180");
    });

    menu.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    chevron.classList.add("rotate-180");
    abierto = true;
  };

  const cerrar = () => {
    menu.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    chevron.classList.remove("rotate-180");
    abierto = false;
  };

  const toggleAbierto = () => (abierto ? cerrar() : abrir());

  // ─── Actualizar valor seleccionado ───────────────
  const seleccionar = (opcion) => {
    valorActual = opcion.value;
    labelEl.textContent = opcion.label;

    // Actualizar visuales de las opciones
    optionEls.forEach((el) => {
      const activo = el.dataset.value === opcion.value;
      const check = el.querySelector("[data-check]");

      if (activo) {
        el.classList.remove("text-zinc-300", "hover:bg-white/5");
        el.classList.add("text-brand");
        if (check) check.classList.remove("hidden");
      } else {
        el.classList.remove("text-brand");
        el.classList.add("text-zinc-300", "hover:bg-white/5");
        if (check) check.classList.add("hidden");
      }
    });

    cerrar();

    if (typeof _onChange === "function") {
      _onChange({ value: opcion.value, label: opcion.label });
    }
  };

  // ─── Eventos ─────────────────────────────────────
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAbierto();
  });

  optionEls.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const opcion = opciones.find((o) => o.value === el.dataset.value);
      if (opcion) seleccionar(opcion);
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", (e) => {
    if (abierto && !wrapper.contains(e.target)) {
      cerrar();
    }
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && abierto) cerrar();
  });

  // ─── API publica ─────────────────────────────────
  return {
    wrapper,
    get valor() {
      return valorActual;
    },
    setOnChange(cb) {
      _onChange = cb;
    },
  };
};
