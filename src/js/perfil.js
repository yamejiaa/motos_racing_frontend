// src/js/perfil.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";

const usuarioActual = await construirLayout({
  titulo: "Mi Perfil",
  subtitulo: "Información de tu cuenta",
  itemActivo: "configuracion",
});

const contenido = document.getElementById("contenido-perfil");
const loader = document.getElementById("loader-perfil");
const btnGuardar = document.getElementById("btn-guardar-perfil");
const btnReset = document.getElementById("btn-reset-perfil");

loader.classList.add("hidden");
contenido.classList.remove("hidden");

// ─── Formato fecha ────────────────────────────────
const formatFechaHora = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Iniciales ────────────────────────────────────
const obtenerIniciales = (nombre) =>
  (nombre || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ─── Cargar perfil ────────────────────────────────
const cargarPerfil = async () => {
  try {
    const res = await api.verify();
    const u = res.usuario;

    // Tarjeta superior
    document.getElementById("perfil-avatar").textContent = obtenerIniciales(
      u.nombre,
    );
    document.getElementById("perfil-nombre-display").textContent =
      u.nombre || "-";
    document.getElementById("perfil-email-display").textContent =
      u.email || "-";
    document.getElementById("perfil-rol-badge").innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
      ${u.rol === "admin" ? "Administrador" : u.rol}
    `;

    // Formulario
    document.getElementById("perfil-nombre").value = u.nombre || "";
    document.getElementById("perfil-email").value = u.email || "";
    document.getElementById("perfil-telefono").value = u.telefono || "";

    // Info de cuenta
    document.getElementById("perfil-ultimo-acceso").textContent =
      formatFechaHora(u.ultimoAcceso);

    // ─── Estado: por defecto "Activo" si el campo no viene ─
    const estaActivo = u.activo !== false;
    const estadoBadge = document.getElementById("perfil-estado-badge");
    if (estaActivo) {
      estadoBadge.className =
        "inline-flex items-center gap-1.5 text-brand text-xs font-medium";
      estadoBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-brand"></span> Activo`;
    } else {
      estadoBadge.className =
        "inline-flex items-center gap-1.5 text-red-500 text-xs font-medium";
      estadoBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactivo`;
    }

    // Marcar inputs con valor
    document.querySelectorAll("#contenido-perfil input").forEach((el) => {
      if (el.value) el.setAttribute("data-has-value", "true");
    });
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cargar el perfil",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};

// ─── Guardar perfil ───────────────────────────────
btnGuardar.addEventListener("click", async () => {
  const nombre = document.getElementById("perfil-nombre").value.trim();
  const email = document.getElementById("perfil-email").value.trim();
  const telefono = document.getElementById("perfil-telefono").value.trim();

  if (nombre.length < 3) {
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

  if (!email || !email.includes("@")) {
    window.Swal.fire({
      icon: "warning",
      title: "Email inválido",
      text: "Ingresa un correo electrónico válido",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  const data = { nombre, email, telefono };

  btnGuardar.disabled = true;
  btnGuardar.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
    Guardando...
  `;
  btnGuardar.classList.add("opacity-70", "cursor-not-allowed");

  try {
    await api.actualizarPerfil(data);
    await window.Swal.fire({
      icon: "success",
      title: "Perfil actualizado",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1800,
      showConfirmButton: false,
    });

    if (usuarioActual) {
      document.getElementById("sidebar-nombre").textContent = nombre;
      document.getElementById("sidebar-avatar").textContent =
        obtenerIniciales(nombre);
    }

    await cargarPerfil();
  } catch (error) {
    console.error("Error al guardar perfil:", error);
    let mensaje = error.message || "No se pudo guardar el perfil";
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
    btnGuardar.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Guardar cambios
    `;
    btnGuardar.classList.remove("opacity-70", "cursor-not-allowed");
  }
});

// ─── Descartar cambios ────────────────────────────
btnReset.addEventListener("click", async () => {
  const result = await window.Swal.fire({
    title: "¿Descartar cambios?",
    text: "Se restaurarán los valores originales",
    icon: "question",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Sí, descartar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;
  await cargarPerfil();
});

await cargarPerfil();
