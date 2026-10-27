import { api } from "./api.js";
import { construirLayout } from "./layout.js";
import { renderVistaPagos } from "./pagos.js";
import { crearTabla } from "./tabla.js";
import { inicializarFechas, bindBotonesFechaHoy } from "./fechas.js";
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
import { esEmailValido, esTelefonoValido } from "./validaciones.js";

let tabla;
let mecanicoActual = null;

// Referencias modal crear/editar
const modalMecanico = document.getElementById("modal-mecanico");
const modalMecanicoTitulo = document.getElementById("modal-mecanico-titulo");
const formMecanico = document.getElementById("form-mecanico");
const inputId = document.getElementById("mecanico-id");
const inputNombre = document.getElementById("mecanico-nombre");
const inputEmail = document.getElementById("mecanico-email");
const inputCedula = document.getElementById("mecanico-cedula");
const inputTelefono = document.getElementById("mecanico-telefono");
const inputEspecialidad = document.getElementById("mecanico-especialidad");
const inputDireccion = document.getElementById("mecanico-direccion");
const inputFechaIngreso = document.getElementById("mecanico-fecha-ingreso");
const inputNotas = document.getElementById("mecanico-notas");
const btnCancelar = document.getElementById("btn-cancelar-mecanico");
const btnGuardar = document.getElementById("btn-guardar-mecanico");

// Referencias modal detalle
const modalDetalle = document.getElementById("modal-detalle-mecanico");
const detalleTitulo = document.getElementById("detalle-mecanico-titulo");
const detalleSubtitulo = document.getElementById("detalle-mecanico-subtitulo");
const detalleContenido = document.getElementById("detalle-mecanico-contenido");
const btnCerrarDetalle = document.getElementById("btn-cerrar-detalle-mecanico");

// ─── Init ────────────────────────────────────────
const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const vista = params.get("view");
  const esPagos = vista === "pagos";

  const usuario = await construirLayout({
    titulo: esPagos ? "Pagos y comisiones" : "Mecanicos",
    subtitulo: esPagos
      ? "Resumen de pagos pendientes y realizados"
      : "Gestion de mecanicos del taller",
    itemActivo: "mecanicos",
  });

  if (!usuario) return;

  if (esPagos) {
    // Vista de pagos
    document.getElementById("vista-lista").classList.add("hidden");
    document.getElementById("vista-pagos").classList.remove("hidden");
    await renderVistaPagos();
  } else {
    // Vista de lista normal
    document.getElementById("vista-lista").classList.remove("hidden");
    document.getElementById("vista-pagos").classList.add("hidden");
    crearTablaMecanicos();
    bindEventos();
  }
};

