import { api } from "./api.js";
import { cargarLibrerias, bloquearScroll, desbloquearScroll } from "./ui.js";
import { evaluarPassword, REQUISITOS_PASSWORD } from "./validaciones.js";
import {
  mostrarMensajeFormulario,
  limpiarMensajesFormulario,
} from "./mensajes.js";

const form = document.getElementById("form-login");
const inputEmail = document.getElementById("email");
const inputPassword = document.getElementById("password");
const btnToggle = document.getElementById("btn-toggle-password");
const iconEye = document.getElementById("icon-eye");
const iconEyeOff = document.getElementById("icon-eye-off");
const btnForgot = document.getElementById("btn-forgot");
const btnSubmit = document.getElementById("btn-submit");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");

const modalBienvenida = document.getElementById("modal-bienvenida");
const modalBienvenidaNombre = document.getElementById(
  "modal-bienvenida-nombre",
);

const modalCambio = document.getElementById("modal-cambio-obligatorio");
const formCambio = document.getElementById("form-cambio");
const inputNueva = document.getElementById("password-nueva");
const inputConfirmar = document.getElementById("password-confirmar");
const fortalezaTexto = document.getElementById("fortaleza-texto");
const listaRequisitos = document.getElementById("lista-requisitos");
const barras = document.querySelectorAll("[data-bar]");

// Modal forgot
const modalForgot = document.getElementById("modal-forgot");
const formForgot = document.getElementById("form-forgot");
const inputForgotEmail = document.getElementById("forgot-email");
const btnCancelForgot = document.getElementById("btn-cancel-forgot");
const btnEnviarForgot = document.getElementById("btn-enviar-forgot");

const init = async () => {
  await cargarLibrerias();

  // Verificar si venimos por sesion invalidada
  if (sessionStorage.getItem("sesion_invalidada") === "1") {
    sessionStorage.removeItem("sesion_invalidada");
    setTimeout(() => {
      window.Swal.fire({
        icon: "info",
        title: "Sesion anterior cerrada",
        text: "Tu cuenta fue utilizada en otro dispositivo. Inicia sesion de nuevo.",
        background: "#18181b",
        color: "#ffffff",
        confirmButtonColor: "#16a34a",
        confirmButtonText: "Entendido",
      });
    }, 300);
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("cambio") === "obligatorio") {
    abrirModalCambio();
  }

  renderizarRequisitos();
  bindEventos();
};

const bindEventos = () => {
  btnToggle.addEventListener("click", () => {
    const visible = inputPassword.type === "text";
    inputPassword.type = visible ? "password" : "text";
    iconEye.classList.toggle("hidden", !visible);
    iconEyeOff.classList.toggle("hidden", visible);
  });

  form.addEventListener("submit", manejarLogin);
  btnForgot.addEventListener("click", () => abrirModalForgot());
  btnCancelForgot.addEventListener("click", cerrarModalForgot);
  formForgot.addEventListener("submit", manejarForgot);
  inputNueva.addEventListener("input", actualizarFortaleza);
  formCambio.addEventListener("submit", manejarCambioObligatorio);
};

// ─── LOGIN ────────────────────────────────────────
const manejarLogin = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(form);

  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  if (!email) {
    return mostrarMensajeFormulario(
      form,
      "Ingresa tu correo electronico",
      "error",
    );
  }

  if (!password) {
    return mostrarMensajeFormulario(form, "Ingresa tu contrasena", "error");
  }

  btnSubmit.disabled = true;
  btnText.textContent = "Verificando...";
  btnSpinner.classList.remove("hidden");

  try {
    const data = await api.login(email, password);

    // Guardar el token en localStorage
    if (data.token) {
      localStorage.setItem("mysh_token", data.token);
    } else {
      console.warn("El backend no devolvió el token en la respuesta");
    }

    bloquearScroll();
    modalBienvenidaNombre.textContent = `Bienvenido, ${data.usuario.nombre}`;
    modalBienvenida.classList.remove("hidden");
    modalBienvenida.classList.add("flex");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (data.usuario.debeCambiarPassword) {
      modalBienvenida.classList.add("hidden");
      modalBienvenida.classList.remove("flex");
      modalCambio.classList.remove("hidden");
      modalCambio.classList.add("flex");
    } else {
      // Redirigir al dashboard (ruta manejada por vercel.json)
      window.location.href = "/dashboard";
    }
  } catch (error) {
    const codigo = error.data?.codigo;
    const mensaje = error.message || "Credenciales invalidas";

    if (codigo === "BLOQUEADO_PERMANENTE") {
      window.Swal.fire({
        icon: "error",
        title: "Cuenta bloqueada",
        html: `Tu cuenta ha sido bloqueada permanentemente.<br>Debes restablecer tu contrasena para desbloquearla.`,
        background: "#18181b",
        color: "#ffffff",
        confirmButtonColor: "#16a34a",
        confirmButtonText: "Restablecer ahora",
      }).then((result) => {
        if (result.isConfirmed) {
          abrirModalForgot(email);
        }
      });
    } else if (codigo === "BLOQUEADO_TEMPORAL") {
      mostrarMensajeFormulario(form, mensaje, "error");
      btnSubmit.disabled = true;
      btnText.textContent = `Bloqueado ${error.data?.minutosRestantes || 3} min`;

      setTimeout(
        () => {
          btnSubmit.disabled = false;
          btnText.textContent = "Ingresar";
        },
        (error.data?.minutosRestantes || 3) * 60 * 1000,
      );
    } else {
      mostrarMensajeFormulario(form, mensaje, "error");
    }
  } finally {
    btnSubmit.disabled = false;
    btnText.textContent = "Ingresar";
    btnSpinner.classList.add("hidden");
  }
};

