import { api } from "./api.js";
import { inicializarFechas, bindBotonesFechaHoy } from "./fechas.js";
import {
  mostrarMensajeFormulario,
  limpiarMensajesFormulario,
} from "./mensajes.js";
import { parsearMoneda } from "./mantenimientos-utils.js";
import {
  inicializarBuscadorPlaca,
  inicializarDropdown,
  renderMecanicoItem,
} from "./mantenimientos-busqueda.js";
import {
  bloquearScroll,
  desbloquearScroll,
  alertaExito,
  alertaError,
} from "./ui.js";

// ─── Estado del modal ─────────────────────────────
let estado = {
  motoSeleccionada: null,
  imagenes: [],
  esClienteNuevo: false,
};

let dropdownMecanico = null;
let mecanicosCache = [];

// ─── Referencias del DOM ──────────────────────────
let modalMantenimiento;
let formMantenimiento;
let btnCancelar;
let btnGuardar;

// ─── Inicializar el modal ─────────────────────────
export const inicializarModalCrear = async () => {
  modalMantenimiento = document.getElementById("modal-mantenimiento");
  formMantenimiento = document.getElementById("form-mantenimiento");
  btnCancelar = document.getElementById("btn-cancelar-mantenimiento");
  btnGuardar = document.getElementById("btn-guardar-mantenimiento");

  // Cargar caches
  await cargarCaches();

  // Inicializar dropdown de mecanico
  inicializarDropdownMecanico();

  // Inicializar buscador de placa
  inicializarBuscadorPlaca({
    inputPlaca: document.getElementById("mantenimiento-placa"),
    resultadosContenedor: document.getElementById("resultados-placa"),
    onSeleccionarMoto: seleccionarMoto,
  });

  // Inicializar fechas
  inicializarFechas(formMantenimiento);
  bindBotonesFechaHoy(formMantenimiento);

  // Sincronizar floating labels
  formMantenimiento
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => {
      const sync = () => {
        if (el.value) el.setAttribute("data-has-value", "true");
        else el.removeAttribute("data-has-value");
      };
      el.addEventListener("input", sync);
      el.addEventListener("change", sync);
    });

  // Restringir input de placa existente
  const inputPlaca = document.getElementById("mantenimiento-placa");
  inputPlaca.setAttribute("maxlength", "6");
  inputPlaca.addEventListener("input", (e) => {
    e.target.value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  });

  // Restringir input de placa nueva
  const inputPlacaNueva = document.getElementById("nuevo-moto-placa");
  inputPlacaNueva.setAttribute("maxlength", "6");
  inputPlacaNueva.addEventListener("input", (e) => {
    e.target.value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  });

  // Restringir telefono nuevo
  const inputTelNuevo = document.getElementById("nuevo-cliente-telefono");
  inputTelNuevo.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  // Formatear kilometraje
  const inputKm = document.getElementById("mantenimiento-kilometraje");
  inputKm.addEventListener("input", (e) => {
    const valor = parsearMoneda(e.target.value);
    e.target.value = valor > 0 ? valor.toLocaleString("es-CO") : "";
  });

  // Botones
  btnCancelar.addEventListener("click", cerrarModal);
  formMantenimiento.addEventListener("submit", manejarGuardar);

  // Cambiar moto
  document.getElementById("btn-cambiar-moto").addEventListener("click", () => {
    estado.motoSeleccionada = null;
    document.getElementById("mantenimiento-moto-id").value = "";
    document.getElementById("moto-seleccionada-info").classList.add("hidden");
    document.getElementById("mantenimiento-placa").value = "";
    document.getElementById("mantenimiento-placa").focus();
  });

  // Checkbox "No es cliente"
  const checkNoEsCliente = document.getElementById("check-no-es-cliente");
  const seccionExistente = document.getElementById("seccion-cliente-existente");
  const seccionNuevo = document.getElementById("seccion-cliente-nuevo");

  checkNoEsCliente.addEventListener("change", () => {
    estado.esClienteNuevo = checkNoEsCliente.checked;

    if (checkNoEsCliente.checked) {
      seccionExistente.classList.add("hidden");
      seccionNuevo.classList.remove("hidden");
      estado.motoSeleccionada = null;
      document.getElementById("mantenimiento-moto-id").value = "";
    } else {
      seccionExistente.classList.remove("hidden");
      seccionNuevo.classList.add("hidden");
      document.getElementById("nuevo-cliente-nombre").value = "";
      document.getElementById("nuevo-cliente-telefono").value = "";
      document.getElementById("nuevo-moto-placa").value = "";
      document.getElementById("nuevo-moto-marca").value = "";
      document.getElementById("nuevo-moto-modelo").value = "";
      document.getElementById("nuevo-moto-id").value = "";

      // Resetear labels flotantes
      [
        "nuevo-cliente-nombre",
        "nuevo-cliente-telefono",
        "nuevo-moto-placa",
        "nuevo-moto-marca",
        "nuevo-moto-modelo",
      ].forEach((id) => {
        document.getElementById(id).removeAttribute("data-has-value");
      });
    }
  });

  // Imagenes (drop zone)
  inicializarDropzoneImagenes();

  // Escape
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !modalMantenimiento.classList.contains("hidden")
    ) {
      cerrarModal();
    }
  });

  modalMantenimiento.addEventListener("click", (e) => {
    if (e.target === modalMantenimiento) cerrarModal();
  });
};

