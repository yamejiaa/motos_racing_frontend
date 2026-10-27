import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import "flatpickr/dist/flatpickr.min.css";
import "./fechas.css";

// ─── Anclar el calendario al ancho del input ──────
const ajustarCalendario = (instance) => {
  const input = instance.input;
  const calendar = instance.calendarContainer;
  if (!input || !calendar) return;

  // Ancho disponible: el del input, con minimo 280
  const inputWidth = Math.max(input.offsetWidth, 280);
  // Margen de seguridad para no salirse de la pantalla
  const maxWidth = Math.min(inputWidth, window.innerWidth - 24);

  calendar.style.width = `${maxWidth}px`;
  calendar.style.minWidth = `${maxWidth}px`;
  calendar.style.maxWidth = `${maxWidth}px`;

  // Anclar horizontalmente al borde izquierdo del input
  const inputRect = input.getBoundingClientRect();
  const calendarRect = calendar.getBoundingClientRect();

  // Si el calendario se sale por la derecha, alinearlo al borde derecho del input
  if (inputRect.left + maxWidth > window.innerWidth - 12) {
    calendar.style.left = "auto";
    calendar.style.right = `${window.innerWidth - inputRect.right}px`;
  } else {
    calendar.style.right = "auto";
    calendar.style.left = `${inputRect.left}px`;
  }
};

// ─── Opciones base ────────────────────────────────
const OPCIONES_BASE = {
  locale: Spanish,
  disableMobile: true,
  monthSelectorType: "dropdown",
  static: false,
  position: "auto",
  onChange: (selectedDates, dateStr, instance) => {
    instance.input.dispatchEvent(new Event("input", { bubbles: true }));
  },
  onClose: (selectedDates, dateStr, instance) => {
    instance.input.dispatchEvent(new Event("change", { bubbles: true }));
  },
  onReady: (selectedDates, dateStr, instance) => {
    ajustarCalendario(instance);
  },
  onOpen: (selectedDates, dateStr, instance) => {
    setTimeout(() => ajustarCalendario(instance), 0);
  },
};

// ─── Inicializar fechas ───────────────────────────
export const inicializarFechas = (contenedor = document) => {
  contenedor.querySelectorAll(".input-fecha").forEach((input) => {
    if (input._flatpickr) return;

    flatpickr(input, {
      ...OPCIONES_BASE,
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d \\d\\e F \\d\\e Y",
      allowInput: false,
    });
  });

  contenedor.querySelectorAll(".input-hora").forEach((input) => {
    if (input._flatpickr) return;

    flatpickr(input, {
      ...OPCIONES_BASE,
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
    });
  });

  contenedor.querySelectorAll(".input-fecha-hora").forEach((input) => {
    if (input._flatpickr) return;

    flatpickr(input, {
      ...OPCIONES_BASE,
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      altInput: true,
      altFormat: "d \\d\\e F \\d\\e Y, H:i",
      time_24hr: true,
    });
  });
};

// ─── Boton "fecha actual" ─────────────────────────
export const bindBotonesFechaHoy = (contenedor = document) => {
  contenedor.querySelectorAll(".btn-fecha-hoy").forEach((btn) => {
    if (btn.dataset.bind === "1") return;
    btn.dataset.bind = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const input = document.getElementById(btn.dataset.target);
      if (!input || !input._flatpickr) return;

      const fp = input._flatpickr;

      if (!input.value || input.value.trim() === "") {
        fp.setDate(new Date(), true);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        fp.open();
      }
    });
  });
};

// Recalcular cuando se redimensiona la ventana
window.addEventListener("resize", () => {
  document.querySelectorAll(".flatpickr-calendar.open").forEach((cal) => {
    const input =
      document.querySelector(
        `[data-flatpickr-input="${cal.dataset.inputId}"]`,
      ) || document.querySelector(".flatpickr-input.active");
    if (input && input._flatpickr) ajustarCalendario(input._flatpickr);
  });
});

export const refrescarFechas = (contenedor = document) => {
  inicializarFechas(contenedor);
  bindBotonesFechaHoy(contenedor);
};