// ─── MODAL OLVIDE CONTRASEÑA ──────────────────────
const abrirModalForgot = (emailPrellenado) => {
  bloquearScroll();
  limpiarMensajesFormulario(formForgot);
  formForgot.reset();
  inputForgotEmail.removeAttribute("data-has-value");
  if (emailPrellenado) {
    inputForgotEmail.value = emailPrellenado;
    inputForgotEmail.setAttribute("data-has-value", "true");
  }
  modalForgot.classList.remove("hidden");
  modalForgot.classList.add("flex");
};

const cerrarModalForgot = () => {
  modalForgot.classList.add("hidden");
  modalForgot.classList.remove("flex");
  limpiarMensajesFormulario(formForgot);
};

const manejarForgot = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formForgot);

  const email = inputForgotEmail.value.trim();

  if (!email) {
    return mostrarMensajeFormulario(
      formForgot,
      "Ingresa tu correo electronico",
      "error",
    );
  }

  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexEmail.test(email)) {
    return mostrarMensajeFormulario(
      formForgot,
      "El correo no tiene un formato valido",
      "error",
    );
  }

  btnEnviarForgot.disabled = true;
  btnEnviarForgot.textContent = "Enviando...";

  try {
    const data = await api.solicitarReset(email);

    cerrarModalForgot();

    window.Swal.fire({
      icon: "success",
      title: "Enlace enviado",
      html: `Se envio un enlace de restablecimiento a<br><strong>${email}</strong><br>Revisa tu bandeja de entrada.`,
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Entendido",
    });
  } catch (error) {
    const codigo = error.data?.codigo;
    const mensaje = error.message || "Error al enviar el enlace";

    if (codigo === "NO_BLOQUEADA") {
      mostrarMensajeFormulario(
        formForgot,
        "Esta cuenta no esta bloqueada. Puedes iniciar sesion normalmente.",
        "info",
      );
    } else {
      mostrarMensajeFormulario(formForgot, mensaje, "error");
    }
  } finally {
    btnEnviarForgot.disabled = false;
    btnEnviarForgot.textContent = "Enviar enlace";
  }
};

// ─── CAMBIO OBLIGATORIO ───────────────────────────
const renderizarRequisitos = () => {
  listaRequisitos.innerHTML = "";
  REQUISITOS_PASSWORD.forEach((req) => {
    const li = document.createElement("li");
    li.className = "flex items-center gap-2 text-xs text-zinc-500";
    li.dataset.req = req.id;
    li.innerHTML = `
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke-width="2" />
      </svg>
      <span>${req.label}</span>
    `;
    listaRequisitos.appendChild(li);
  });
};

const actualizarFortaleza = () => {
  const password = inputNueva.value;
  const resultado = evaluarPassword(password);

  resultado.requisitos.forEach((req) => {
    const li = listaRequisitos.querySelector(`[data-req="${req.id}"]`);
    if (!li) return;

    const svg = li.querySelector("svg");
    if (req.ok) {
      li.classList.remove("text-zinc-500");
      li.classList.add("text-brand");
      svg.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4"/>';
    } else {
      li.classList.add("text-zinc-500");
      li.classList.remove("text-brand");
      svg.innerHTML = '<circle cx="12" cy="12" r="9" stroke-width="2" />';
    }
  });

  fortalezaTexto.textContent = resultado.etiqueta;
  fortalezaTexto.style.color = resultado.color;

  barras.forEach((bar, i) => {
    bar.style.backgroundColor =
      i < resultado.nivel ? resultado.color : "#27272a";
  });

  return resultado;
};

const manejarCambioObligatorio = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(formCambio);

  const passwordNueva = inputNueva.value;
  const confirmar = inputConfirmar.value;

  const evalResult = evaluarPassword(passwordNueva);
  if (!evalResult.esValida) {
    return mostrarMensajeFormulario(
      formCambio,
      "La contrasena no cumple todos los requisitos",
      "error",
    );
  }

  if (passwordNueva !== confirmar) {
    return mostrarMensajeFormulario(
      formCambio,
      "Las contrasenas no coinciden",
      "error",
    );
  }

  try {
    const data = await api.cambiarPassword("", passwordNueva);

    // Actualizar el token si el backend devuelve uno nuevo
    if (data && data.token) {
      localStorage.setItem("mysh_token", data.token);
    }

    window.Swal.fire({
      icon: "success",
      title: "Contrasena actualizada",
      text: "Seras redirigido al panel",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1500,
      showConfirmButton: false,
    });

    setTimeout(() => {
      // Redirigir al dashboard (ruta manejada por vercel.json)
      window.location.href = "/dashboard";
    }, 1500);
  } catch (error) {
    mostrarMensajeFormulario(formCambio, error.message, "error");
  }
};

init();