// ─── Cargar caches ────────────────────────────────
const cargarCaches = async () => {
  try {
    const m = await api.listarMecanicos({ limit: 200, activo: "true" });
    mecanicosCache = m.mecanicos || [];
  } catch (error) {
    console.error("Error al cargar caches:", error);
  }
};

// ─── Inicializar dropdown de mecanico ─────────────
const inicializarDropdownMecanico = () => {
  const wrapperMec = document.querySelector("[data-dropdown-mecanico]");
  dropdownMecanico = inicializarDropdown({
    wrapper: wrapperMec,
    items: mecanicosCache,
    placeholder: "Seleccionar mecanico...",
    renderItem: renderMecanicoItem,
  });
};

// ─── Seleccionar moto ─────────────────────────────
const seleccionarMoto = (moto) => {
  estado.motoSeleccionada = moto;
  document.getElementById("mantenimiento-moto-id").value = moto._id;
  document.getElementById("mantenimiento-placa").value = moto.placa;
  document
    .getElementById("mantenimiento-placa")
    .setAttribute("data-has-value", "true");

  const info = document.getElementById("moto-seleccionada-info");
  document.getElementById("moto-info-placa").textContent = moto.placa;
  document.getElementById("moto-info-nombre").textContent =
    `${moto.marca} ${moto.modelo}`;
  document.getElementById("moto-info-cliente").textContent =
    `Cliente: ${moto.clienteId?.nombre || "Sin cliente"}`;
  document.getElementById("moto-info-telefono").textContent = moto.clienteId
    ?.telefono
    ? `Tel: ${moto.clienteId.telefono}`
    : "";
  info.classList.remove("hidden");

  document.getElementById("btn-nueva-moto-container").classList.add("hidden");
  document.getElementById("resultados-placa").classList.add("hidden");
};

// ─── Imagenes (dropzone) ──────────────────────────
const inicializarDropzoneImagenes = () => {
  const dropzone = document.getElementById("dropzone-imagenes");
  const inputImagenes = document.getElementById("input-imagenes");

  dropzone.addEventListener("click", () => inputImagenes.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("border-brand", "bg-brand/5");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-brand", "bg-brand/5");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-brand", "bg-brand/5");
    agregarImagenes(Array.from(e.dataTransfer.files));
  });

  inputImagenes.addEventListener("change", (e) => {
    agregarImagenes(Array.from(e.target.files));
    inputImagenes.value = "";
  });
};

