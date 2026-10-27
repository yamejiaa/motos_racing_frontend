import { api } from "./api.js";
import { construirLayout } from "./layout.js";
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

// ═══════════════════════════════════════════════════
// Referencias globales
// ═══════════════════════════════════════════════════

// Catalogo
const modalServicio = document.getElementById("modal-servicio");
const modalServicioTitulo = document.getElementById("modal-servicio-titulo");
const formServicio = document.getElementById("form-servicio");
const inputId = document.getElementById("servicio-id");
const inputNombre = document.getElementById("servicio-nombre");
const inputDescripcion = document.getElementById("servicio-descripcion");
const inputPrecio = document.getElementById("servicio-precio");
const btnCancelar = document.getElementById("btn-cancelar-servicio");
const btnGuardar = document.getElementById("btn-guardar-servicio");

// Diarios
const modalDiario = document.getElementById("modal-diario");
const formDiario = document.getElementById("form-diario");
const btnCancelarDiario = document.getElementById("btn-cancelar-diario");
const btnGuardarDiario = document.getElementById("btn-guardar-diario");

const btnSelectServicio = document.getElementById("btn-select-servicio");
const dropdownServicio = document.getElementById("dropdown-servicio");
const buscadorServicio = document.getElementById("buscador-servicio");
const listaServiciosOpciones = document.getElementById(
  "lista-servicios-opciones",
);
const labelSelectServicio = document.getElementById("label-select-servicio");
const inputDiarioServicioId = document.getElementById("diario-servicio-id");

const btnSelectMecanico = document.getElementById("btn-select-mecanico");
const dropdownMecanico = document.getElementById("dropdown-mecanico");
const buscadorMecanico = document.getElementById("buscador-mecanico");
const listaMecanicosOpciones = document.getElementById(
  "lista-mecanicos-opciones",
);
const labelSelectMecanico = document.getElementById("label-select-mecanico");
const inputDiarioMecanicoId = document.getElementById("diario-mecanico-id");

const inputDiarioPrecio = document.getElementById("diario-precio");
const inputDiarioRecibido = document.getElementById("diario-recibido");
const resumen = document.getElementById("diario-resumen");
const resumenCambio = document.getElementById("diario-cambio");
const resumenComMec = document.getElementById("diario-comision-mecanico");
const resumenComTaller = document.getElementById("diario-comision-taller");

// Detalle
const modalDetalleDiario = document.getElementById("modal-detalle-diario");
const detalleDiarioContenido = document.getElementById(
  "detalle-diario-contenido",
);

// Estado
let tablaCatalogo;
let tablaDiarios;
let servicioActual = null;
let serviciosCache = []; // para el dropdown del modal diario
let mecanicosCache = []; // idem

// ═══════════════════════════════════════════════════
// Utilidades
// ═══════════════════════════════════════════════════
const formatearMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);

const formatearInputMoneda = (valor) => {
  const num = String(valor).replace(/\D/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString("es-CO");
};

const parsearMoneda = (str) => {
  const num = String(str).replace(/\D/g, "");
  return num ? parseInt(num, 10) : 0;
};

// ═══════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════
const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const vista = params.get("view");
  const esDiarios = vista === "diarios";

  const usuario = await construirLayout({
    titulo: "Servicios",
    subtitulo: esDiarios
      ? "Historial de servicios diarios"
      : "Catalogo de servicios de mano de obra",
    itemActivo: "servicios",
  });

  if (!usuario) return;

  if (esDiarios) {
    document.getElementById("vista-catalogo").classList.add("hidden");
    document.getElementById("vista-diarios").classList.remove("hidden");
    crearTablaDiarios();
    bindEventosDiarios();
  } else {
    document.getElementById("vista-catalogo").classList.remove("hidden");
    document.getElementById("vista-diarios").classList.add("hidden");
    crearTablaCatalogo();
    bindEventosCatalogo();
  }
};