// ─── Tabla ───────────────────────────────────────
const crearTablaMecanicos = () => {
  tabla = crearTabla({
    contenedor: document.getElementById("tabla-mecanicos"),

    columnas: [
      {
        key: "nombre",
        label: "Nombre",
        render: (r) =>
          `<span class="font-medium text-white">${r.nombre}</span>`,
      },
      {
        key: "email",
        label: "Correo",
        render: (r) => r.email || '<span class="text-zinc-600">-</span>',
      },
      {
        key: "cedula",
        label: "Cedula",
        render: (r) => r.cedula || '<span class="text-zinc-600">-</span>',
      },
      {
        key: "telefono",
        label: "Telefono",
        render: (r) => r.telefono || '<span class="text-zinc-600">-</span>',
      },
      {
        key: "especialidad",
        label: "Especialidad",
        render: (r) => r.especialidad || '<span class="text-zinc-600">-</span>',
      },
      {
        key: "activo",
        label: "Estado",
        render: (r) => {
          if (r.activo) {
            return `
              <span class="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Activo
              </span>
            `;
          }
          return `
            <span class="inline-flex items-center gap-1.5 text-red-500 text-xs font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Inactivo
            </span>
          `;
        },
      },
      {
        key: "acciones",
        label: "Acciones",
        class: "text-right",
        render: (r) => `
          <div class="flex items-center justify-end gap-1">
            <button
              class="btn-detalle-mecanico inline-flex items-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              data-mecanico-id="${r._id}"
              title="Ver detalles"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <span class="hidden sm:inline">Detalles</span>
            </button>

            <button
              class="btn-toggle-mecanico inline-flex items-center gap-1.5 ${r.activo ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500" : "bg-green-500/10 hover:bg-green-500/20 text-green-500"} text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              data-mecanico-id="${r._id}"
              data-activo="${r.activo}"
              title="${r.activo ? "Desactivar" : "Activar"}"
            >
              ${
                r.activo
                  ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                   </svg>
                   <span class="hidden sm:inline">Bloquear</span>`
                  : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                   </svg>
                   <span class="hidden sm:inline">Activar</span>`
              }
            </button>

            <button
              class="btn-eliminar-mecanico inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              data-mecanico-id="${r._id}"
              data-mecanico-nombre="${(r.nombre || "").replace(/"/g, "&quot;")}"
              title="Eliminar"
            >
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

      const data = await api.listarMecanicos(params);
      return { total: data.total, data: data.mecanicos };
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

    labelBuscador: "Buscar mecanico",
    placeholder: "Nombre, correo o cedula...",
    mensajeVacio:
      'Aun no hay mecanicos registrados. Crea el primero con el boton "Nuevo mecanico".',
    iconoVacio:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17h2m14 0h2M5 17V9a3 3 0 013-3h8a3 3 0 013 3v8M5 17h14M5 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M17 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M9 6V5a3 3 0 013-3h0a3 3 0 013 3v1"/>',
  });

  // Boton "Nuevo mecanico"
  const btnNuevo = document.createElement("button");
  btnNuevo.className =
    "bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center gap-2";
  btnNuevo.innerHTML = `
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Nuevo mecanico
  `;
  btnNuevo.addEventListener("click", abrirModalCrear);
  tabla.acciones.appendChild(btnNuevo);

  // Delegacion de clicks en la tabla
  document
    .getElementById("tabla-mecanicos")
    .addEventListener("click", async (e) => {
      const btnDetalle = e.target.closest(".btn-detalle-mecanico");
      if (btnDetalle) {
        e.stopPropagation();
        await abrirDetalle(btnDetalle.dataset.mecanicoId);
        return;
      }

      const btnToggle = e.target.closest(".btn-toggle-mecanico");
      if (btnToggle) {
        e.stopPropagation();
        await toggleActivo(
          btnToggle.dataset.mecanicoId,
          btnToggle.dataset.activo === "true",
        );
        return;
      }

      const btnEliminar = e.target.closest(".btn-eliminar-mecanico");
      if (btnEliminar) {
        e.stopPropagation();
        await eliminarMecanico(
          btnEliminar.dataset.mecanicoId,
          btnEliminar.dataset.mecanicoNombre,
        );
        return;
      }
    });
};

// ─── Modal crear/editar ──────────────────────────
const abrirModalCrear = () => {
  mecanicoActual = null;
  modalMecanicoTitulo.textContent = "Nuevo mecanico";
  formMecanico.reset();
  inputId.value = "";

  formMecanico
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => {
      el.removeAttribute("data-has-value");
    });

  limpiarMensajesFormulario(formMecanico);

  inicializarFechas(formMecanico);
  bindBotonesFechaHoy(formMecanico);

  bloquearScroll();
  modalMecanico.classList.remove("hidden");
  modalMecanico.classList.add("flex");
};

const abrirModalEditar = (m) => {
  mecanicoActual = m;
  modalMecanicoTitulo.textContent = "Editar mecanico";
  limpiarMensajesFormulario(formMecanico);

  inputId.value = m._id;
  inputNombre.value = m.nombre || "";
  inputEmail.value = m.email || "";
  inputCedula.value = m.cedula || "";
  inputTelefono.value = m.telefono || "";
  inputEspecialidad.value = m.especialidad || "";
  inputDireccion.value = m.direccion || "";
  inputNotas.value = m.notas || "";

  if (m.fechaIngreso) {
    const fecha = new Date(m.fechaIngreso);
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    inputFechaIngreso.value = `${yyyy}-${mm}-${dd}`;
  } else {
    inputFechaIngreso.value = "";
  }

  inicializarFechas(formMecanico);
  bindBotonesFechaHoy(formMecanico);

  bloquearScroll();
  modalMecanico.classList.remove("hidden");
  modalMecanico.classList.add("flex");
};

const cerrarModalMecanico = () => {
  modalMecanico.classList.add("hidden");
  modalMecanico.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formMecanico);
};

// ─── Guardar ─────────────────────────────────────
const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formMecanico);

  const datos = {
    nombre: inputNombre.value.trim(),
    email: inputEmail.value.trim(),
    cedula: inputCedula.value.trim(),
    telefono: inputTelefono.value.trim() || undefined,
    especialidad: inputEspecialidad.value.trim() || undefined,
    direccion: inputDireccion.value.trim() || undefined,
    fechaIngreso: inputFechaIngreso.value || undefined,
    notas: inputNotas.value.trim() || undefined,
  };

  if (!datos.nombre || datos.nombre.length < 3) {
    return mostrarMensajeFormulario(
      formMecanico,
      "El nombre debe tener al menos 3 caracteres",
      "error",
    );
  }

  if (!datos.email || !esEmailValido(datos.email)) {
    return mostrarMensajeFormulario(
      formMecanico,
      "El correo no tiene un formato valido",
      "error",
    );
  }

  if (!datos.cedula) {
    return mostrarMensajeFormulario(
      formMecanico,
      "La cedula es obligatoria",
      "error",
    );
  }

  if (!/^\d{10}$/.test(datos.cedula)) {
    return mostrarMensajeFormulario(
      formMecanico,
      "La cedula debe tener exactamente 10 digitos numericos",
      "error",
    );
  }

  if (datos.telefono && !/^\d{10}$/.test(datos.telefono)) {
    return mostrarMensajeFormulario(
      formMecanico,
      "El telefono debe tener exactamente 10 digitos numericos",
      "error",
    );
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    if (mecanicoActual) {
      await api.actualizarMecanico(mecanicoActual._id, datos);
    } else {
      await api.crearMecanico(datos);
    }

    cerrarModalMecanico();
    await tabla.recargar();

    alertaExito(
      mecanicoActual ? "Mecanico actualizado" : "Mecanico creado",
      "Los cambios se guardaron correctamente",
    );
  } catch (error) {
    mostrarMensajeFormulario(
      formMecanico,
      error.message || "Error al guardar",
      "error",
    );
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar";
  }
};

// ─── Toggle activo ───────────────────────────────
const toggleActivo = async (id, estaActivo) => {
  const accion = estaActivo ? "bloquear" : "activar";

  const confirmado = await confirmar(
    `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} mecanico?`,
    estaActivo
      ? "El mecanico no podra recibir nuevas asignaciones de mantenimientos."
      : "El mecanico podra recibir asignaciones de mantenimientos.",
    `Si, ${accion}`,
  );

  if (!confirmado) return;

  try {
    const data = await api.toggleActivoMecanico(id);
    await tabla.recargar();
    toast(data.msg, "success");
  } catch (error) {
    alertaError("Error", error.message);
  }
};

// ─── Eliminar ────────────────────────────────────
const eliminarMecanico = async (id, nombre) => {
  const confirmado = await confirmar(
    "Eliminar mecanico",
    `¿Estas seguro de eliminar a "${nombre}"? Si tiene mantenimientos asociados, solo se desactivara.`,
    "Si, eliminar",
  );

  if (!confirmado) return;

  try {
    const data = await api.eliminarMecanico(id);
    await tabla.recargar();
    alertaExito("Listo", data.msg);
  } catch (error) {
    alertaError("Error", error.message);
  }
};

// ─── Detalle ─────────────────────────────────────
const abrirDetalle = async (id) => {
  detalleTitulo.textContent = "Detalle del mecanico";
  detalleSubtitulo.textContent = "Cargando...";
  detalleContenido.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
    </div>
  `;

  bloquearScroll();
  modalDetalle.classList.remove("hidden");
  modalDetalle.classList.add("flex");

  try {
    const [mecanicoData, statsData] = await Promise.all([
      api.obtenerMecanico(id),
      api.estadisticasMecanico(id),
    ]);

    const m = mecanicoData.mecanico;
    const stats = statsData.resumen;

    detalleTitulo.textContent = m.nombre;
    detalleSubtitulo.textContent = m.especialidad || "Sin especialidad";

    const formatearMoneda = (v) =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(v || 0);

    detalleContenido.innerHTML = `
      <div class="space-y-5">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Correo</p>
            <p class="text-sm break-all">${m.email || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cedula</p>
            <p class="text-sm">${m.cedula || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Telefono</p>
            <p class="text-sm">${m.telefono || "-"}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Estado</p>
            <p class="text-sm ${m.activo ? "text-green-500" : "text-red-500"}">${m.activo ? "Activo" : "Inactivo"}</p>
          </div>
          ${
            m.direccion
              ? `
            <div class="col-span-2">
              <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Direccion</p>
              <p class="text-sm">${m.direccion}</p>
            </div>
          `
              : ""
          }
        </div>

        <div class="pt-5 border-t border-ink-border">
          <h3 class="text-sm font-bold mb-3">Estadisticas</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-ink border border-ink-border rounded-lg p-3">
  <p class="text-xs text-zinc-500 mb-1">Total trabajos</p>
  <p class="text-lg font-bold">${stats.totalTrabajos || 0}</p>
</div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Comision total</p>
              <p class="text-lg font-bold text-brand">${formatearMoneda(stats.totalComision)}</p>
            </div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Pagado</p>
              <p class="text-lg font-bold text-green-500">${formatearMoneda(stats.pagado)}</p>
            </div>
            <div class="bg-ink border border-ink-border rounded-lg p-3">
              <p class="text-xs text-zinc-500 mb-1">Pendiente</p>
              <p class="text-lg font-bold ${stats.pendiente > 0 ? "text-yellow-500" : "text-zinc-500"}">${formatearMoneda(stats.pendiente)}</p>
            </div>
          </div>
        </div>

        ${
          m.notas
            ? `
          <div class="pt-5 border-t border-ink-border">
            <p class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Notas</p>
            <p class="text-sm text-zinc-300">${m.notas}</p>
          </div>
        `
            : ""
        }

        <div class="pt-5 border-t border-ink-border flex flex-wrap gap-2">
          <button id="btn-editar-desde-detalle" class="bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all">
            Editar informacion
          </button>
          ${
            stats.pendiente > 0
              ? `
            <button id="btn-pagar-mecanico" class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all">
              Marcar pagos como pagados
            </button>
          `
              : ""
          }
        </div>

      </div>
    `;

    document
      .getElementById("btn-editar-desde-detalle")
      ?.addEventListener("click", () => {
        cerrarDetalle();
        setTimeout(() => abrirModalEditar(m), 150);
      });

    document
      .getElementById("btn-pagar-mecanico")
      ?.addEventListener("click", async () => {
        const confirmado = await confirmar(
          "Marcar pagos como pagados",
          `Se marcaran todos los mantenimientos pendientes de pago de "${m.nombre}" como pagados.`,
          "Si, marcar",
        );
        if (!confirmado) return;

        try {
          const result = await api.pagarMecanico(m._id);
          toast(result.msg, "success");
          cerrarDetalle();
          await tabla.recargar();
        } catch (error) {
          alertaError("Error", error.message);
        }
      });
  } catch (error) {
    console.error("Error al cargar detalle:", error);
    detalleContenido.innerHTML = `<p class="text-red-400 text-sm text-center py-8">Error al cargar el detalle</p>`;
  }
};

const cerrarDetalle = () => {
  modalDetalle.classList.add("hidden");
  modalDetalle.classList.remove("flex");
  desbloquearScroll();
};

// ─── Eventos ─────────────────────────────────────
const bindEventos = () => {
  formMecanico.addEventListener("submit", manejarGuardar);
  btnCancelar.addEventListener("click", cerrarModalMecanico);
  btnCerrarDetalle.addEventListener("click", cerrarDetalle);

  formMecanico
    .querySelectorAll(".field input, .field textarea, .field select")
    .forEach((el) => {
      const sync = () => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

  [inputCedula, inputTelefono].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      const teclasControl = [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ];
      if (teclasControl.includes(e.key)) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    input.addEventListener("paste", (e) => {
      const texto = (e.clipboardData || window.clipboardData).getData("text");
      if (!/^\d+$/.test(texto)) e.preventDefault();
    });

    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!modalMecanico.classList.contains("hidden")) cerrarModalMecanico();
      if (!modalDetalle.classList.contains("hidden")) cerrarDetalle();
    }
  });

  [modalMecanico, modalDetalle].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (modal === modalMecanico) cerrarModalMecanico();
        else cerrarDetalle();
      }
    });
  });
};

init();