const agregarImagenes = (files) => {
  files.forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alertaError("Imagen muy grande", `${file.name} supera los 5 MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      estado.imagenes.push({
        file,
        preview: e.target.result,
        momento: "ingreso",
      });
      renderPreviewImagenes();
    };
    reader.readAsDataURL(file);
  });
};

const renderPreviewImagenes = () => {
  const contenedor = document.getElementById("preview-imagenes");
  contenedor.innerHTML = estado.imagenes
    .map(
      (img, i) => `
    <div class="relative group">
      <img src="${img.preview}" class="w-full h-24 object-cover rounded-lg border border-ink-border">
      <button type="button" class="btn-eliminar-imagen absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" data-index="${i}">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <select class="select-momento-imagen absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] rounded px-1 py-0.5" data-index="${i}">
        <option value="ingreso" ${img.momento === "ingreso" ? "selected" : ""}>Ingreso</option>
        <option value="durante" ${img.momento === "durante" ? "selected" : ""}>Durante</option>
        <option value="entrega" ${img.momento === "entrega" ? "selected" : ""}>Entrega</option>
      </select>
    </div>
  `,
    )
    .join("");

  contenedor.querySelectorAll(".btn-eliminar-imagen").forEach((btn) => {
    btn.addEventListener("click", () => {
      estado.imagenes.splice(parseInt(btn.dataset.index), 1);
      renderPreviewImagenes();
    });
  });

  contenedor.querySelectorAll(".select-momento-imagen").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      estado.imagenes[parseInt(sel.dataset.index)].momento = e.target.value;
    });
  });
};

// ─── Abrir modal ──────────────────────────────────
export const abrirModalCrearMantenimiento = () => {
  estado = {
    motoSeleccionada: null,
    imagenes: [],
    esClienteNuevo: false,
  };

  formMantenimiento.reset();
  document.getElementById("mantenimiento-moto-id").value = "";
  document.getElementById("moto-seleccionada-info").classList.add("hidden");
  document.getElementById("resultados-placa").classList.add("hidden");
  document.getElementById("btn-nueva-moto-container").classList.add("hidden");
  document.getElementById("preview-imagenes").innerHTML = "";
  document.getElementById("check-no-es-cliente").checked = false;
  document
    .getElementById("seccion-cliente-existente")
    .classList.remove("hidden");
  document.getElementById("seccion-cliente-nuevo").classList.add("hidden");
  limpiarMensajesFormulario(formMantenimiento);

  dropdownMecanico.setValue("", "Seleccionar mecanico...");

  formMantenimiento
    .querySelectorAll(".field input, .field textarea")
    .forEach((el) => {
      el.removeAttribute("data-has-value");
    });

  bloquearScroll();
  modalMantenimiento.classList.remove("hidden");
  modalMantenimiento.classList.add("flex");
};

// ─── Cerrar modal ─────────────────────────────────
const cerrarModal = () => {
  modalMantenimiento.classList.add("hidden");
  modalMantenimiento.classList.remove("flex");
  desbloquearScroll();
  limpiarMensajesFormulario(formMantenimiento);
};

// ─── Guardar ──────────────────────────────────────
const manejarGuardar = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formMantenimiento);

  const kilometrajeStr = document.getElementById(
    "mantenimiento-kilometraje",
  ).value;
  const mecanicoId = document.getElementById("mantenimiento-mecanico-id").value;

  if (!mecanicoId) {
    return mostrarMensajeFormulario(
      formMantenimiento,
      "Debes seleccionar un mecanico",
      "error",
    );
  }
  if (!kilometrajeStr) {
    return mostrarMensajeFormulario(
      formMantenimiento,
      "Debes ingresar el kilometraje",
      "error",
    );
  }
  if (estado.imagenes.length === 0) {
    return mostrarMensajeFormulario(
      formMantenimiento,
      "Debes subir al menos una imagen de la moto",
      "error",
    );
  }

  let motoId = document.getElementById("mantenimiento-moto-id").value;

  // ─── Si es cliente nuevo, crearlo primero ────
  if (estado.esClienteNuevo) {
    const nombre = document.getElementById("nuevo-cliente-nombre").value.trim();
    const telefono = document
      .getElementById("nuevo-cliente-telefono")
      .value.trim();
    const placa = document.getElementById("nuevo-moto-placa").value.trim();
    const marca = document.getElementById("nuevo-moto-marca").value.trim();
    const modelo = document.getElementById("nuevo-moto-modelo").value.trim();

    if (!nombre || nombre.length < 3) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "El nombre debe tener al menos 3 caracteres",
        "error",
      );
    }
    if (!telefono || telefono.length < 7) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "El telefono debe tener al menos 7 caracteres",
        "error",
      );
    }
    if (!placa || placa.length < 5) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "La placa debe tener al menos 5 caracteres",
        "error",
      );
    }
    if (!marca) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "La marca es obligatoria",
        "error",
      );
    }
    if (!modelo) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "El modelo es obligatorio",
        "error",
      );
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Registrando cliente y moto...";

    try {
      const data = await api.crearClienteYMotoRapido({
        nombre,
        telefono,
        email: email || undefined,
        placa,
        marca,
        modelo,
      });
      motoId = data.moto._id;
    } catch (error) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = "Crear mantenimiento";
      return mostrarMensajeFormulario(
        formMantenimiento,
        error.message || "Error al crear cliente y moto",
        "error",
      );
    }
  } else {
    if (!motoId) {
      return mostrarMensajeFormulario(
        formMantenimiento,
        "Debes seleccionar una moto",
        "error",
      );
    }
  }

  // ─── Crear el mantenimiento ────────────────────
  const formData = new FormData();
  formData.append("motoId", motoId);
  formData.append("mecanicoId", mecanicoId);
  formData.append("kilometraje", parsearMoneda(kilometrajeStr));
  formData.append(
    "motivoIngreso",
    document.getElementById("mantenimiento-motivo").value.trim(),
  );
  formData.append(
    "diagnostico",
    document.getElementById("mantenimiento-diagnostico").value.trim(),
  );
  formData.append(
    "observaciones",
    document.getElementById("mantenimiento-observaciones").value.trim(),
  );
  formData.append(
    "fechaPromesa",
    document.getElementById("mantenimiento-fecha-promesa").value || "",
  );
  formData.append("serviciosRealizados", JSON.stringify([]));
  formData.append("repuestosUtilizados", JSON.stringify([]));

  estado.imagenes.forEach((img) => {
    formData.append("imagenes", img.file);
    formData.append(`momento_${img.file.name}`, img.momento);
    formData.append(`desc_${img.file.name}`, "");
  });

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Creando mantenimiento...";

  try {
    await api.crearMantenimiento(formData);
    cerrarModal();
    alertaExito("Mantenimiento creado", "Se registro correctamente");

    if (window.recargarTablaMantenimientos) {
      window.recargarTablaMantenimientos();
    }
  } catch (error) {
    mostrarMensajeFormulario(
      formMantenimiento,
      error.message || "Error al crear",
      "error",
    );
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Crear mantenimiento";
  }
};
