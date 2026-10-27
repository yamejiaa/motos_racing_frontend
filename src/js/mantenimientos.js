import { construirLayout } from "./layout.js";
import { renderListaMantenimientos } from "./mantenimientos-lista.js";
import { renderKanbanMantenimientos } from "./mantenimientos-kanban.js";

const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const vista = params.get("view") || "lista";

  const usuario = await construirLayout({
    titulo: "Mantenimientos",
    subtitulo:
      vista === "kanban" ? "Tablero de trabajo" : "Historial de mantenimientos",
    itemActivo: "mantenimientos",
  });

  if (!usuario) return;

  // Ocultar todas las vistas
  document.getElementById("vista-lista").classList.add("hidden");
  document.getElementById("vista-kanban").classList.add("hidden");

  if (vista === "kanban") {
    document.getElementById("vista-kanban").classList.remove("hidden");
    await renderKanbanMantenimientos();
  } else {
    document.getElementById("vista-lista").classList.remove("hidden");
    await renderListaMantenimientos();
  }
};

init();
