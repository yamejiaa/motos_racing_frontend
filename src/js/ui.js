// Carga GSAP y SweetAlert2 desde CDN si no estan
const cargarScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const cargarCSS = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

export const sincronizarFloatingLabels = (contenedor = document) => {
  const campos = contenedor.querySelectorAll(
    ".field input, .field textarea, .field select",
  );

  campos.forEach((campo) => {
    if (
      campo.value !== undefined &&
      campo.value !== null &&
      campo.value !== ""
    ) {
      campo.setAttribute("data-has-value", "true");
    } else {
      campo.removeAttribute("data-has-value");
    }

    // Sincronizar cuando cambie
    campo.addEventListener("input", () => {
      if (campo.value !== "") {
        campo.setAttribute("data-has-value", "true");
      } else {
        campo.removeAttribute("data-has-value");
      }
    });

    // Sincronizar cuando cambie (selects)
    campo.addEventListener("change", () => {
      if (campo.value !== "") {
        campo.setAttribute("data-has-value", "true");
      } else {
        campo.removeAttribute("data-has-value");
      }
    });
  });
};

export const cargarLibrerias = async () => {
  await Promise.all([
    cargarScript(
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
    ),
    cargarScript("https://cdn.jsdelivr.net/npm/sweetalert2@11"),
  ]);
  cargarCSS(
    "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css",
  );
};

export const alerta = (titulo, texto, icono = "info") => {
  return window.Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    confirmButtonText: "Entendido",
  });
};

export const alertaExito = (titulo, texto = "") =>
  alerta(titulo, texto, "success");
export const alertaError = (titulo, texto = "") =>
  alerta(titulo, texto, "error");
export const alertaWarning = (titulo, texto = "") =>
  alerta(titulo, texto, "warning");

export const confirmar = async (
  titulo,
  texto = "",
  confirmText = "Si, continuar",
) => {
  const result = await window.Swal.fire({
    title: titulo,
    text: texto,
    icon: "warning",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
};

export const mostrarLoader = (titulo = "Procesando...") => {
  window.Swal.fire({
    title: titulo,
    background: "#18181b",
    color: "#ffffff",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => window.Swal.showLoading(),
  });
};

export const cerrarLoader = () => {
  window.Swal.close();
};

export const animarEntrada = (selector, delay = 0) => {
  if (!window.gsap) return;
  window.gsap.from(selector, {
    duration: 0.7,
    y: 30,
    opacity: 0,
    delay,
    ease: "power3.out",
    stagger: 0.08,
  });
};
/**
 * Bloquea el scroll del body cuando hay un modal abierto.
 * Guarda la posicion actual para restaurarla despues.
 */
export const bloquearScroll = () => {
  const scrollY = window.scrollY;
  document.body.style.top = `-${scrollY}px`;
  document.body.classList.add("modal-abierto");
};

/**
 * Desbloquea el scroll del body.
 */
export const desbloquearScroll = () => {
  const scrollY = document.body.style.top;
  document.body.classList.remove("modal-abierto");
  document.body.style.top = "";
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
  }
};

// ─── Sistema de toasts (esquina superior derecha) ─
export const toast = (mensaje, tipo = "info", duracion = 3500) => {
  // Crear contenedor si no existe
  let contenedor = document.getElementById("toast-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-container";
    contenedor.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      max-width: calc(100vw - 32px);
    `;
    document.body.appendChild(contenedor);
  }

  const colores = {
    success: {
      bg: "#052e16",
      border: "#16a34a",
      texto: "#86efac",
      icono: "M5 13l4 4L19 7",
    },
    error: {
      bg: "#450a0a",
      border: "#dc2626",
      texto: "#fca5a5",
      icono: "M6 18L18 6M6 6l12 12",
    },
    warning: {
      bg: "#451a03",
      border: "#f59e0b",
      texto: "#fcd34d",
      icono:
        "M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z",
    },
    info: {
      bg: "#082f49",
      border: "#0284c7",
      texto: "#7dd3fc",
      icono: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const color = colores[tipo] || colores.info;

  const el = document.createElement("div");
  el.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 260px;
    max-width: 360px;
    padding: 12px 14px;
    background-color: ${color.bg};
    border: 1px solid ${color.border};
    border-radius: 10px;
    color: ${color.texto};
    font-size: 13px;
    line-height: 1.4;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: auto;
  `;

  el.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color.border}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;">
      <path d="${color.icono}" />
    </svg>
    <span style="flex:1;">${mensaje}</span>
  `;

  contenedor.appendChild(el);

  // Animacion de entrada
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateX(0)";
  });

  // Autodestruccion
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(20px)";
    setTimeout(() => el.remove(), 300);
  }, duracion);
};
