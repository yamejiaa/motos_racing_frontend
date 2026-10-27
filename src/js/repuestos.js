import { construirLayout } from "./layout.js";
import { renderCatalogo } from "./repuestos-catalogo.js";
import { renderVender } from "./repuestos-vender.js";
import { renderHistorial } from "./repuestos-historial.js";
import { renderMarcas } from "./repuestos-marcas.js";
import { renderCategorias } from "./repuestos-categorias.js";

const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const vista = params.get("view");

  const titulos = {
    vender: "Vender repuestos",
    historial: "Historial de ventas",
    marcas: "Marcas de repuestos",
    categorias: "Categorias de repuestos",
    catalogo: "Catalogo de repuestos",
  };

  const subtitulos = {
    vender: "Registrar ventas rapidas",
    historial: "Historial completo de ventas",
    marcas: "Gestionar marcas",
    categorias: "Gestionar categorias",
    catalogo: "Inventario del taller",
  };

  const clave = vista || "catalogo";

  const usuario = await construirLayout({
    titulo: titulos[clave] || "Repuestos",
    subtitulo: subtitulos[clave] || "",
    itemActivo: "repuestos",
  });

  if (!usuario) return;

  ["catalogo", "vender", "historial", "marcas", "categorias"].forEach((v) => {
    const el = document.getElementById(`vista-${v}`);
    if (el) el.classList.add("hidden");
  });

  const contenedor = document.getElementById(`vista-${clave}`);
  if (contenedor) contenedor.classList.remove("hidden");

  if (clave === "vender") await renderVender();
  else if (clave === "historial") await renderHistorial();
  else if (clave === "marcas") await renderMarcas();
  else if (clave === "categorias") await renderCategorias();
  else await renderCatalogo();
};

init();
