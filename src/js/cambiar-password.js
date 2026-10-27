// src/js/cambiar-password.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";

await construirLayout({
  titulo: "Cambiar Contraseña",
  subtitulo: "Actualiza tu contraseña de acceso",
  itemActivo: "configuracion",
});

const contenido = document.getElementById("contenido-password");
const form = document.getElementById("form-password");
const btnGuardar = document.getElementById("btn-guardar-password");
const inputActual = document.getElementById("pass-actual");
const inputNueva = document.getElementById("pass-nueva");
const inputConfirmar = document.getElementById("pass-confirmar");
const fuerzaWrapper = document.getElementById("fuerza-password");
const fuerzaBars = document.querySelectorAll(".fuerza-bar");
const fuerzaTexto = document.getElementById("fuerza-texto");

contenido.classList.remove("hidden");

// ─── Toggle mostrar/ocultar contraseña ────────────
const ICONO_OJO_ABIERTO = `
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
`;

const ICONO_OJO_CERRADO = `
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
`;

document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.togglePassword;
    const input = document.getElementById(targetId);
    const svg = btn.querySelector("svg");

    if (input.type === "password") {
      input.type = "text";
      svg.innerHTML = ICONO_OJO_CERRADO;
    } else {
      input.type = "password";
      svg.innerHTML = ICONO_OJO_ABIERTO;
    }
  });
});

// ─── Barra de fuerza ──────────────────────────────
const medirFuerza = (pass) => {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[^a-zA-Z0-9]/.test(pass)) score++;
  return score;
};

inputNueva.addEventListener("input", () => {
  const pass = inputNueva.value;

  if (!pass) {
    fuerzaWrapper.classList.add("hidden");
    return;
  }

  fuerzaWrapper.classList.remove("hidden");
  const score = medirFuerza(pass);

  const colores = [
    "bg-red-500", // 0 - muy débil
    "bg-red-500", // 1 - débil
    "bg-yellow-500", // 2 - media
    "bg-brand", // 3 - fuerte
    "bg-brand", // 4 - muy fuerte
  ];

  const textos = [
    "Contraseña muy débil",
    "Contraseña débil",
    "Contraseña media",
    "Contraseña fuerte",
    "Contraseña muy fuerte",
  ];

  const textosColor = [
    "text-red-500",
    "text-red-500",
    "text-yellow-500",
    "text-brand",
    "text-brand",
  ];

  fuerzaBars.forEach((bar, i) => {
    bar.className = `fuerza-bar flex-1 h-1 rounded-full transition-all ${
      i < score ? colores[score] : "bg-ink-border"
    }`;
  });

  fuerzaTexto.textContent = textos[score];
  fuerzaTexto.className = `text-xs ${textosColor[score]}`;
});

// ─── Submit ───────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const passwordActual = inputActual.value;
  const passwordNueva = inputNueva.value;
  const passwordConfirmar = inputConfirmar.value;

  // Validaciones
  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    window.Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Completa todos los campos",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  if (passwordNueva.length < 8) {
    window.Swal.fire({
      icon: "warning",
      title: "Contraseña muy corta",
      text: "La nueva contraseña debe tener al menos 8 caracteres",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  if (passwordNueva !== passwordConfirmar) {
    window.Swal.fire({
      icon: "warning",
      title: "Las contraseñas no coinciden",
      text: "Verifica la confirmación de la nueva contraseña",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  if (passwordNueva === passwordActual) {
    window.Swal.fire({
      icon: "warning",
      title: "Contraseña sin cambios",
      text: "La nueva contraseña debe ser diferente a la actual",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  // Enviar
  btnGuardar.disabled = true;
  btnGuardar.innerHTML = `
    <div class="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
    Cambiando...
  `;
  btnGuardar.classList.add("opacity-70", "cursor-not-allowed");

  try {
    await api.cambiarPassword(passwordActual, passwordNueva);

    await window.Swal.fire({
      icon: "success",
      title: "Contraseña actualizada",
      text: "Tu contraseña se cambió correctamente",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 2000,
      showConfirmButton: false,
    });

    // Limpiar formulario
    form.reset();
    fuerzaWrapper.classList.add("hidden");

    // Resetear iconos de ojo
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      const input = document.getElementById(btn.dataset.togglePassword);
      input.type = "password";
      btn.querySelector("svg").innerHTML = ICONO_OJO_ABIERTO;
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    let mensaje = error.message || "No se pudo cambiar la contraseña";
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
      Cambiar contraseña
    `;
    btnGuardar.classList.remove("opacity-70", "cursor-not-allowed");
  }
});
