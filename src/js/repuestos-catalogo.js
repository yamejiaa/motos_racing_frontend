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
import {
  mostrarMensajeFormulario,
  limpiarMensajesFormulario,
} from "./mensajes.js";

let tabla;
let repuestoActual = null;
let marcasCache = [];
let categoriasCache = [];
let proveedoresCache = [];

// Referencias
const modalRepuesto = document.getElementById("modal-repuesto");
const modalRepuestoTitulo = document.getElementById("modal-repuesto-titulo");
const formRepuesto = document.getElementById("form-repuesto");
const inputId = document.getElementById("repuesto-id");
const inputReferencia = document.getElementById("repuesto-referencia");
const inputNombre = document.getElementById("repuesto-nombre");
const inputDescripcion = document.getElementById("repuesto-descripcion");
const inputCompatibilidad = document.getElementById("repuesto-compatibilidad");
const inputStock = document.getElementById("repuesto-stock");
const inputStockMinimo = document.getElementById("repuesto-stock-minimo");
const inputPrecioCompra = document.getElementById("repuesto-precio-compra");
const inputPrecioVenta = document.getElementById("repuesto-precio-venta");
const margenInfo = document.getElementById("repuesto-margen-info");
const margenEl = document.getElementById("repuesto-margen");
const porcentajeEl = document.getElementById("repuesto-porcentaje");
const btnCancelar = document.getElementById("btn-cancelar-repuesto");
const btnGuardar = document.getElementById("btn-guardar-repuesto");

// Inputs hidden de los dropdowns
const inputMarcaId = document.getElementById("repuesto-marca");
const inputCategoriaId = document.getElementById("repuesto-categoria");
const inputProveedorId = document.getElementById("repuesto-proveedor");

const modalAjustar = document.getElementById("modal-ajustar-stock");
const formAjustar = document.getElementById("form-ajustar-stock");
const ajustarId = document.getElementById("ajustar-repuesto-id");
const ajustarNombre = document.getElementById("ajustar-repuesto-nombre");
const ajustarStockActual = document.getElementById(
  "ajustar-repuesto-stock-actual",
);
const ajustarCantidad = document.getElementById("ajustar-cantidad");
const ajustarMotivo = document.getElementById("ajustar-motivo");
const btnCancelarAjustar = document.getElementById("btn-cancelar-ajustar");
const btnGuardarAjustar = document.getElementById("btn-guardar-ajustar");

const modalDetalle = document.getElementById("modal-detalle-repuesto");
const detalleContenido = document.getElementById("detalle-repuesto-contenido");
const btnCerrarDetalle = document.getElementById("btn-cerrar-detalle-repuesto");

// ─── Utilidades ──────────────────────────────────
const formatearMoneda = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatearInput = (v) => {
  const num = String(v).replace(/\D/g, "");
  return num ? parseInt(num, 10).toLocaleString("es-CO") : "";
};

const parsear = (s) => {
  const num = String(s).replace(/\D/g, "");
  return num ? parseInt(num, 10) : 0;
};

// ─── Cargar caches ───────────────────────────────
const cargarCaches = async () => {
  try {
    const [m, c, p] = await Promise.all([
      api.listarMarcasRepuestos({ limit: 200, activo: "true" }),
      api.listarCategoriasRepuestos({ limit: 200, activo: "true" }),
      api.listarProveedores({ limit: 200, activo: "true" }),
    ]);
    marcasCache = m.marcas || [];
    categoriasCache = c.categorias || [];
    proveedoresCache = p.proveedores || [];
  } catch (error) {
    console.error("Error al cargar caches:", error);
  }
};

