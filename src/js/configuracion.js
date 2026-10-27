// src/js/configuracion.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";

await construirLayout({
  titulo: "Configuracion",
  subtitulo: "Configuracion general del sistema",
  itemActivo: "configuracion",
});

const contenido = document.getElementById("contenido-config");
const loader = document.getElementById("loader-config");
const btnGuardar = document.getElementById("btn-guardar-config");
const btnReset = document.getElementById("btn-reset-config");

loader.classList.add("hidden");
contenido.classList.remove("hidden");

let configOriginal = {};

// --- Filtrar SOLO enteros en IVA y descuento ---
["cfg-iva", "cfg-descuento"].forEach((id) => {
  const input = document.getElementById(id);

  // Bloquear teclas no numericas
  input.addEventListener("keypress", (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  });

  // Filtrar al escribir (por si acaso)
  input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Filtrar al pegar
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData("text");
    const soloDigitos = texto.replace(/\D/g, "");
    document.execCommand("insertText", false, soloDigitos);
  });
});

// --- Cargar configuracion ---
const cargarConfig = async () => {
  try {
    const res = await api.obtenerConfiguracion();
    const config = res.configuracion || {};
    configOriginal = { ...config };

    document.getElementById("cfg-nombre").value = config.nombreTaller || "";
    document.getElementById("cfg-nit").value = config.nitTaller || "";
    document.getElementById("cfg-direccion").value =
      config.direccionTaller || "";
    document.getElementById("cfg-telefono").value = config.telefonoTaller || "";

    // decimal a entero (0.19 -> 19, 0.2 -> 20)
    const ivaPct = config.iva !== undefined ? Math.round(config.iva * 100) : 19;
    const descPct =
      config.descuento !== undefined ? Math.round(config.descuento * 100) : 5;

    document.getElementById("cfg-iva").value = ivaPct;
    document.getElementById("cfg-descuento").value = descPct;

    document.querySelectorAll("#contenido-config input").forEach((el) => {
      if (el.value) el.setAttribute("data-has-value", "true");
    });
  } catch (error) {
    console.error("Error al cargar configuracion:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cargar la configuracion",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};

// --- Guardar configuracion ---
btnGuardar.addEventListener("click", async () => {
  const nombre = document.getElementById("cfg-nombre").value.trim();
  const nit = document.getElementById("cfg-nit").value.trim();
  const direccion = document.getElementById("cfg-direccion").value.trim();
  const telefono = document.getElementById("cfg-telefono").value.trim();
  const ivaPct = parseInt(document.getElementById("cfg-iva").value, 10);
  const descPct = parseInt(document.getElementById("cfg-descuento").value, 10);

  if (isNaN(ivaPct) || ivaPct < 0 || ivaPct > 100) {
    window.Swal.fire({
      icon: "warning",
      title: "IVA invalido",
      text: "El IVA debe ser un numero entero entre 0 y 100",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  if (isNaN(descPct) || descPct < 0 || descPct > 100) {
    window.Swal.fire({
      icon: "warning",
      title: "Descuento invalido",
      text: "El descuento debe ser un numero entero entre 0 y 100",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
    return;
  }

  const data = {
    nombreTaller: nombre,
    nitTaller: nit,
    direccionTaller: direccion,
    telefonoTaller: telefono,
    iva: ivaPct / 100, // 20 -> 0.20
    descuento: descPct / 100, // 5 -> 0.05
  };

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";
  btnGuardar.classList.add("opacity-70", "cursor-not-allowed");

  try {
    await api.actualizarConfiguracion(data);
    configOriginal = { ...data };

    await window.Swal.fire({
      icon: "success",
      title: "Configuracion guardada",
      text: `IVA: ${ivaPct}% - Descuento: ${descPct}%`,
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error al guardar configuracion:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo guardar la configuracion",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
    btnGuardar.classList.remove("opacity-70", "cursor-not-allowed");
  }
});

// --- Descartar cambios ---
btnReset.addEventListener("click", async () => {
  const result = await window.Swal.fire({
    title: "Descartar cambios?",
    text: "Se restauraran los valores originales",
    icon: "question",
    showCancelButton: true,
    background: "#18181b",
    color: "#ffffff",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#3f3f46",
    confirmButtonText: "Si, descartar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
  });

  if (!result.isConfirmed) return;
  await cargarConfig();
});

await cargarConfig();
