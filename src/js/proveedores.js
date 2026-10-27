// src/js/proveedores.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";
import { crearTabla } from "./tabla.js";
import { bloquearScroll, desbloquearScroll } from "./ui.js";

// ─── Layout ───────────────────────────────────────
await construirLayout({
  titulo: "Proveedores",
  subtitulo: "Gestión de proveedores y suministros",
  itemActivo: "proveedores",
});

// ─── Referencias ──────────────────────────────────
const contenido = document.getElementById("contenido-proveedores");
const loader = document.getElementById("loader-proveedores");
const modal = document.getElementById("modal-proveedor");
const modalTitulo = document.getElementById("modal-proveedor-titulo");
const form = document.getElementById("form-proveedor");
const btnCancelar = document.getElementById("btn-cancelar-proveedor");
const btnGuardar = document.getElementById("btn-guardar-proveedor");
const inputId = document.getElementById("proveedor-id");

loader.classList.add("hidden");
contenido.classList.remove("hidden");

// ─── Columnas ─────────────────────────────────────
const columnas = [
  {
    key: "nombre",
    label: "Nombre",
    render: (p) => `<span class="font-medium text-white">${p.nombre}</span>`,
  },
  {
    key: "nit",
    label: "NIT",
    render: (p) => p.nit || '<span class="text-zinc-600">-</span>',
  },
  {
    key: "telefono",
    label: "Teléfono",
    render: (p) => `
      <a href="tel:${p.telefono}" class="text-zinc-300 hover:text-brand transition-colors">
        ${p.telefono}
      </a>
    `,
  },
  {
    key: "contacto",
    label: "Contacto",
    render: (p) => p.contacto || '<span class="text-zinc-600">-</span>',
  },
  {
    key: "productosQueProvee",
    label: "Productos",
    render: (p) =>
      p.productosQueProvee
        ? `<span class="text-zinc-400 text-xs">${p.productosQueProvee}</span>`
        : '<span class="text-zinc-600">-</span>',
  },
  {
    key: "activo",
    label: "Estado",
    render: (p) =>
      p.activo !== false
        ? `<span class="inline-flex items-center gap-1.5 text-brand text-sm font-medium">
             <span class="w-2 h-2 rounded-full bg-brand"></span>
             Activo
           </span>`
        : `<span class="inline-flex items-center gap-1.5 text-red-500 text-sm font-medium">
             <span class="w-2 h-2 rounded-full bg-red-500"></span>
             Inactivo
           </span>`,
  },
  {
    key: "acciones",
    label: "Acciones",
    class: "text-right",
    render: (p) => `
      <div class="flex items-center justify-end gap-2">
        <button
          class="btn-editar flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 text-xs font-medium transition-colors"
          data-id="${p._id}"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar
        </button>

        <button
          class="btn-toggle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            p.activo !== false
              ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
              : "bg-brand/10 text-brand hover:bg-brand/20"
          }"
          data-id="${p._id}"
          data-activo="${p.activo !== false}"
          data-nombre="${p.nombre}"
        >
          ${
            p.activo !== false
              ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                 </svg>
                 Desactivar`
              : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                 </svg>
                 Activar`
          }
        </button>

        <button
          class="btn-eliminar p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          data-id="${p._id}"
          data-nombre="${p.nombre}"
          title="Eliminar"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `,
  },
];

// ─── Filtros ──────────────────────────────────────
const filtros = [
  {
    id: "activo",
    label: "Estado",
    opciones: [
      { value: "", label: "Todos" },
      { value: "true", label: "Activos" },
      { value: "false", label: "Inactivos" },
    ],
  },
];

// ─── Crear tabla ──────────────────────────────────
const tabla = crearTabla({
  contenedor: contenido,
  columnas,
  filtros,
  placeholder: "Buscar por nombre, NIT o teléfono...",
  labelBuscador: "Buscar proveedor",
  mensajeVacio: "No hay proveedores registrados. Crea el primero.",
  cargar: async ({ page, limit, search, activo }) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (activo !== "" && activo !== undefined) params.activo = activo;

    const res = await api.listarProveedores(params);

    return {
      total: res.total,
      data: res.proveedores || [],
    };
  },
});