// ─── Dropdowns personalizados ────────────────────
const inicializarDropdown = (wrapper, items, placeholder) => {
  const toggle = wrapper.querySelector(".rep-dropdown-toggle");
  const menu = wrapper.querySelector(".rep-dropdown-menu");
  const label = wrapper.querySelector(".rep-dropdown-label");
  const chevron = wrapper.querySelector(".rep-dropdown-chevron");
  const search = wrapper.querySelector(".rep-dropdown-search");
  const list = wrapper.querySelector(".rep-dropdown-list");
  const hiddenInput = wrapper.querySelector('input[type="hidden"]');

  // Buscar el input hidden por id dentro del wrapper
  const hiddenById = wrapper.querySelector('input[id^="repuesto-"]');
  const input = hiddenById || hiddenInput;

  const render = (filtro = "") => {
    const regex = new RegExp(filtro, "i");
    const filtrados = items.filter((i) => regex.test(i.nombre));

    const opciones = [
      `<button type="button" class="opcion-dropdown w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 transition-colors" data-value="" data-label="${placeholder}">${placeholder}</button>`,
      ...filtrados.map(
        (i) =>
          `<button type="button" class="opcion-dropdown w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors" data-value="${i._id}" data-label="${i.nombre}">${i.nombre}</button>`,
      ),
    ];

    list.innerHTML = opciones.join("");

    list.querySelectorAll(".opcion-dropdown").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.value;
        label.textContent = btn.dataset.label;
        label.classList.toggle("text-zinc-500", !btn.dataset.value);
        menu.classList.add("hidden");
        chevron.classList.remove("rotate-180");
      });
    });
  };

  render("");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    // Cerrar otros dropdowns
    document.querySelectorAll(".rep-dropdown-menu").forEach((m) => {
      if (m !== menu) m.classList.add("hidden");
    });
    document.querySelectorAll(".rep-dropdown-chevron").forEach((c) => {
      if (c !== chevron) c.classList.remove("rotate-180");
    });

    menu.classList.toggle("hidden");
    chevron.classList.toggle("rotate-180");
    if (!menu.classList.contains("hidden")) {
      setTimeout(() => search.focus(), 50);
    }
  });

  search.addEventListener("input", (e) => render(e.target.value));

  // Devolver el input hidden y el label para poder setear valores programaticamente
  return {
    input,
    label,
    setValue: (value, text) => {
      input.value = value || "";
      label.textContent = text || placeholder;
      label.classList.toggle("text-zinc-500", !value);
    },
  };
};

let dropdownMarca;
let dropdownCategoria;
let dropdownProveedor;

const inicializarDropdowns = () => {
  const wrapperMarca = document.querySelector(
    '[data-dropdown-repuesto="marca"]',
  );
  const wrapperCategoria = document.querySelector(
    '[data-dropdown-repuesto="categoria"]',
  );
  const wrapperProveedor = document.querySelector(
    '[data-dropdown-repuesto="proveedor"]',
  );

  dropdownMarca = inicializarDropdown(wrapperMarca, marcasCache, "Sin marca");
  dropdownCategoria = inicializarDropdown(
    wrapperCategoria,
    categoriasCache,
    "Sin categoria",
  );
  dropdownProveedor = inicializarDropdown(
    wrapperProveedor,
    proveedoresCache,
    "Sin proveedor",
  );

  // Cerrar dropdowns al hacer click fuera
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".rep-dropdown-menu")
      .forEach((m) => m.classList.add("hidden"));
    document
      .querySelectorAll(".rep-dropdown-chevron")
      .forEach((c) => c.classList.remove("rotate-180"));
  });
};

// ─── Render ──────────────────────────────────────
export const renderCatalogo = async () => {
  await cargarCaches();
  inicializarDropdowns();
  crearTablaRepuestos();
  bindEventos();
};