// ═══════════════════════════════════════════════════
// CATALOGO
// ═══════════════════════════════════════════════════
const crearTablaCatalogo = () => {
  tablaCatalogo = crearTabla({
    contenedor: document.getElementById("tabla-servicios"),

    columnas: [
      {
        key: "nombre",
        label: "Servicio",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombre}</span>`,
      },
      {
        key: "descripcion",
        label: "Descripcion",
        render: (r) => {
          if (!r.descripcion) return '<span class="text-zinc-600">-</span>';
          const txt =
            r.descripcion.length > 60
              ? r.descripcion.slice(0, 60) + "..."
              : r.descripcion;
          return `<span class="text-zinc-400 text-sm">${txt}</span>`;
        },
      },
      {
        key: "precioBase",
        label: "Precio base",
        render: (r) =>
          `<span class="font-medium text-brand">${formatearMoneda(r.precioBase)}</span>`,
      },
      {
        key: "activo",
        label: "Estado",
        render: (r) => {
          if (r.activo) {
            return `<span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Activo</span>`;
          }
          return `<span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactivo</span>`;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <div class="flex items-center justify-end gap-1">
            <button class="btn-editar-servicio inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors" data-servicio-id="${r._id}" title="Editar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span class="hidden sm:inline">Editar</span>
            </button>
            <button class="btn-toggle-servicio inline-flex items-center gap-1.5 ${r.activo ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500" : "bg-green-500/10 hover:bg-green-500/20 text-green-500"} text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors" data-servicio-id="${r._id}" data-activo="${r.activo}" title="${r.activo ? "Desactivar" : "Activar"}">
              ${
                r.activo
                  ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg><span class="hidden sm:inline">Desactivar</span>`
                  : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="hidden sm:inline">Activar</span>`
              }
            </button>
            <button class="btn-eliminar-servicio inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors" data-servicio-id="${r._id}" data-servicio-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}" title="Eliminar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        `,
      },
    ],

    cargar: async ({ page, limit, search, activo }) => {
      const params = { page, limit, search };
      if (activo !== undefined && activo !== "") params.activo = activo;

      const data = await api.listarServicios(params);
      return { total: data.total, data: data.servicios };
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
    ],

    labelBuscador: "Buscar servicio",
    placeholder: "Nombre del servicio...",
    mensajeVacio: "Aun no hay servicios registrados.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
  });

  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
    Nuevo servicio
  `;
  btnNuevo.addEventListener("click", abrirModalCrear);
  tablaCatalogo.acciones.appendChild(btnNuevo);

  document
    .getElementById("tabla-servicios")
    .addEventListener("click", async (e) => {
      const btnEditar = e.target.closest(".btn-editar-servicio");
      if (btnEditar) {
        e.stopPropagation();
        await abrirModalEditar(btnEditar.dataset.servicioId);
        return;
      }

      const btnToggle = e.target.closest(".btn-toggle-servicio");
      if (btnToggle) {
        e.stopPropagation();
        await toggleActivo(
          btnToggle.dataset.servicioId,
          btnToggle.dataset.activo === "true",
        );
        return;
      }

      const btnEliminar = e.target.closest(".btn-eliminar-servicio");
      if (btnEliminar) {
        e.stopPropagation();
        await eliminarServicio(
          btnEliminar.dataset.servicioId,
          btnEliminar.dataset.servicioNombre,
        );
        return;
      }
    });
};

const abrirModalCrear = () => {
  servicioActual = null;
  modalServicioTitulo.textContent = "Nuevo servicio";
  formServicio.reset();
  inputId.value = "";
  inputPrecio.value = "";
  formServicio
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => el.removeAttribute("data-has-value"));
  limpiarMensajesFormulario(formServicio);
  bloquearScroll();
  modalServicio.classList.remove("hidden");
  modalServicio.classList.add("flex");
  setTimeout(() => inputNombre.focus(), 100);
};

const abrirModalEditar = async (id) => {
  limpiarMensajesFormulario(formServicio);
  try {
    const data = await api.obtenerServicio(id);
    const s = data.servicio;
    servicioActual = s;
    modalServicioTitulo.textContent = "Editar servicio";
    inputId.value = s._id;
    inputNombre.value = s.nombre || "";
    inputDescripcion.value = s.descripcion || "";
    inputPrecio.value = formatearInputMoneda(s.precioBase || 0);
    formServicio
      .querySelectorAll(".field input, .field textarea")
      .forEach((el) => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      });
    bloquearScroll();
    modalServicio.classList.remove("hidden");
    modalServicio.classList.add("flex");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const cerrarModalServicio = () => {
  modalServicio.classList.add("hidden");
  modalServicio.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formServicio);
};

const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formServicio);

  const datos = {
    nombre: inputNombre.value.trim(),
    descripcion: inputDescripcion.value.trim() || undefined,
    precioBase: parsearMoneda(inputPrecio.value),
  };

  if (!datos.nombre || datos.nombre.length < 3) {
    return mostrarMensajeFormulario(
      formServicio,
      "El nombre debe tener al menos 3 caracteres",
      "error",
    );
  }
  if (datos.precioBase <= 0) {
    return mostrarMensajeFormulario(
      formServicio,
      "El precio base debe ser mayor a 0",
      "error",
    );
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (servicioActual) await api.actualizarServicio(servicioActual._id, datos);
    else await api.crearServicio(datos);
    cerrarModalServicio();
    await tablaCatalogo.recargar();
    alertaExito(
      servicioActual ? "Servicio actualizado" : "Servicio creado",
      "Los cambios se guardaron correctamente",
    );
  } catch (error) {
    mostrarMensajeFormulario(
      formServicio,
      error.message || "Error al guardar",
      "error",
    );
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar";
  }
};

const toggleActivo = async (id, estaActivo) => {
  const accion = estaActivo ? "desactivar" : "activar";
  const confirmado = await confirmar(
    `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} servicio?`,
    estaActivo
      ? "El servicio no aparecera como opcion al registrar servicios diarios."
      : "El servicio volvera a estar disponible.",
    `Si, ${accion}`,
  );
  if (!confirmado) return;
  try {
    await api.actualizarServicio(id, { activo: !estaActivo });
    await tablaCatalogo.recargar();
    toast(`Servicio ${estaActivo ? "desactivado" : "activado"}`, "success");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const eliminarServicio = async (id, nombre) => {
  const confirmado = await confirmar(
    "Eliminar servicio",
    `¿Estas seguro de eliminar "${nombre}"? Si tiene mantenimientos asociados, solo se desactivara.`,
    "Si, eliminar",
  );
  if (!confirmado) return;
  try {
    const data = await api.eliminarServicio(id);
    await tablaCatalogo.recargar();
    alertaExito("Listo", data.msg);
  } catch (error) {
    alertaError("Error", error.message);
  }
};

const bindEventosCatalogo = () => {
  formServicio.addEventListener("submit", manejarGuardar);
  btnCancelar.addEventListener("click", cerrarModalServicio);

  formServicio
    .querySelectorAll(".field input, .field textarea, .field select")
    .forEach((el) => {
      const sync = () => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

  inputPrecio.addEventListener("input", (e) => {
    const valor = parsearMoneda(e.target.value);
    e.target.value = valor > 0 ? valor.toLocaleString("es-CO") : "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalServicio.classList.contains("hidden"))
      cerrarModalServicio();
  });

  modalServicio.addEventListener("click", (e) => {
    if (e.target === modalServicio) cerrarModalServicio();
  });
};

// ═══════════════════════════════════════════════════
// DIARIOS
// ═══════════════════════════════════════════════════
const crearTablaDiarios = () => {
  tablaDiarios = crearTabla({
    contenedor: document.getElementById("tabla-diarios"),

    columnas: [
      {
        key: "fecha",
        label: "Fecha",
        render: (r) => {
          const d = new Date(r.fecha);
          return `<span class="text-zinc-300 text-sm whitespace-nowrap">${d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>`;
        },
      },
      {
        key: "servicio",
        label: "Servicio",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombreServicio}</span>`,
      },
      {
        key: "mecanico",
        label: "Mecanico",
        render: (r) => `<span class="text-zinc-300">${r.nombreMecanico}</span>`,
      },
      {
        key: "precioServicio",
        label: "Precio",
        render: (r) =>
          `<span class="font-medium text-brand">${formatearMoneda(r.precioServicio)}</span>`,
      },
      {
        key: "recibido",
        label: "Recibido",
        render: (r) => {
          if (r.pagadoAlMecanico) {
            return `<span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Recibido
            </span>`;
          }
          return `<span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            Pendiente
          </span>`;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <button class="btn-ver-diario inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" data-diario-id="${r._id}" title="Ver detalles">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <span class="hidden sm:inline">Ver detalle</span>
          </button>
        `,
      },
    ],

    cargar: async ({ page, limit, search, desde, hasta }) => {
      const params = { page, limit, search };
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;

      const data = await api.listarServiciosDiarios(params);
      return { total: data.total, data: data.serviciosDiarios };
    },

    filtros: [
      {
        label: "Ultimos 30 dias",
        id: "rango",
        opciones: [
          { value: "", label: "Todos" },
          { value: "30", label: "Ultimos 30 dias" },
          { value: "7", label: "Ultimos 7 dias" },
          { value: "1", label: "Hoy" },
        ],
      },
    ],

    labelBuscador: "Buscar por mecanico o servicio",
    placeholder: "Nombre, cedula o servicio...",
    mensajeVacio: "Aun no hay servicios diarios registrados.",
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>',
  });

  // Boton "Registrar servicio diario"
  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
    Registrar servicio diario
  `;
  btnNuevo.addEventListener("click", abrirModalDiario);
  tablaDiarios.acciones.appendChild(btnNuevo);

  // Delegacion de clicks en la tabla
  document
    .getElementById("tabla-diarios")
    .addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-ver-diario");
      if (!btn) return;
      e.stopPropagation();
      await abrirDetalleDiario(btn.dataset.diarioId);
    });
};