// ─── Inyectar botón "Nuevo Proveedor" ─────────────
tabla.acciones.innerHTML = `
  <button id="btn-nuevo-proveedor" class="btn-primary flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Nuevo Proveedor
  </button>
`;

// ─── DELEGACIÓN DE EVENTOS ────────────────────────
contenido.addEventListener("click", (e) => {
  // Botón nuevo
  if (e.target.closest("#btn-nuevo-proveedor")) {
    abrirModalCrear();
    return;
  }

  // Botón toggle activo
  const btnToggle = e.target.closest(".btn-toggle");
  if (btnToggle) {
    e.stopPropagation();
    const id = btnToggle.dataset.id;
    const estaActivo = btnToggle.dataset.activo === "true";
    const nombre = btnToggle.dataset.nombre || "";
    toggleActivo(id, estaActivo, nombre);
    return;
  }

  // Botón editar
  const btnEditar = e.target.closest(".btn-editar");
  if (btnEditar) {
    e.stopPropagation();
    abrirModalEditar(btnEditar.dataset.id);
    return;
  }

  // Botón eliminar
  const btnEliminar = e.target.closest(".btn-eliminar");
  if (btnEliminar) {
    e.stopPropagation();
    confirmarEliminar(btnEliminar.dataset.id, btnEliminar.dataset.nombre);
  }
});

// ─── Abrir modal (crear) ──────────────────────────
const abrirModalCrear = () => {
  form.reset();
  inputId.value = "";
  modalTitulo.textContent = "Nuevo Proveedor";
  btnGuardar.textContent = "Crear Proveedor";

  form.querySelectorAll("input, textarea").forEach((el) => {
    el.removeAttribute("data-has-value");
  });

  modal.classList.remove("hidden");
  bloquearScroll();
  setTimeout(() => document.getElementById("prov-nombre").focus(), 100);
};

// ─── Abrir modal (editar) ─────────────────────────
const abrirModalEditar = async (id) => {
  try {
    const res = await api.obtenerProveedor(id);
    const proveedor = res.proveedor;

    if (!proveedor) throw new Error("Proveedor no encontrado");

    inputId.value = proveedor._id;
    document.getElementById("prov-nombre").value = proveedor.nombre || "";
    document.getElementById("prov-nit").value = proveedor.nit || "";
    document.getElementById("prov-telefono").value = proveedor.telefono || "";
    document.getElementById("prov-email").value = proveedor.email || "";
    document.getElementById("prov-direccion").value = proveedor.direccion || "";
    document.getElementById("prov-contacto").value = proveedor.contacto || "";
    document.getElementById("prov-productos").value =
      proveedor.productosQueProvee || "";
    document.getElementById("prov-notas").value = proveedor.notas || "";

    form.querySelectorAll("input, textarea").forEach((el) => {
      if (el.value) {
        el.setAttribute("data-has-value", "true");
      }
    });

    modalTitulo.textContent = "Editar Proveedor";
    btnGuardar.textContent = "Guardar Cambios";

    modal.classList.remove("hidden");
    bloquearScroll();
  } catch (error) {
    console.error("Error al cargar proveedor:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cargar el proveedor",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};

// ─── Cerrar modal ─────────────────────────────────
const cerrarModal = () => {
  modal.classList.add("hidden");
  desbloquearScroll();
  form.reset();
  inputId.value = "";
};

btnCancelar.addEventListener("click", cerrarModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    cerrarModal();
  }
});