const crearTablaRepuestos = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-repuestos"),

    columnas: [
      {
        key: "referencia",
        label: "Referencia",
        render: (r) =>
          `<span class="font-mono text-xs text-zinc-400">${r.referencia}</span>`,
      },
      {
        key: "nombre",
        label: "Repuesto",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombre}</span>`,
      },
      {
        key: "marcaId",
        label: "Marca",
        render: (r) =>
          `<span class="text-zinc-300">${r.marcaId?.nombre || "-"}</span>`,
      },
      {
        key: "categoriaId",
        label: "Categoria",
        render: (r) =>
          `<span class="text-zinc-300">${r.categoriaId?.nombre || "-"}</span>`,
      },
      {
        key: "stock",
        label: "Stock",
        render: (r) => {
          const bajo = r.stock <= r.stockMinimo;
          const muyBajo = r.stock === 0;
          if (muyBajo) {
            return `<span class="inline-flex items-center gap-1.5 text-red-500 font-medium text-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>${r.stock}
            </span>`;
          }
          if (bajo) {
            return `<span class="inline-flex items-center gap-1.5 text-yellow-500 font-medium text-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>${r.stock}
            </span>`;
          }
          return `<span class="inline-flex items-center gap-1.5 text-green-500 font-medium text-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>${r.stock}
          </span>`;
        },
      },
      {
        key: "precioVenta",
        label: "Precio venta",
        render: (r) =>
          `<span class="text-brand font-medium">${formatearMoneda(r.precioVenta)}</span>`,
      },
      {
        key: "margen",
        label: "Margen",
        render: (r) => {
          const margen = (r.precioVenta || 0) - (r.precioCompra || 0);
          const pct =
            r.precioVenta > 0
              ? ((margen / r.precioVenta) * 100).toFixed(1)
              : "0";
          return `<div class="text-xs">
            <p class="text-brand font-medium">${formatearMoneda(margen)}</p>
            <p class="text-zinc-500">${pct}%</p>
          </div>`;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <div class="flex items-center justify-end gap-1 flex-wrap">
            <button class="btn-detalle-repuesto bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" title="Ver detalle">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
            <button class="btn-editar-repuesto bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" title="Editar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="btn-ajustar-repuesto bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-nombre="${r.nombre}" data-stock="${r.stock}" title="Ajustar stock">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
            <button class="btn-eliminar-repuesto bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-nombre="${r.nombre}" title="Eliminar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        `,
      },
    ],

    cargar: async ({
      page,
      limit,
      search,
      activo,
      bajoStock,
      marcaId,
      categoriaId,
    }) => {
      const params = { page, limit, search };
      if (activo !== undefined && activo !== "") params.activo = activo;
      if (bajoStock === "true") params.bajoStock = "true";
      if (marcaId) params.marcaId = marcaId;
      if (categoriaId) params.categoriaId = categoriaId;

      const data = await api.listarRepuestos(params);
      return { total: data.total, data: data.repuestos };
    },

    filtros: [
      {
        label: "Estado",
        id: "activo",
        opciones: [
          { value: "", label: "Todos" },
          { value: "true", label: "Solo activos" },
          { value: "false", label: "Solo inactivos" },
        ],
      },
      {
        label: "Stock",
        id: "bajoStock",
        opciones: [
          { value: "", label: "Todos" },
          { value: "true", label: "Solo bajo stock" },
        ],
      },
    ],

    labelBuscador: "Buscar repuesto",
    placeholder: "Referencia, nombre o compatibilidad...",
    mensajeVacio: "Aun no hay repuestos registrados.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
  });

  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Nuevo repuesto
  `;
  btnNuevo.addEventListener("click", abrirModalCrear);
  tabla.acciones.appendChild(btnNuevo);

  document
    .getElementById("tabla-repuestos")
    .addEventListener("click", async (e) => {
      const btnDetalle = e.target.closest(".btn-detalle-repuesto");
      if (btnDetalle) {
        e.stopPropagation();
        await abrirDetalle(btnDetalle.dataset.id);
        return;
      }

      const btnEditar = e.target.closest(".btn-editar-repuesto");
      if (btnEditar) {
        e.stopPropagation();
        await abrirModalEditar(btnEditar.dataset.id);
        return;
      }

      const btnAjustar = e.target.closest(".btn-ajustar-repuesto");
      if (btnAjustar) {
        e.stopPropagation();
        abrirModalAjustar(
          btnAjustar.dataset.id,
          btnAjustar.dataset.nombre,
          btnAjustar.dataset.stock,
        );
        return;
      }

      const btnEliminar = e.target.closest(".btn-eliminar-repuesto");
      if (btnEliminar) {
        e.stopPropagation();
        await eliminarRepuesto(
          btnEliminar.dataset.id,
          btnEliminar.dataset.nombre,
        );
        return;
      }
    });
};

// ─── Modal crear ─────────────────────────────────
const abrirModalCrear = async () => {
  repuestoActual = null;
  modalRepuestoTitulo.textContent = "Nuevo repuesto";
  formRepuesto.reset();
  inputId.value = "";
  inputStockMinimo.value = "20";
  margenInfo.classList.add("hidden");

  // Resetear dropdowns
  dropdownMarca.setValue("", "Sin marca");
  dropdownCategoria.setValue("", "Sin categoria");
  dropdownProveedor.setValue("", "Sin proveedor");

  // Cargar referencia automatica
  inputReferencia.value = "Generando...";
  try {
    const data = await api.generarReferenciaRepuesto();
    inputReferencia.value = data.referencia;
  } catch (error) {
    inputReferencia.value = "MTR----";
  }
  inputReferencia.setAttribute("data-has-value", "true");

  formRepuesto
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => {
      if (el.value) el.setAttribute("data-has-value", "true");
      else el.removeAttribute("data-has-value");
    });

  limpiarMensajesFormulario(formRepuesto);
  bloquearScroll();
  modalRepuesto.classList.remove("hidden");
  modalRepuesto.classList.add("flex");
  setTimeout(() => inputNombre.focus(), 100);
};

// ─── Modal editar ────────────────────────────────
const abrirModalEditar = async (id) => {
  limpiarMensajesFormulario(formRepuesto);
  try {
    const data = await api.obtenerRepuesto(id);
    const r = data.repuesto;
    repuestoActual = r;
    modalRepuestoTitulo.textContent = "Editar repuesto";

    inputId.value = r._id;
    inputReferencia.value = r.referencia;
    inputReferencia.setAttribute("data-has-value", "true");
    inputNombre.value = r.nombre || "";
    inputDescripcion.value = r.descripcion || "";
    inputCompatibilidad.value = r.compatibilidad || "";
    inputStock.value = formatearInput(r.stock || 0);
    inputStockMinimo.value = formatearInput(r.stockMinimo || 20);
    inputPrecioCompra.value = formatearInput(r.precioCompra || 0);
    inputPrecioVenta.value = formatearInput(r.precioVenta || 0);

    // Setear dropdowns
    dropdownMarca.setValue(
      r.marcaId?._id || "",
      r.marcaId?.nombre || "Sin marca",
    );
    dropdownCategoria.setValue(
      r.categoriaId?._id || "",
      r.categoriaId?.nombre || "Sin categoria",
    );
    dropdownProveedor.setValue(
      r.proveedorId?._id || "",
      r.proveedorId?.nombre || "Sin proveedor",
    );

    formRepuesto
      .querySelectorAll(".field input, .field textarea")
      .forEach((el) => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      });

    actualizarMargen();
    bloquearScroll();
    modalRepuesto.classList.remove("hidden");
    modalRepuesto.classList.add("flex");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const cerrarModalRepuesto = () => {
  modalRepuesto.classList.add("hidden");
  modalRepuesto.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formRepuesto);
};

// ─── Margen en vivo ──────────────────────────────
const actualizarMargen = () => {
  const compra = parsear(inputPrecioCompra.value);
  const venta = parsear(inputPrecioVenta.value);

  if (venta <= 0) {
    margenInfo.classList.add("hidden");
    return;
  }

  const margen = venta - compra;
  const pct = ((margen / venta) * 100).toFixed(2);

  margenEl.textContent = formatearMoneda(margen);
  porcentajeEl.textContent = `${pct}%`;
  margenInfo.classList.remove("hidden");
};

// ─── Guardar ─────────────────────────────────────
const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formRepuesto);

  const datos = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim() || undefined,
    compatibilidad: inputCompatibilidad.value.trim() || undefined,
    marcaId: inputMarcaId.value || undefined,
    categoriaId: inputCategoriaId.value || undefined,
    proveedorId: inputProveedorId.value || undefined,
    stock: parsear(inputStock.value),
    stockMinimo: parsear(inputStockMinimo.value) || 20,
    precioCompra: parsear(inputPrecioCompra.value),
    precioVenta: parsear(inputPrecioVenta.value),
  };

  if (!datos.nombre || datos.nombre.length < 2) {
    return mostrarMensajeFormulario(
      formRepuesto,
      "El nombre debe tener al menos 2 caracteres",
      "error",
    );
  }
  if (datos.precioVenta <= 0) {
    return mostrarMensajeFormulario(
      formRepuesto,
      "El precio de venta debe ser mayor a 0",
      "error",
    );
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (repuestoActual) {
      await api.actualizarRepuesto(repuestoActual._id, datos);
    } else {
      await api.crearRepuesto(datos);
    }
    cerrarModalRepuesto();
    await tabla.recargar();
    alertaExito(
      repuestoActual ? "Repuesto actualizado" : "Repuesto creado",
      "Los cambios se guardaron correctamente",
    );
  } catch (error) {
    mostrarMensajeFormulario(
      formRepuesto,
      error.message || "Error al guardar",
      "error",
    );
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar";
  }
};

// ─── Modal ajustar stock ─────────────────────────
const abrirModalAjustar = (id, nombre, stock) => {
  ajustarId.value = id;
  ajustarNombre.textContent = nombre;
  ajustarStockActual.textContent = `Stock actual: ${stock}`;
  ajustarCantidad.value = "";
  ajustarMotivo.value = "";
  formAjustar
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => el.removeAttribute("data-has-value"));
  limpiarMensajesFormulario(formAjustar);
  bloquearScroll();
  modalAjustar.classList.remove("hidden");
  modalAjustar.classList.add("flex");
  setTimeout(() => ajustarCantidad.focus(), 100);
};

const cerrarModalAjustar = () => {
  modalAjustar.classList.add("hidden");
  modalAjustar.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formAjustar);
};

const manejarAjustar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formAjustar);

  const cantidadStr = ajustarCantidad.value.trim();
  const cantidad = parseInt(cantidadStr, 10);

  if (isNaN(cantidad) || cantidad === 0) {
    return mostrarMensajeFormulario(
      formAjustar,
      "La cantidad debe ser distinta de cero",
      "error",
    );
  }

  btnGuardarAjustar.disabled = true;
  btnGuardarAjustar.textContent = "Ajustando...";

  try {
    const data = await api.ajustarStock(
      ajustarId.value,
      cantidad,
      ajustarMotivo.value.trim(),
    );
    cerrarModalAjustar();
    await tabla.recargar();
    toast(data.msg, "success");
  } catch (error) {
    mostrarMensajeFormulario(formAjustar, error.message, "error");
  } finally {
    btnGuardarAjustar.disabled = false;
    btnGuardarAjustar.textContent = "Ajustar";
  }
};

// ─── Detalle ─────────────────────────────────────
const abrirDetalle = async (id) => {
  detalleContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>`;
  bloquearScroll();
  modalDetalle.classList.remove("hidden");
  modalDetalle.classList.add("flex");

  try {
    const data = await api.obtenerRepuesto(id);
    const r = data.repuesto;
    const margen = (r.precioVenta || 0) - (r.precioCompra || 0);
    const pct =
      r.precioVenta > 0 ? ((margen / r.precioVenta) * 100).toFixed(2) : "0";

    detalleContenido.innerHTML = `
      <div class="space-y-4">
        <div>
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Referencia</p>
          <p class="text-sm font-mono text-brand">${r.referencia}</p>
        </div>
        <div>
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Nombre</p>
          <p class="text-base font-medium">${r.nombre}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Marca</p>
            <p class="text-sm">${r.marcaId?.nombre || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Categoria</p>
            <p class="text-sm">${r.categoriaId?.nombre || "-"}</p>
          </div>
        </div>
        ${
          r.descripcion
            ? `
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Descripcion</p>
            <p class="text-sm text-zinc-300">${r.descripcion}</p>
          </div>
        `
            : ""
        }
        ${
          r.compatibilidad
            ? `
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Compatible con</p>
            <p class="text-sm text-zinc-300">${r.compatibilidad}</p>
          </div>
        `
            : ""
        }

        <div class="pt-4 border-t border-ink-border">
          <h3 class="text-sm font-bold mb-3">Inventario y precios</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Stock actual</p>
              <p class="text-lg font-bold">${r.stock}</p>
            </div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Stock minimo</p>
              <p class="text-lg font-bold">${r.stockMinimo}</p>
            </div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Precio compra</p>
              <p class="text-sm font-medium">${formatearMoneda(r.precioCompra)}</p>
            </div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Precio venta</p>
              <p class="text-sm font-medium text-brand">${formatearMoneda(r.precioVenta)}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-3">
            <div class="bg-ink border border-brand/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Margen de ganancia</p>
              <p class="text-lg font-bold text-brand">${formatearMoneda(margen)}</p>
            </div>
            <div class="bg-ink border border-brand/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Porcentaje margen</p>
              <p class="text-lg font-bold text-brand">${pct}%</p>
            </div>
          </div>
        </div>

        ${
          r.proveedorId
            ? `
          <div class="pt-4 border-t border-ink-border">
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Proveedor</p>
            <p class="text-sm">${r.proveedorId.nombre || "-"}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  } catch (error) {
    detalleContenido.innerHTML = `<p class="text-red-400 text-sm text-center py-8">Error al cargar</p>`;
  }
};

