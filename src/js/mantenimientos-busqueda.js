import { api } from "./api.js";
import { formatearMoneda } from "./mantenimientos-utils.js";

// ═══════════════════════════════════════════════════
// BUSCADOR DE PLACA (cliente + moto)
// ═══════════════════════════════════════════════════
export const inicializarBuscadorPlaca = ({
  inputPlaca,
  resultadosContenedor,
  onSeleccionarMoto,
}) => {
  let timeout = null;

  inputPlaca.addEventListener("input", (e) => {
    const valor = e.target.value.trim();
    inputPlaca.setAttribute("data-has-value", valor ? "true" : "false");

    clearTimeout(timeout);

    if (valor.length < 2) {
      resultadosContenedor.classList.add("hidden");
      return;
    }

    timeout = setTimeout(() => buscarMotos(valor), 300);
  });

  inputPlaca.addEventListener("focus", () => {
    if (inputPlaca.value.trim().length >= 2) {
      buscarMotos(inputPlaca.value.trim());
    }
  });

  document.addEventListener("click", (e) => {
    if (!resultadosContenedor.contains(e.target) && e.target !== inputPlaca) {
      resultadosContenedor.classList.add("hidden");
    }
  });

  const buscarMotos = async (search) => {
    try {
      const data = await api.listarMotos({ search, limit: 10 });
      const motos = data.motos || [];

      if (motos.length === 0) {
        resultadosContenedor.innerHTML = `
          <div class="p-4 text-sm text-zinc-500 text-center">Sin resultados</div>
        `;
      } else {
        resultadosContenedor.innerHTML = motos
          .map(
            (m) => `
          <button type="button" class="opcion-moto w-full text-left px-4 py-3 text-sm border-b border-ink-border last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between gap-3" data-moto-id="${m._id}">
            <div class="min-w-0">
              <p class="font-mono text-xs text-brand">${m.placa}</p>
              <p class="text-white truncate">${m.marca} ${m.modelo}</p>
              <p class="text-xs text-zinc-500 truncate">${m.clienteId?.nombre || "Sin cliente"}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-xs text-zinc-500">${m.cilindraje || ""}</p>
              ${m.clienteId?.telefono ? `<p class="text-xs text-zinc-400">${m.clienteId.telefono}</p>` : ""}
            </div>
          </button>
        `,
          )
          .join("");

        resultadosContenedor.querySelectorAll(".opcion-moto").forEach((btn) => {
          btn.addEventListener("click", async () => {
            try {
              const dataFull = await api.obtenerMoto(btn.dataset.motoId);
              onSeleccionarMoto(dataFull.moto);
            } catch (error) {
              console.error("Error al obtener moto:", error);
            }
            resultadosContenedor.classList.add("hidden");
          });
        });
      }

      resultadosContenedor.classList.remove("hidden");
    } catch (error) {
      console.error("Error al buscar motos:", error);
    }
  };
};

// ═══════════════════════════════════════════════════
// BUSCADOR GENERICO PARA DROPDOWNS (mecanico, servicio, repuesto)
// ═══════════════════════════════════════════════════
export const inicializarDropdown = ({
  wrapper,
  items,
  placeholder,
  onSeleccionar,
  renderItem,
}) => {
  const toggle = wrapper.querySelector('[class*="dropdown-toggle"]');
  const menu = wrapper.querySelector('[class*="dropdown-menu"]');
  const label = wrapper.querySelector('[class*="dropdown-label"]');
  const chevron = wrapper.querySelector('[class*="dropdown-chevron"]');
  const search = wrapper.querySelector('[class*="dropdown-search"]');
  const list = wrapper.querySelector('[class*="dropdown-list"]');
  const hiddenInput = wrapper.querySelector('input[type="hidden"]');

  const render = (filtro = "") => {
    const regex = new RegExp(filtro, "i");
    const filtrados = items.filter((i) => {
      if (renderItem && renderItem.filtro) {
        return renderItem.filtro(i, regex);
      }
      return regex.test(i.nombre || "");
    });

    if (filtrados.length === 0) {
      list.innerHTML = `<div class="px-4 py-3 text-sm text-zinc-500 text-center">Sin resultados</div>`;
      return;
    }

    list.innerHTML = filtrados
      .slice(0, 50)
      .map(
        (item) => `
      <button type="button" class="opcion-item w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors flex items-center justify-between gap-2" data-id="${item._id}">
        ${renderItem ? renderItem.html(item) : `<span>${item.nombre}</span>`}
      </button>
    `,
      )
      .join("");

    list.querySelectorAll(".opcion-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((x) => x._id === btn.dataset.id);
        if (item) {
          hiddenInput.value = item._id;
          label.textContent = item.nombre;
          label.classList.remove("text-zinc-500");
          menu.classList.add("hidden");
          chevron.classList.remove("rotate-180");
          if (onSeleccionar) onSeleccionar(item);
        }
      });
    });
  };

  render("");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll('[class*="dropdown-menu"]').forEach((m) => {
      if (m !== menu) m.classList.add("hidden");
    });
    menu.classList.toggle("hidden");
    chevron.classList.toggle("rotate-180");
    if (!menu.classList.contains("hidden")) {
      setTimeout(() => search.focus(), 50);
    }
  });

  search.addEventListener("input", (e) => render(e.target.value));

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      menu.classList.add("hidden");
      chevron.classList.remove("rotate-180");
    }
  });

  return {
    setValue: (id, text) => {
      hiddenInput.value = id || "";
      label.textContent = text || placeholder;
      label.classList.toggle("text-zinc-500", !id);
    },
    getValue: () => hiddenInput.value,
  };
};

// ═══════════════════════════════════════════════════
// RENDER ITEMS PARA CADA TIPO
// ═══════════════════════════════════════════════════
export const renderMecanicoItem = {
  filtro: (m, regex) => regex.test(m.nombre) || regex.test(m.cedula || ""),
  html: (m) => `
    <span class="truncate">${m.nombre}</span>
    <span class="text-xs text-zinc-500 shrink-0">${m.cedula || ""}</span>
  `,
};

export const renderServicioItem = {
  filtro: (s, regex) => regex.test(s.nombre),
  html: (s) => `
    <span class="truncate">${s.nombre}</span>
    <span class="text-xs text-brand shrink-0">${formatearMoneda(s.precioBase)}</span>
  `,
};

export const renderRepuestoItem = {
  filtro: (r, regex) =>
    regex.test(r.nombre) ||
    regex.test(r.referencia) ||
    regex.test(r.marcaId?.nombre || ""),
  html: (r) => `
    <div class="min-w-0 flex-1">
      <p class="font-mono text-xs text-brand">${r.referencia}</p>
      <p class="text-white truncate">${r.nombre}</p>
    </div>
    <div class="text-right shrink-0">
      <p class="text-xs text-brand">${formatearMoneda(r.precioVenta)}</p>
      <p class="text-xs ${r.stock <= r.stockMinimo ? "text-red-500" : "text-zinc-500"}">Stock: ${r.stock}</p>
    </div>
  `,
};
