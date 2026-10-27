import { api } from "./api.js";
import { cargarLibrerias } from "./ui.js";
import { evaluarPassword, REQUISITOS_PASSWORD } from "./validaciones.js";
import {
  mostrarMensajeFormulario,
  limpiarMensajesFormulario,
} from "./mensajes.js";

const estadoVerificando = document.getElementById("estado-verificando");
const estadoInvalido = document.getElementById("estado-invalido");
const estadoFormulario = document.getElementById("estado-formulario");

const form = document.getElementById("form-restablecer");
const inputNueva = document.getElementById("password-nueva");
const inputConfirmar = document.getElementById("password-confirmar");
const fortalezaTexto = document.getElementById("fortaleza-texto");
const listaRequisitos = document.getElementById("lista-requisitos");
const barras = document.querySelectorAll("[data-bar]");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");
const email = params.get("email");

const init = async () => {
  await cargarLibrerias();

  if (!token || !email) {
    return mostrarInvalido(
      "Enlace invalido",
      "El enlace no contiene los datos necesarios.",
    );
  }

  try {
    await api.verificarTokenReset(token, email);
    mostrarFormulario();
  } catch (error) {
    const mensaje = error.message || "Enlace invalido o expirado";
    mostrarInvalido("No se puede restablecer", mensaje);
  }
};

const mostrarInvalido = (titulo, mensaje) => {
  estadoVerificando.classList.add("hidden");
  estadoInvalido.classList.remove("hidden");

  if (titulo)
    document.getElementById("estado-invalido-titulo").textContent = titulo;
  if (mensaje)
    document.getElementById("estado-invalido-mensaje").textContent = mensaje;
};

const mostrarFormulario = () => {
  estadoVerificando.classList.add("hidden");
  estadoFormulario.classList.remove("hidden");

  renderizarRequisitos();
  bindEventos();
};

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

const bindEventos = () => {
  inputNueva.addEventListener("input", actualizarFortaleza);
  form.addEventListener("submit", manejarSubmit);
};

const manejarSubmit = async (e) => {
  e.preventDefault();
  limpiarMensajesFormulario(form);

  const passwordNueva = inputNueva.value;
  const confirmar = inputConfirmar.value;

  const evalResult = evaluarPassword(passwordNueva);
  if (!evalResult.esValida) {
    return mostrarMensajeFormulario(
      form,
      "La contrasena no cumple todos los requisitos",
      "error",
    );
  }

  if (passwordNueva !== confirmar) {
    return mostrarMensajeFormulario(
      form,
      "Las contrasenas no coinciden",
      "error",
    );
  }

  try {
    await api.restablecerPassword(token, email, passwordNueva);

    window.Swal.fire({
      icon: "success",
      title: "Contrasena restablecida",
      text: "Ya puedes iniciar sesion",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 1800,
      showConfirmButton: false,
    });

    setTimeout(() => {
      window.location.href = "/src/pages/login.html";
    }, 1800);
  } catch (error) {
    mostrarMensajeFormulario(
      form,
      error.message || "Error al restablecer",
      "error",
    );
  }
};

init();