// ─── Modal registrar servicio diario ──────────────
const abrirModalDiario = async () => {
  formDiario.reset();
  inputDiarioServicioId.value = "";
  inputDiarioMecanicoId.value = "";
  inputDiarioPrecio.value = "";
  inputDiarioRecibido.value = "";
  labelSelectServicio.textContent = "Seleccionar servicio...";
  labelSelectServicio.classList.add("text-zinc-500");
  labelSelectMecanico.textContent = "Seleccionar mecanico...";
  labelSelectMecanico.classList.add("text-zinc-500");
  resumen.classList.add("hidden");
  dropdownServicio.classList.add("hidden");
  dropdownMecanico.classList.add("hidden");
  buscadorServicio.value = "";
  buscadorMecanico.value = "";
  limpiarMensajesFormulario(formDiario);

  // Cargar caches
  try {
    const [dataServicios, dataMecanicos] = await Promise.all([
      api.listarServicios({ limit: 200, activo: "true" }),
      api.listarMecanicos({ limit: 200, activo: "true" }),
    ]);
    serviciosCache = dataServicios.servicios || [];
    mecanicosCache = dataMecanicos.mecanicos || [];
  } catch (error) {
    alertaError("Error al cargar datos", error.message);
    return;
  }

  renderizarOpcionesServicios("");
  renderizarOpcionesMecanicos("");

  bloquearScroll();
  modalDiario.classList.remove("hidden");
  modalDiario.classList.add("flex");
};

