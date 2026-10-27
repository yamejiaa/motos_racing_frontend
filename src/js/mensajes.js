/**
 * Muestra un mensaje flotante ARRIBA del primer input del formulario.
 * Se autodestruye a los 4 segundos.
 */
export const mostrarMensajeFormulario = (
  formulario,
  mensaje,
  tipo = "error",
) => {
  // Si ya existe un mensaje en este formulario, lo elimina
  const existente = formulario.querySelector(".form-mensaje");
  if (existente) existente.remove();

  const colores = {
    error: {
      bg: "#450a0a",
      border: "#dc2626",
      texto: "#fca5a5",
      icono: "#dc2626",
    },
    success: {
      bg: "#052e16",
      border: "#16a34a",
      texto: "#86efac",
      icono: "#16a34a",
    },
    info: {
      bg: "#082f49",
      border: "#0284c7",
      texto: "#7dd3fc",
      icono: "#0284c7",
    },
  };

  const color = colores[tipo] || colores.error;

  const div = document.createElement("div");
  div.className = "form-mensaje";
  div.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 16px;
    padding: 10px 14px;
    background-color: ${color.bg};
    border: 1px solid ${color.border};
    border-radius: 8px;
    color: ${color.texto};
    font-size: 13px;
    line-height: 1.4;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;

  const iconoSVG =
    tipo === "error"
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icono}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      : tipo === "success"
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icono}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color.icono}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  div.innerHTML = `${iconoSVG}<span>${mensaje}</span>`;

  // Inserta ARRIBA del primer .field del formulario
  const primerField = formulario.querySelector(".field");
  if (primerField) {
    primerField.insertAdjacentElement("beforebegin", div);
  } else {
    formulario.prepend(div);
  }

  // Animacion de entrada
  requestAnimationFrame(() => {
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
  });

  // Autodestruccion a los 4 segundos
  setTimeout(() => {
    div.style.opacity = "0";
    div.style.transform = "translateY(-6px)";
    setTimeout(() => div.remove(), 250);
  }, 4000);

  return div;
};

/**
 * Limpia todos los mensajes flotantes de un formulario.
 */
export const limpiarMensajesFormulario = (formulario) => {
  formulario.querySelectorAll(".form-mensaje").forEach((el) => el.remove());
};