// ─── Guardar (crear/editar) ───────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = inputId.value;
  const esEdicion = !!id;

  const data = {
    nombre: document.getElementById("prov-nombre").value.trim(),
    telefono: document.getElementById("prov-telefono").value.trim(),
  };

  const nit = document.getElementById("prov-nit").value.trim();
  if (nit) data.nit = nit;

  const email = document.getElementById("prov-email").value.trim();
  if (email) data.email = email;

  const direccion = document.getElementById("prov-direccion").value.trim();
  if (direccion) data.direccion = direccion;

  const contacto = document.getElementById("prov-contacto").value.trim();
  if (contacto) data.contacto = contacto;

  const productos = document.getElementById("prov-productos").value.trim();
  if (productos) data.productosQueProvee = productos;

  const notas = document.getElementById("prov-notas").value.trim();
  if (notas) data.notas = notas;

  if (data.nombre.length < 3) {
    window.Swal.fire({
      icon: "warning",
      title: "Nombre inválido",
      text: "El nombre debe tener al menos 3 caracteres",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  if (data.telefono.length < 7) {
    window.Swal.fire({
      icon: "warning",
      title: "Teléfono inválido",
      text: "El teléfono debe tener al menos 7 caracteres",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  btnGuardar.disabled = true;
  btnGuardar.textContent = esEdicion ? "Guardando..." : "Creando...";
  btnGuardar.classList.add("opacity-70", "cursor-not-allowed");

  try {
    if (esEdicion) {
      await api.actualizarProveedor(id, data);
      await window.Swal.fire({
        icon: "success",
        title: "Proveedor actualizado",
        background: "#18181b",
        color: "#ffffff",
        confirmButtonColor: "#16a34a",
        timer: 1800,
        showConfirmButton: false,
      });
    } else {
      await api.crearProveedor(data);
      await window.Swal.fire({
        icon: "success",
        title: "Proveedor creado",
        background: "#18181b",
        color: "#ffffff",
        confirmButtonColor: "#16a34a",
        timer: 1800,
        showConfirmButton: false,
      });
    }

    cerrarModal();
    tabla.recargar();
  } catch (error) {
    console.error("Error al guardar proveedor:", error);

    let mensaje = error.message || "No se pudo guardar el proveedor";
    if (error.data?.errors && Array.isArray(error.data.errors)) {
      mensaje = error.data.errors.map((e) => e.msg).join("\n");
    }

    window.Swal.fire({
      icon: "error",
      title: "Error",
      html: mensaje.replace(/\n/g, "<br>"),
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = esEdicion ? "Guardar Cambios" : "Crear Proveedor";
    btnGuardar.classList.remove("opacity-70", "cursor-not-allowed");
  }
});

// ─── Activar / Desactivar proveedor ───────────────
const toggleActivo = async (id, estaActivo, nombre) => {
  const nuevoEstado = !estaActivo;
  const accion = nuevoEstado ? "activar" : "desactivar";

  const result = await window.Swal.fire({
    title: `¿${nuevoEstado ? "Activar" : "Desactivar"} proveedor?`,
    html: `Se va a <strong>${accion}</strong> a <strong>${nombre}</strong>.`,
    icon: "question",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: nuevoEstado ? "#16a34a" : "#dc2626",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: `Sí, ${accion}`,
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;

  try {
    await api.actualizarProveedor(id, { activo: nuevoEstado });

    await window.Swal.fire({
      icon: "success",
      title: nuevoEstado ? "Proveedor activado" : "Proveedor desactivado",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1500,
      showConfirmButton: false,
    });

    tabla.recargar();
  } catch (error) {
    console.error("Error al cambiar estado del proveedor:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cambiar el estado",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};

// ─── Eliminar ─────────────────────────────────────
const confirmarEliminar = async (id, nombre) => {
  const result = await window.Swal.fire({
    title: "¿Eliminar proveedor?",
    html: `Se eliminará <strong>${nombre}</strong>.<br><br><span class="text-sm text-zinc-400">Si tiene repuestos asociados, solo se desactivará.</span>`,
    icon: "warning",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;

  try {
    const res = await api.eliminarProveedor(id);

    await window.Swal.fire({
      icon: "success",
      title: "Listo",
      text: res.msg || "Proveedor eliminado",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 2000,
      showConfirmButton: false,
    });

    tabla.recargar();
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo eliminar el proveedor",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};