const cerrarModalDiario = () => {
  modalDiario.classList.add("hidden");
  modalDiario.classList.remove("flex");
  dropdownServicio.classList.add("hidden");
  dropdownMecanico.classList.add("hidden");
  desbloquearScroll();
  limpiarMensajesFormulario(formDiario);
};

// ─── Dropdown servicios ───────────────────────────
const renderizarOpcionesServicios = (filtro) => {
  const regex = new RegExp(filtro, "i");
  const filtrados = serviciosCache.filter((s) => regex.test(s.nombre));

  if (filtrados.length === 0) {
    listaServiciosOpciones.innerHTML = `<div class="px-4 py-3 text-sm text-zinc-500">No hay servicios</div>`;
    return;
  }

  listaServiciosOpciones.innerHTML = filtrados
    .map(
      (s) => `
    <button type="button" class="opcion-servicio w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors flex items-center justify-between gap-2" data-id="${s._id}" data-nombre="${s.nombre}" data-precio="${s.precioBase}">
      <span class="truncate">${s.nombre}</span>
      <span class="text-brand text-xs shrink-0">${formatearMoneda(s.precioBase)}</span>
    </button>
  `,
    )
    .join("");

  listaServiciosOpciones.querySelectorAll(".opcion-servicio").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { id, nombre, precio } = btn.dataset;
      inputDiarioServicioId.value = id;
      labelSelectServicio.textContent = nombre;
      labelSelectServicio.classList.remove("text-zinc-500");
      inputDiarioPrecio.value = formatearMoneda(Number(precio));
      inputDiarioPrecio.setAttribute("data-has-value", "true");
      dropdownServicio.classList.add("hidden");
      actualizarResumen();
    });
  });
};

