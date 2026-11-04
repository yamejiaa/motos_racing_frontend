// dashboard.js (SOLO PARA DIAGNÓSTICO)
import { api } from "./api.js";

console.log("=== INICIANDO DASHBOARD ===");
const token = localStorage.getItem("mysh_token");
console.log("Token en dashboard:", token ? "EXISTE" : "NO EXISTE");

const init = async () => {
  try {
    console.log("Llamando a api.verify() desde el dashboard...");
    const data = await api.verify();
    console.log("Verify exitoso:", data);

    // Si llega aquí, el token es válido.
    console.log("Cargando layout...");
    // Aquí iría tu lógica normal de cargar estadísticas y layout
    // const usuario = await construirLayout(...);
  } catch (error) {
    console.error("Error en dashboard:", error);
    if (error.status === 401) {
      console.log("Token inválido en dashboard, redirigiendo a login");
      localStorage.removeItem("mysh_token");
      window.location.href = "/login";
    } else {
      console.log("Otro error, no redirigir");
    }
  }
};

init();