const cerrarDetalle = () => {
  modalDetalle.classList.add("hidden");
  modalDetalle.classList.remove("flex");
  desbloquearScroll();
};

// ─── Eliminar ────────────────────────────────────
const eliminarRepuesto = async (id, nombre) => {
  const confirmado = await confirmar(
    "Eliminar repuesto",
    `¿Estas seguro de eliminar "${nombre}"? Si tiene mantenimientos asociados, solo se desactivara.`,
    "Si, eliminar",
  );
  if (!confirmado) return;

  try {
    const data = await api.eliminarRepuesto(id);
    await tabla.recargar();
    alertaExito("Listo", data.msg);
  } catch (error) {
    alertaError("Error", error.message);
  }
};

// ─── Eventos ─────────────────────────────────────
const bindEventos = () => {
  formRepuesto.addEventListener("submit", manejarGuardar);
  btnCancelar.addEventListener("click", cerrarModalRepuesto);

  formAjustar.addEventListener("submit", manejarAjustar);
  btnCancelarAjustar.addEventListener("click", cerrarModalAjustar);

  btnCerrarDetalle.addEventListener("click", cerrarDetalle);

  [formRepuesto, formAjustar].forEach((form) => {
    form.querySelectorAll(".field input, .field textarea").forEach((el) => {
      const sync = () => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });
  });

  [inputStock, inputStockMinimo, inputPrecioCompra, inputPrecioVenta].forEach(
    (input) => {
      input.addEventListener("input", (e) => {
        const valor = parsear(e.target.value);
        e.target.value = valor > 0 ? valor.toLocaleString("es-CO") : "";
      });
    },
  );

  inputPrecioCompra.addEventListener("input", actualizarMargen);
  inputPrecioVenta.addEventListener("input", actualizarMargen);

  ajustarCantidad.addEventListener("input", (e) => {
    e.target.value = e.target.value
      .replace(/[^\d-]/g, "")
      .replace(/(?!^)-/g, "");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!modalRepuesto.classList.contains("hidden")) cerrarModalRepuesto();
      if (!modalAjustar.classList.contains("hidden")) cerrarModalAjustar();
      if (!modalDetalle.classList.contains("hidden")) cerrarDetalle();
    }
  });

  [modalRepuesto, modalAjustar, modalDetalle].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (modal === modalRepuesto) cerrarModalRepuesto();
        else if (modal === modalAjustar) cerrarModalAjustar();
        else cerrarDetalle();
      }
    });
  });
};