// ─── Dropdown mecanicos ───────────────────────────
const renderizarOpcionesMecanicos = (filtro) => {
  const regex = new RegExp(filtro, "i");
  const filtrados = mecanicosCache.filter(
    (m) => regex.test(m.nombre) || regex.test(m.cedula || ""),
  );

  if (filtrados.length === 0) {
    listaMecanicosOpciones.innerHTML = `<div class="px-4 py-3 text-sm text-zinc-500">No hay mecanicos</div>`;
    return;
  }

  listaMecanicosOpciones.innerHTML = filtrados
    .map(
      (m) => `
    <button type="button" class="opcion-mecanico w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors flex items-center justify-between gap-2" data-id="${m._id}" data-nombre="${m.nombre}">
      <span class="truncate">${m.nombre}</span>
      <span class="text-zinc-500 text-xs shrink-0">${m.cedula || ""}</span>
    </button>
  `,
    )
    .join("");

  listaMecanicosOpciones.querySelectorAll(".opcion-mecanico").forEach((btn) => {
    btn.addEventListener("click", () => {
      inputDiarioMecanicoId.value = btn.dataset.id;
      labelSelectMecanico.textContent = btn.dataset.nombre;
      labelSelectMecanico.classList.remove("text-zinc-500");
      dropdownMecanico.classList.add("hidden");
    });
  });
};

// ─── Calcular resumen en vivo ─────────────────────
const actualizarResumen = () => {
  const precioStr = inputDiarioPrecio.value || "0";
  const precio = parsearMoneda(precioStr);
  const recibido = parsearMoneda(inputDiarioRecibido.value);

  if (precio <= 0) {
    resumen.classList.add("hidden");
    return;
  }

  const cambio = Math.max(recibido - precio, 0);
  const comMec = Math.round(precio * 0.3);
  const comTaller = precio - comMec;

  resumenCambio.textContent = formatearMoneda(cambio);
  resumenComMec.textContent = formatearMoneda(comMec);
  resumenComTaller.textContent = formatearMoneda(comTaller);

  resumen.classList.remove("hidden");
};

// ─── Guardar servicio diario ──────────────────────
const manejarGuardarDiario = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formDiario);

  const servicioId = inputDiarioServicioId.value;
  const mecanicoId = inputDiarioMecanicoId.value;
  const montoRecibido = parsearMoneda(inputDiarioRecibido.value);

  if (!servicioId) {
    return mostrarMensajeFormulario(
      formDiario,
      "Debes seleccionar un servicio",
      "error",
    );
  }
  if (!mecanicoId) {
    return mostrarMensajeFormulario(
      formDiario,
      "Debes seleccionar un mecanico",
      "error",
    );
  }
  if (montoRecibido <= 0) {
    return mostrarMensajeFormulario(
      formDiario,
      "Debes ingresar el monto recibido",
      "error",
    );
  }

  btnGuardarDiario.disabled = true;
  btnGuardarDiario.textContent = "Registrando...";

  try {
    await api.crearServicioDiario({ servicioId, mecanicoId, montoRecibido });
    cerrarModalDiario();
    await tablaDiarios.recargar();
    alertaExito(
      "Servicio registrado",
      "El servicio diario se registro correctamente",
    );
  } catch (error) {
    mostrarMensajeFormulario(
      formDiario,
      error.message || "Error al registrar",
      "error",
    );
  } finally {
    btnGuardarDiario.disabled = false;
    btnGuardarDiario.textContent = "Confirmar servicio";
  }
};

