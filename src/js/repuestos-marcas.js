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
let marcaActual = null;

const modalMarca = document.getElementById("modal-marca");
const modalMarcaTitulo = document.getElementById("modal-marca-titulo");
const formMarca = document.getElementById("form-marca");
const inputId = document.getElementById("marca-id");
const inputNombre = document.getElementById("marca-nombre");
const inputDescripcion = document.getElementById("marca-descripcion");
const btnCancelar = document.getElementById("btn-cancelar-marca");
const btnGuardar = document.getElementById("btn-guardar-marca");

// ─── Render ──────────────────────────────────────
export const renderMarcas = async () => {
  crearTablaMarcas();
  bindEventos();
};

const crearTablaMarcas = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-marcas"),

    columnas: [
      {
        key: "nombre",
        label: "Marca",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombre}</span>`,
      },
      {
        key: "descripcion",
        label: "Descripcion",
        render: (r) => r.descripcion || '<span class="text-zinc-600">-</span>',
      },
      {
        key: "activo",
        label: "Estado",
        render: (r) =>
          r.activo
            ? `<span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activa
            </span>`
            : `<span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactiva
            </span>`,
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <div class="flex items-center justify-end gap-1">
            <button class="btn-editar-marca bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" title="Editar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="btn-toggle-marca ${r.activo ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500" : "bg-green-500/10 hover:bg-green-500/20 text-green-500"} text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-activo="${r.activo}" title="${r.activo ? "Desactivar" : "Activar"}">
              ${
                r.activo
                  ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>`
                  : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
              }
            </button>
            <button class="btn-eliminar-marca bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}" title="Eliminar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        `,
      },
    ],

    cargar: async ({ page, limit, search, activo }) => {
      const params = { page, limit, search };
      if (activo !== undefined && activo !== "") params.activo = activo;
      const data = await api.listarMarcasRepuestos(params);
      return { total: data.total, data: data.marcas };
    },

    filtros: [
      {
        label: "Estado",
        id: "activo",
        opciones: [
          { value: "", label: "Todas" },
          { value: "true", label: "Solo activas" },
          { value: "false", label: "Solo inactivas" },
        ],
      },
    ],

    labelBuscador: "Buscar marca",
    placeholder: "Nombre de la marca...",
    mensajeVacio: "Aun no hay marcas registradas.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>',
  });

  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
    Nueva marca
  `;
  btnNuevo.addEventListener("click", abrirModalCrear);
  tabla.acciones.appendChild(btnNuevo);

  document
    .getElementById("tabla-marcas")
    .addEventListener("click", async (e) => {
      const btnEditar = e.target.closest(".btn-editar-marca");
      if (btnEditar) {
        e.stopPropagation();
        await abrirModalEditar(btnEditar.dataset.id);
        return;
      }

      const btnToggle = e.target.closest(".btn-toggle-marca");
      if (btnToggle) {
        e.stopPropagation();
        await toggleActivo(
          btnToggle.dataset.id,
          btnToggle.dataset.activo === "true",
        );
        return;
      }

      const btnEliminar = e.target.closest(".btn-eliminar-marca");
      if (btnEliminar) {
        e.stopPropagation();
        await eliminarMarca(btnEliminar.dataset.id, btnEliminar.dataset.nombre);
        return;
      }
    });
};

// ─── Modal crear ─────────────────────────────────
const abrirModalCrear = () => {
  marcaActual = null;
  modalMarcaTitulo.textContent = "Nueva marca";
  formMarca.reset();
  inputId.value = "";
  formMarca
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => el.removeAttribute("data-has-value"));
  limpiarMensajesFormulario(formMarca);
  bloquearScroll();
  modalMarca.classList.remove("hidden");
  modalMarca.classList.add("flex");
  setTimeout(() => inputNombre.focus(), 100);
};

const abrirModalEditar = async (id) => {
  limpiarMensajesFormulario(formMarca);
  try {
    const data = await api.obtenerMarcaRepuesto(id);
    const m = data.marca;
    marcaActual = m;
    modalMarcaTitulo.textContent = "Editar marca";
    inputId.value = m._id;
    inputNombre.value = m.nombre || "";
    inputDescripcion.value = m.descripcion || "";
    formMarca
      .querySelectorAll(".field input, .field textarea")
      .forEach((el) => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      });
    bloquearScroll();
    modalMarca.classList.remove("hidden");
    modalMarca.classList.add("flex");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const cerrarModal = () => {
  modalMarca.classList.add("hidden");
  modalMarca.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formMarca);
};

const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formMarca);

  const datos = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim() || undefined,
  };

  if (!datos.nombre || datos.nombre.length < 2) {
    return mostrarMensajeFormulario(
      formMarca,
      "El nombre debe tener al menos 2 caracteres",
      "error",
    );
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (marcaActual) await api.actualizarMarcaRepuesto(marcaActual._id, datos);
    else await api.crearMarcaRepuesto(datos);
    cerrarModal();
    await tabla.recargar();
    alertaExito(
      marcaActual ? "Marca actualizada" : "Marca creada",
      "Los cambios se guardaron",
    );
  } catch (error) {
    mostrarMensajeFormulario(formMarca, error.message, "error");
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar";
  }
};

const toggleActivo = async (id, estaActivo) => {
  const accion = estaActivo ? "desactivar" : "activar";
  const confirmado = await confirmar(
    `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} marca?`,
    estaActivo
      ? "No aparecera al crear repuestos."
      : "Volvera a estar disponible.",
    `Si, ${accion}`,
  );
  if (!confirmado) return;
  try {
    await api.actualizarMarcaRepuesto(id, { activo: !estaActivo });
    await tabla.recargar();
    toast(`Marca ${estaActivo ? "desactivada" : "activada"}`, "success");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const eliminarMarca = async (id, nombre) => {
  const confirmado = await confirmar(
    "Eliminar marca",
    `¿Estas seguro de eliminar "${nombre}"? Si tiene repuestos asociados, solo se desactivara.`,
    "Si, eliminar",
  );
  if (!confirmado) return;
  try {
    const data = await api.eliminarMarcaRepuesto(id);
    await tabla.recargar();
    alertaExito("Listo", data.msg);
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const bindEventos = () => {
  formMarca.addEventListener("submit", manejarGuardar);
  btnCancelar.addEventListener("click", cerrarModal);

  formMarca.querySelectorAll(".field input, .field textarea").forEach((el) => {
    const sync = () => {
      if (el.value) el.setAttribute("data-has-value", "true");
      else el.removeAttribute("data-has-value");
    };
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalMarca.classList.contains("hidden"))
      cerrarModal();
  });

  modalMarca.addEventListener("click", (e) => {
    if (e.target === modalMarca) cerrarModal();
  });
};
