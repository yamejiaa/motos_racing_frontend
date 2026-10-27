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
let categoriaActual = null;

const modalCategoria = document.getElementById("modal-categoria");
const modalCategoriaTitulo = document.getElementById("modal-categoria-titulo");
const formCategoria = document.getElementById("form-categoria");
const inputId = document.getElementById("categoria-id");
const inputNombre = document.getElementById("categoria-nombre");
const inputDescripcion = document.getElementById("categoria-descripcion");
const btnCancelar = document.getElementById("btn-cancelar-categoria");
const btnGuardar = document.getElementById("btn-guardar-categoria");

export const renderCategorias = async () => {
  crearTablaCategorias();
  bindEventos();
};

const crearTablaCategorias = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-categorias"),

    columnas: [
      {
        key: "nombre",
        label: "Categoria",
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
            <button class="btn-editar-categoria bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" title="Editar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button class="btn-toggle-categoria ${r.activo ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500" : "bg-green-500/10 hover:bg-green-500/20 text-green-500"} text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-activo="${r.activo}" title="${r.activo ? "Desactivar" : "Activar"}">
              ${
                r.activo
                  ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>`
                  : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
              }
            </button>
            <button class="btn-eliminar-categoria bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium p-2 rounded-lg transition-colors" data-id="${r._id}" data-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}" title="Eliminar">
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
      const data = await api.listarCategoriasRepuestos(params);
      return { total: data.total, data: data.categorias };
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

    labelBuscador: "Buscar categoria",
    placeholder: "Nombre de la categoria...",
    mensajeVacio: "Aun no hay categorias registradas.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>',
  });

  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
    Nueva categoria
  `;
  btnNuevo.addEventListener("click", abrirModalCrear);
  tabla.acciones.appendChild(btnNuevo);

  document
    .getElementById("tabla-categorias")
    .addEventListener("click", async (e) => {
      const btnEditar = e.target.closest(".btn-editar-categoria");
      if (btnEditar) {
        e.stopPropagation();
        await abrirModalEditar(btnEditar.dataset.id);
        return;
      }

      const btnToggle = e.target.closest(".btn-toggle-categoria");
      if (btnToggle) {
        e.stopPropagation();
        await toggleActivo(
          btnToggle.dataset.id,
          btnToggle.dataset.activo === "true",
        );
        return;
      }

      const btnEliminar = e.target.closest(".btn-eliminar-categoria");
      if (btnEliminar) {
        e.stopPropagation();
        await eliminarCategoria(
          btnEliminar.dataset.id,
          btnEliminar.dataset.nombre,
        );
        return;
      }
    });
};

const abrirModalCrear = () => {
  categoriaActual = null;
  modalCategoriaTitulo.textContent = "Nueva categoria";
  formCategoria.reset();
  inputId.value = "";
  formCategoria
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => el.removeAttribute("data-has-value"));
  limpiarMensajesFormulario(formCategoria);
  bloquearScroll();
  modalCategoria.classList.remove("hidden");
  modalCategoria.classList.add("flex");
  setTimeout(() => inputNombre.focus(), 100);
};

const abrirModalEditar = async (id) => {
  limpiarMensajesFormulario(formCategoria);
  try {
    const data = await api.obtenerCategoriaRepuesto(id);
    const c = data.categoria;
    categoriaActual = c;
    modalCategoriaTitulo.textContent = "Editar categoria";
    inputId.value = c._id;
    inputNombre.value = c.nombre || "";
    inputDescripcion.value = c.descripcion || "";
    formCategoria
      .querySelectorAll(".field input, .field textarea")
      .forEach((el) => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      });
    bloquearScroll();
    modalCategoria.classList.remove("hidden");
    modalCategoria.classList.add("flex");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const cerrarModal = () => {
  modalCategoria.classList.add("hidden");
  modalCategoria.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formCategoria);
};

const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formCategoria);

  const datos = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim() || undefined,
  };

  if (!datos.nombre || datos.nombre.length < 2) {
    return mostrarMensajeFormulario(
      formCategoria,
      "El nombre debe tener al menos 2 caracteres",
      "error",
    );
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (categoriaActual)
      await api.actualizarCategoriaRepuesto(categoriaActual._id, datos);
    else await api.crearCategoriaRepuesto(datos);
    cerrarModal();
    await tabla.recargar();
    alertaExito(
      categoriaActual ? "Categoria actualizada" : "Categoria creada",
      "Los cambios se guardaron",
    );
  } catch (error) {
    mostrarMensajeFormulario(formCategoria, error.message, "error");
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar";
  }
};

const toggleActivo = async (id, estaActivo) => {
  const accion = estaActivo ? "desactivar" : "activar";
  const confirmado = await confirmar(
    `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} categoria?`,
    estaActivo
      ? "No aparecera al crear repuestos."
      : "Volvera a estar disponible.",
    `Si, ${accion}`,
  );
  if (!confirmado) return;
  try {
    await api.actualizarCategoriaRepuesto(id, { activo: !estaActivo });
    await tabla.recargar();
    toast(`Categoria ${estaActivo ? "desactivada" : "activada"}`, "success");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const eliminarCategoria = async (id, nombre) => {
  const confirmado = await confirmar(
    "Eliminar categoria",
    `¿Estas seguro de eliminar "${nombre}"? Si tiene repuestos asociados, solo se desactivara.`,
    "Si, eliminar",
  );
  if (!confirmado) return;
  try {
    const data = await api.eliminarCategoriaRepuesto(id);
    await tabla.recargar();
    alertaExito("Listo", data.msg);
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const bindEventos = () => {
  formCategoria.addEventListener("submit", manejarGuardar);
  btnCancelar.addEventListener("click", cerrarModal);

  formCategoria
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => {
      const sync = () => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalCategoria.classList.contains("hidden"))
      cerrarModal();
  });

  modalCategoria.addEventListener("click", (e) => {
    if (e.target === modalCategoria) cerrarModal();
  });
};