// ─── Modal detalle diario ─────────────────────────
const abrirDetalleDiario = async (id) => {
  detalleDiarioContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;
  bloquearScroll();
  modalDetalleDiario.classList.remove("hidden");
  modalDetalleDiario.classList.add("flex");

  try {
    const data = await api.obtenerServicioDiario(id);
    const s = data.servicioDiario;

    const fecha = new Date(s.fecha).toLocaleString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    detalleDiarioContenido.innerHTML = `
      <div class="space-y-4">
        <div>
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fecha</p>
          <p class="text-sm text-white">${fecha}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Servicio</p>
            <p class="text-sm text-white">${s.nombreServicio}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Mecanico</p>
            <p class="text-sm text-white">${s.nombreMecanico}</p>
            ${s.cedulaMecanico ? `<p class="text-xs text-zinc-500">CC: ${s.cedulaMecanico}</p>` : ""}
          </div>
        </div>

        <div class="pt-4 border-t border-ink-border">
          <h3 class="text-sm font-bold text-white mb-3">Detalle economico</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-zinc-500">Precio del servicio:</span>
              <span class="text-white font-medium">${formatearMoneda(s.precioServicio)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Monto recibido:</span>
              <span class="text-white font-medium">${formatearMoneda(s.montoRecibido)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Cambio devuelto:</span>
              <span class="text-white font-medium">${formatearMoneda(s.cambio)}</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-ink-border">
              <span class="text-zinc-500">Comision del mecanico (${(s.porcentajeComision * 100).toFixed(0)}%):</span>
              <span class="text-yellow-500 font-medium">${formatearMoneda(s.comisionMecanico)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Comision del taller:</span>
              <span class="text-brand font-medium">${formatearMoneda(s.comisionTaller)}</span>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-ink-border">
          <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Estado del pago al mecanico</p>
          ${
            s.pagadoAlMecanico
              ? `<p class="text-sm text-green-500 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                Pagado ${s.fechaPagoMecanico ? `el ${new Date(s.fechaPagoMecanico).toLocaleDateString("es-CO")}` : ""}
              </p>`
              : `<p class="text-sm text-yellow-500 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/></svg>
                Pendiente de pago
              </p>`
          }
        </div>

        ${
          s.registradoPor
            ? `
          <div class="pt-4 border-t border-ink-border">
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Registrado por</p>
            <p class="text-sm text-zinc-300">${s.registradoPor.nombre || "-"}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  } catch (error) {
    detalleDiarioContenido.innerHTML = `<p class="text-red-400 text-sm text-center py-8">Error al cargar el detalle</p>`;
  }
};

const cerrarDetalleDiario = () => {
  modalDetalleDiario.classList.add("hidden");
  modalDetalleDiario.classList.remove("flex");
  desbloquearScroll();
};

// ─── Eventos de la vista Diarios ──────────────────
const bindEventosDiarios = () => {
  // Modal registrar servicio diario
  formDiario.addEventListener("submit", manejarGuardarDiario);
  btnCancelarDiario.addEventListener("click", cerrarModalDiario);

  // Dropdown servicio
  btnSelectServicio.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownServicio.classList.toggle("hidden");
    dropdownMecanico.classList.add("hidden");
    if (!dropdownServicio.classList.contains("hidden")) {
      setTimeout(() => buscadorServicio.focus(), 50);
    }
  });
  buscadorServicio.addEventListener("input", (e) =>
    renderizarOpcionesServicios(e.target.value),
  );

  // Dropdown mecanico
  btnSelectMecanico.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMecanico.classList.toggle("hidden");
    dropdownServicio.classList.add("hidden");
    if (!dropdownMecanico.classList.contains("hidden")) {
      setTimeout(() => buscadorMecanico.focus(), 50);
    }
  });
  buscadorMecanico.addEventListener("input", (e) =>
    renderizarOpcionesMecanicos(e.target.value),
  );

  // Cerrar dropdowns al hacer click fuera
  document.addEventListener("click", (e) => {
    if (
      !dropdownServicio.contains(e.target) &&
      e.target !== btnSelectServicio
    ) {
      dropdownServicio.classList.add("hidden");
    }
    if (
      !dropdownMecanico.contains(e.target) &&
      e.target !== btnSelectMecanico
    ) {
      dropdownMecanico.classList.add("hidden");
    }
  });

  // Formatear monto recibido mientras se escribe
  inputDiarioRecibido.addEventListener("input", (e) => {
    const valor = parsearMoneda(e.target.value);
    e.target.value = valor > 0 ? valor.toLocaleString("es-CO") : "";
    if (valor) e.target.setAttribute("data-has-value", "true");
    else e.target.removeAttribute("data-has-value");
    actualizarResumen();
  });

  // Sincronizar labels del input precio (readonly)
  inputDiarioPrecio.addEventListener("change", () => {
    if (inputDiarioPrecio.value)
      inputDiarioPrecio.setAttribute("data-has-value", "true");
  });

  // Cerrar modal diario

  modalDiario.addEventListener("click", (e) => {
    if (e.target === modalDiario) cerrarModalDiario();
  });

  // Modal detalle
  modalDetalleDiario.addEventListener("click", (e) => {
    if (e.target === modalDetalleDiario) cerrarDetalleDiario();
  });
};

init();
