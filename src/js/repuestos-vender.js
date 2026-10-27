// src/js/repuestos.js
import { api } from "./api.js";
import {
  bloquearScroll,
  desbloquearScroll,
  alertaExito,
  alertaError,
  confirmar,
} from "./ui.js";

// --- Constantes ---
const CEDULA_CONSUMIDOR_FINAL = "222222222222";
const NOMBRE_CONSUMIDOR_FINAL = "Consumidor Final";

let repuestosCache = [];
let repuestoSeleccionado = null;
let configGlobal = {
  iva: 0.19,
  descuento: 0.05,
  nombreTaller: "Motos Racing Quibdo",
  nitTaller: "",
  direccionTaller: "",
  telefonoTaller: "",
};
let clienteSeleccionado = null;
let esConsumidorFinal = true;
let ultimaVenta = null;

const formatearMoneda = (v) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

const parsear = (s) => {
  const num = String(s).replace(/\D/g, "");
  return num ? parseInt(num, 10) : 0;
};

const formatearInput = (v) => {
  const num = String(v).replace(/\D/g, "");
  return num ? parseInt(num, 10).toLocaleString("es-CO") : "";
};

// --- Obtener % como numero entero para mostrar ---
const porcentajeEntero = (decimal) => Math.round((decimal || 0) * 100);

// --- Referencias del modal recibo ---
const modalRecibo = document.getElementById("modal-recibo");
const reciboContenido = document.getElementById("recibo-contenido");
const btnCerrarRecibo = document.getElementById("btn-cerrar-recibo");
const btnImprimirRecibo = document.getElementById("btn-imprimir-recibo");

// --- Referencias del modal venta exitosa ---
const modalVentaExitosa = document.getElementById("modal-venta-exitosa");
const btnCerrarExito = document.getElementById("btn-cerrar-exito");
const btnImprimirExito = document.getElementById("btn-imprimir-exito");

// --- Cargar configuracion del backend ---
const cargarConfiguracion = async () => {
  try {
    const data = await api.obtenerConfiguracion();
    const c = data.configuracion || {};

    configGlobal = {
      iva: typeof c.iva === "number" && !isNaN(c.iva) ? c.iva : 0.19,
      descuento:
        typeof c.descuento === "number" && !isNaN(c.descuento)
          ? c.descuento
          : 0.05,
      nombreTaller: c.nombreTaller || "Motos Racing Quibdo",
      nitTaller: c.nitTaller || "",
      direccionTaller: c.direccionTaller || "",
      telefonoTaller: c.telefonoTaller || "",
    };
  } catch (e) {
    console.error("Error al cargar configuracion:", e);
  }
};

// --- Render principal ---
export const renderVender = async () => {
  const contenedor = document.getElementById("vender-contenido");

  await cargarConfiguracion();

  const ivaLabel = porcentajeEntero(configGlobal.iva);
  const descLabel = porcentajeEntero(configGlobal.descuento);

  contenedor.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-4">

      <!-- Buscador de repuestos -->
      <div class="bg-ink-soft border border-ink-border rounded-xl p-5">
        <span class="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
          Buscar repuesto
        </span>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" id="vender-buscador"
            class="w-full bg-ink border border-ink-border rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-brand focus:ring-2 focus:ring-brand/30 transition-all"
            placeholder="Referencia (MTR####), nombre o categoria...">
        </div>
        <div id="vender-resultados" class="mt-3 hidden max-h-72 overflow-y-auto border border-ink-border rounded-lg bg-ink"></div>
      </div>

      <!-- Repuesto seleccionado -->
      <div id="vender-detalle" class="hidden bg-ink-soft border border-ink-border rounded-xl p-5">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <p id="vender-referencia" class="text-xs font-mono text-brand mb-1">-</p>
            <p id="vender-nombre" class="text-lg font-bold text-white">-</p>
            <p id="vender-marca" class="text-xs text-zinc-500">-</p>
          </div>
          <button id="btn-cambiar-repuesto" class="text-xs text-zinc-500 hover:text-brand shrink-0">
            Cambiar
          </button>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-5 text-sm">
          <div class="bg-ink border border-ink-border rounded-lg p-3">
            <p class="text-xs text-zinc-500 mb-1">Stock</p>
            <p id="vender-stock" class="text-lg font-bold">-</p>
          </div>
          <div class="bg-ink border border-ink-border rounded-lg p-3">
            <p class="text-xs text-zinc-500 mb-1">Precio unit.</p>
            <p id="vender-precio" class="text-lg font-bold text-brand">-</p>
          </div>
          <div class="bg-ink border border-ink-border rounded-lg p-3">
            <p class="text-xs text-zinc-500 mb-1">Total</p>
            <p id="vender-total" class="text-lg font-bold text-brand">-</p>
          </div>
        </div>

        <!-- Cantidad -->
        <div class="field mb-4">
          <input type="text" id="vender-cantidad" placeholder=" " inputmode="numeric" value="1">
          <label for="vender-cantidad">Cantidad</label>
        </div>

        <!-- Seccion de cliente -->
        <div class="bg-ink border border-ink-border rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cliente</p>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="check-consumidor-final" checked class="w-4 h-4 accent-brand">
              <span class="text-xs text-zinc-400">Consumidor Final</span>
            </label>
          </div>

          <div class="field mb-3">
            <input type="text" id="cliente-cedula" placeholder=" " inputmode="numeric" maxlength="15">
            <label for="cliente-cedula">Cedula</label>
          </div>

          <div id="cliente-info-extra" class="hidden space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="field">
                <input type="text" id="cliente-nombre" placeholder=" ">
                <label for="cliente-nombre">Nombre completo</label>
              </div>
              <div class="field">
                <input type="text" id="cliente-telefono" placeholder=" " inputmode="numeric" maxlength="10">
                <label for="cliente-telefono">Telefono</label>
              </div>
            </div>
            <div class="field">
              <input type="email" id="cliente-email" placeholder=" ">
              <label for="cliente-email">Correo electronico (opcional)</label>
            </div>
            <p id="cliente-estado" class="text-xs text-zinc-500"></p>
          </div>
        </div>

        <!-- Monto recibido -->
        <div class="field mb-4">
          <input type="text" id="vender-recibido" placeholder=" " inputmode="numeric">
          <label for="vender-recibido">Monto recibido</label>
        </div>

        <!-- Metodo de pago -->
        <div class="mb-4">
          <label class="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Metodo de pago</label>
          <div class="relative" data-dropdown-metodo>
            <button type="button"
              class="metodo-dropdown-toggle w-full bg-ink border border-ink-border rounded-lg px-4 py-3 text-sm text-white flex items-center justify-between gap-2 hover:border-brand focus:border-brand transition-all">
              <span class="metodo-dropdown-label">Efectivo</span>
              <svg class="w-4 h-4 shrink-0 text-zinc-500 metodo-dropdown-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <input type="hidden" id="vender-metodo" value="Efectivo">
            <div class="metodo-dropdown-menu hidden absolute z-50 mt-1.5 w-full bg-ink-soft border border-ink-border rounded-lg shadow-2xl py-1.5">
              ${["Efectivo", "Transferencia", "Nequi", "Daviplata", "Tarjeta"]
                .map(
                  (m) => `
                <button type="button" class="opcion-metodo w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors" data-value="${m}">${m}</button>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>

        <!-- Resumen con labels DINAMICOS -->
        <div id="vender-resumen" class="hidden bg-ink border border-ink-border rounded-xl p-4 space-y-2 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-zinc-500">Subtotal:</span>
            <span id="vender-subtotal" class="font-medium text-white">$0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">IVA (${ivaLabel}%):</span>
            <span id="vender-iva" class="font-medium text-white">$0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Descuento (${descLabel}%):</span>
            <span id="vender-descuento" class="font-medium text-yellow-500">-$0</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-ink-border">
            <span class="text-white font-bold">TOTAL:</span>
            <span id="vender-total-final" class="font-bold text-brand text-lg">$0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-500">Cambio:</span>
            <span id="vender-cambio" class="font-medium text-white">$0</span>
          </div>
        </div>

        <button id="btn-confirmar-venta"
          class="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          Confirmar venta
        </button>
      </div>

      <!-- Historial del dia -->
      <div class="bg-ink-soft border border-ink-border rounded-xl p-5">
        <h3 class="font-bold text-sm mb-4">Ventas de hoy</h3>
        <div id="vender-historial"></div>
      </div>

    </div>
  `;

  await cargarRepuestos();
  bindEventos();
  bindDropdownMetodo();
  await cargarVentasHoy();
};

const cargarRepuestos = async () => {
  try {
    const data = await api.listarRepuestos({ limit: 500, activo: "true" });
    repuestosCache = data.repuestos || [];
  } catch (error) {
    console.error("Error al cargar repuestos:", error);
  }
};

const bindEventos = () => {
  const buscador = document.getElementById("vender-buscador");
  const resultados = document.getElementById("vender-resultados");
  const btnCambiar = document.getElementById("btn-cambiar-repuesto");
  const btnConfirmar = document.getElementById("btn-confirmar-venta");
  const inputCantidad = document.getElementById("vender-cantidad");
  const inputRecibido = document.getElementById("vender-recibido");
  const checkConsumidor = document.getElementById("check-consumidor-final");
  const inputCedula = document.getElementById("cliente-cedula");

  buscador.addEventListener("input", (e) => {
    const filtro = e.target.value.trim().toLowerCase();
    if (filtro.length < 1) {
      resultados.classList.add("hidden");
      return;
    }
    renderResultados(filtro);
  });

  buscador.addEventListener("focus", () => {
    if (buscador.value.trim().length > 0) {
      renderResultados(buscador.value.trim().toLowerCase());
    }
  });

  document.addEventListener("click", (e) => {
    if (!resultados.contains(e.target) && e.target !== buscador) {
      resultados.classList.add("hidden");
    }
  });

  btnCambiar?.addEventListener("click", () => {
    repuestoSeleccionado = null;
    document.getElementById("vender-detalle").classList.add("hidden");
    buscador.value = "";
    buscador.focus();
  });

  inputCantidad?.addEventListener("input", () => {
    inputCantidad.value = inputCantidad.value.replace(/\D/g, "");
    actualizarTotal();
  });

  inputRecibido?.addEventListener("input", (e) => {
    const valor = parsear(e.target.value);
    e.target.value = valor > 0 ? valor.toLocaleString("es-CO") : "";
    if (valor) e.target.setAttribute("data-has-value", "true");
    else e.target.removeAttribute("data-has-value");
    actualizarTotal();
  });

  checkConsumidor?.addEventListener("change", () => {
    esConsumidorFinal = checkConsumidor.checked;
    if (esConsumidorFinal) {
      inputCedula.value = CEDULA_CONSUMIDOR_FINAL;
      inputCedula.setAttribute("data-has-value", "true");
      inputCedula.disabled = true;
      document.getElementById("cliente-info-extra").classList.add("hidden");
      clienteSeleccionado = null;
    } else {
      inputCedula.value = "";
      inputCedula.removeAttribute("data-has-value");
      inputCedula.disabled = false;
      document.getElementById("cliente-info-extra").classList.add("hidden");
      inputCedula.focus();
    }
  });

  let timeoutCedula = null;
  inputCedula?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 15);
    if (e.target.value) e.target.setAttribute("data-has-value", "true");
    else e.target.removeAttribute("data-has-value");

    clearTimeout(timeoutCedula);
    timeoutCedula = setTimeout(() => buscarCliente(e.target.value), 400);
  });

  if (checkConsumidor?.checked) {
    inputCedula.value = CEDULA_CONSUMIDOR_FINAL;
    inputCedula.setAttribute("data-has-value", "true");
    inputCedula.disabled = true;
  }

  btnConfirmar?.addEventListener("click", manejarVenta);

  btnCerrarRecibo?.addEventListener("click", cerrarRecibo);
  btnImprimirRecibo?.addEventListener("click", () => {
    window.print();
  });

  // Modal venta exitosa
  btnCerrarExito?.addEventListener("click", async () => {
    modalVentaExitosa.classList.add("hidden");
    modalVentaExitosa.classList.remove("flex");
    desbloquearScroll();
    ultimaVenta = null;
    await cargarRepuestos();
    await cargarVentasHoy();
  });

  btnImprimirExito?.addEventListener("click", () => {
    modalVentaExitosa.classList.add("hidden");
    modalVentaExitosa.classList.remove("flex");
    if (ultimaVenta) {
      mostrarRecibo(ultimaVenta);
    }
  });
};

const buscarCliente = async (cedula) => {
  const infoExtra = document.getElementById("cliente-info-extra");
  const estado = document.getElementById("cliente-estado");

  if (!cedula || cedula === CEDULA_CONSUMIDOR_FINAL) {
    infoExtra.classList.add("hidden");
    clienteSeleccionado = null;
    return;
  }

  try {
    const data = await api.buscarClientePorCedula(cedula);

    if (data.encontrado) {
      clienteSeleccionado = data.cliente;
      document.getElementById("cliente-nombre").value =
        data.cliente.nombre || "";
      document.getElementById("cliente-telefono").value =
        data.cliente.telefono || "";
      document.getElementById("cliente-email").value = data.cliente.email || "";

      document
        .getElementById("cliente-nombre")
        .setAttribute("data-has-value", data.cliente.nombre ? "true" : "false");
      document
        .getElementById("cliente-telefono")
        .setAttribute(
          "data-has-value",
          data.cliente.telefono ? "true" : "false",
        );
      document
        .getElementById("cliente-email")
        .setAttribute("data-has-value", data.cliente.email ? "true" : "false");

      estado.textContent = "Cliente registrado en el sistema";
      estado.className = "text-xs text-green-500";
      infoExtra.classList.remove("hidden");
    } else {
      clienteSeleccionado = null;
      document.getElementById("cliente-nombre").value = "";
      document.getElementById("cliente-telefono").value = "";
      document.getElementById("cliente-email").value = "";
      estado.textContent = "Cliente nuevo. Ingresa los datos para registrarlo.";
      estado.className = "text-xs text-yellow-500";
      infoExtra.classList.remove("hidden");
    }
  } catch (error) {
    if (error.status === 404) {
      clienteSeleccionado = null;
      document.getElementById("cliente-nombre").value = "";
      document.getElementById("cliente-telefono").value = "";
      document.getElementById("cliente-email").value = "";
      estado.textContent = "Cliente nuevo. Ingresa los datos para registrarlo.";
      estado.className = "text-xs text-yellow-500";
      infoExtra.classList.remove("hidden");
    } else {
      console.error(error);
    }
  }
};

const bindDropdownMetodo = () => {
  const toggle = document.querySelector(".metodo-dropdown-toggle");
  const menu = document.querySelector(".metodo-dropdown-menu");
  const chevron = document.querySelector(".metodo-dropdown-chevron");
  const label = document.querySelector(".metodo-dropdown-label");
  const input = document.getElementById("vender-metodo");

  toggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
    chevron.classList.toggle("rotate-180");
  });

  document.querySelectorAll(".opcion-metodo").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.value;
      label.textContent = btn.dataset.value;
      menu.classList.add("hidden");
      chevron.classList.remove("rotate-180");
    });
  });

  document.addEventListener("click", (e) => {
    if (menu && !menu.contains(e.target) && e.target !== toggle) {
      menu.classList.add("hidden");
      chevron?.classList.remove("rotate-180");
    }
  });
};

const renderResultados = (filtro) => {
  const resultados = document.getElementById("vender-resultados");
  const filtrados = repuestosCache.filter(
    (r) =>
      r.referencia.toLowerCase().includes(filtro) ||
      r.nombre.toLowerCase().includes(filtro) ||
      (r.marcaId?.nombre || "").toLowerCase().includes(filtro) ||
      (r.categoriaId?.nombre || "").toLowerCase().includes(filtro),
  );

  if (filtrados.length === 0) {
    resultados.innerHTML = `<div class="p-4 text-sm text-zinc-500 text-center">Sin resultados</div>`;
  } else {
    resultados.innerHTML = filtrados
      .slice(0, 20)
      .map(
        (r) => `
      <button class="opcion-repuesto w-full text-left px-4 py-3 text-sm border-b border-ink-border last:border-0 hover:bg-white/5 transition-colors flex items-center justify-between gap-3" data-id="${r._id}">
        <div class="min-w-0">
          <p class="font-mono text-xs text-brand">${r.referencia}</p>
          <p class="text-white truncate">${r.nombre}</p>
          <p class="text-xs text-zinc-500 truncate">${r.marcaId?.nombre || "Sin marca"} - ${r.categoriaId?.nombre || "Sin categoria"}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-brand font-medium">${formatearMoneda(r.precioVenta)}</p>
          <p class="text-xs ${r.stock <= r.stockMinimo ? "text-red-500" : "text-zinc-500"}">Stock: ${r.stock}</p>
        </div>
      </button>
    `,
      )
      .join("");

    resultados.querySelectorAll(".opcion-repuesto").forEach((btn) => {
      btn.addEventListener("click", () => {
        const repuesto = repuestosCache.find((x) => x._id === btn.dataset.id);
        if (repuesto) seleccionarRepuesto(repuesto);
      });
    });
  }

  resultados.classList.remove("hidden");
};

const seleccionarRepuesto = (r) => {
  repuestoSeleccionado = r;

  document.getElementById("vender-resultados").classList.add("hidden");
  document.getElementById("vender-buscador").value =
    `${r.referencia} - ${r.nombre}`;

  document.getElementById("vender-referencia").textContent = r.referencia;
  document.getElementById("vender-nombre").textContent = r.nombre;
  document.getElementById("vender-marca").textContent =
    `${r.marcaId?.nombre || "Sin marca"} - ${r.categoriaId?.nombre || "Sin categoria"}`;
  document.getElementById("vender-stock").textContent = r.stock;
  document.getElementById("vender-precio").textContent = formatearMoneda(
    r.precioVenta,
  );
  document.getElementById("vender-cantidad").value = "1";
  document.getElementById("vender-recibido").value = "";
  document.getElementById("vender-recibido").removeAttribute("data-has-value");
  document.getElementById("vender-resumen").classList.add("hidden");

  document.getElementById("vender-detalle").classList.remove("hidden");

  actualizarTotal();
};

const actualizarTotal = () => {
  if (!repuestoSeleccionado) return;

  const cant =
    parseInt(document.getElementById("vender-cantidad").value, 10) || 1;
  const recibido = parsear(document.getElementById("vender-recibido").value);

  const subtotal = repuestoSeleccionado.precioVenta * cant;
  const iva = Math.round(subtotal * configGlobal.iva);
  const subtotalConIva = subtotal + iva;
  const descuento = Math.round(subtotalConIva * configGlobal.descuento);
  const total = subtotalConIva - descuento;

  document.getElementById("vender-total").textContent = formatearMoneda(total);

  document.getElementById("vender-subtotal").textContent =
    formatearMoneda(subtotal);
  document.getElementById("vender-iva").textContent = formatearMoneda(iva);
  document.getElementById("vender-descuento").textContent =
    `-${formatearMoneda(descuento)}`;
  document.getElementById("vender-total-final").textContent =
    formatearMoneda(total);

  if (recibido > 0) {
    const cambio = Math.max(recibido - total, 0);
    document.getElementById("vender-cambio").textContent =
      formatearMoneda(cambio);
    document.getElementById("vender-resumen").classList.remove("hidden");
  } else {
    document.getElementById("vender-resumen").classList.remove("hidden");
  }
};

const manejarVenta = async () => {
  if (!repuestoSeleccionado) {
    return alertaError("Atencion", "Debes seleccionar un repuesto");
  }

  const cant = parseInt(document.getElementById("vender-cantidad").value, 10);
  const recibido = parsear(document.getElementById("vender-recibido").value);
  const metodo = document.getElementById("vender-metodo").value;

  if (!cant || cant <= 0) {
    return alertaError(
      "Cantidad invalida",
      "La cantidad debe ser mayor a cero",
    );
  }
  if (cant > repuestoSeleccionado.stock) {
    return alertaError(
      "Stock insuficiente",
      `Solo hay ${repuestoSeleccionado.stock} unidades`,
    );
  }

  const subtotal = repuestoSeleccionado.precioVenta * cant;
  const iva = Math.round(subtotal * configGlobal.iva);
  const subtotalConIva = subtotal + iva;
  const descuento = Math.round(subtotalConIva * configGlobal.descuento);
  const total = subtotalConIva - descuento;

  if (recibido < total) {
    return alertaError(
      "Monto insuficiente",
      `El monto recibido debe ser al menos ${formatearMoneda(total)}`,
    );
  }

  const payload = {
    cantidad: cant,
    montoRecibido: recibido,
    metodo,
    consumidorFinal: esConsumidorFinal,
  };

  if (!esConsumidorFinal) {
    const cedula = document.getElementById("cliente-cedula").value.trim();
    const nombre = document.getElementById("cliente-nombre").value.trim();
    const telefono = document.getElementById("cliente-telefono").value.trim();
    const email = document.getElementById("cliente-email").value.trim();

    if (!cedula || !nombre) {
      return alertaError(
        "Datos incompletos",
        "Debes ingresar cedula y nombre del cliente",
      );
    }

    if (clienteSeleccionado) {
      payload.clienteId = clienteSeleccionado._id;
    } else {
      payload.cliente = {
        cedula,
        nombre,
        telefono: telefono || undefined,
        email: email || undefined,
      };
    }
  }

  const btn = document.getElementById("btn-confirmar-venta");
  btn.disabled = true;
  btn.innerHTML = "Procesando...";

  try {
    const data = await api.venderRepuesto(repuestoSeleccionado._id, payload);

    // Guardar venta y mostrar modal de exito
    ultimaVenta = data.venta;
    mostrarModalExito(data.venta);

    // Resetear vista (sin recargar aun)
    repuestoSeleccionado = null;
    clienteSeleccionado = null;
    esConsumidorFinal = true;
    document.getElementById("vender-detalle").classList.add("hidden");
    document.getElementById("vender-buscador").value = "";
    document.getElementById("check-consumidor-final").checked = true;
  } catch (error) {
    alertaError("Error al vender", error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
      </svg>
      Confirmar venta
    `;
  }
};

// --- Mostrar modal de venta exitosa ---
const mostrarModalExito = (venta) => {
  document.getElementById("exito-recibo").textContent = venta.numeroRecibo;
  document.getElementById("exito-total").textContent = formatearMoneda(
    venta.total,
  );
  document.getElementById("exito-recibido").textContent = formatearMoneda(
    venta.montoRecibido,
  );
  document.getElementById("exito-cambio").textContent = formatearMoneda(
    venta.cambio,
  );

  bloquearScroll();
  modalVentaExitosa.classList.remove("hidden");
  modalVentaExitosa.classList.add("flex");
};

const mostrarRecibo = (venta) => {
  const fecha = new Date(venta.fecha).toLocaleString("es-CO");

  const nit = configGlobal.nitTaller || "Pendiente";
  const direccion = configGlobal.direccionTaller || "Quibdo - Choco";
  const telefono = configGlobal.telefonoTaller || "-";

  const ivaLabel = porcentajeEntero(configGlobal.iva);
  const descLabel = porcentajeEntero(configGlobal.descuento);

  const items =
    venta.items && venta.items.length > 0
      ? venta.items
      : [
          {
            referencia: venta.repuesto?.referencia || "",
            nombre: venta.repuesto?.nombre || "",
            cantidad: venta.cantidad,
            precioUnitario: venta.precioUnitario,
            subtotal: venta.subtotal,
          },
        ];

  reciboContenido.innerHTML = `
    <div id="recibo-print" class="text-xs leading-tight">
      <div class="text-center mb-3">
        <p class="font-bold text-sm">${configGlobal.nombreTaller.toUpperCase()}</p>
        <p class="text-xs">NIT: ${nit}</p>
        <p class="text-xs">${direccion}</p>
        <p class="text-xs">Tel: ${telefono}</p>
      </div>

      <div class="border-t border-dashed border-gray-400 my-2"></div>

      <div class="flex justify-between">
        <span>Recibo:</span>
        <span class="font-bold">${venta.numeroRecibo}</span>
      </div>
      <div class="flex justify-between">
        <span>Fecha:</span>
        <span>${fecha}</span>
      </div>

      <div class="border-t border-dashed border-gray-400 my-2"></div>

      <div class="flex justify-between">
        <span>Cliente:</span>
        <span class="font-bold">${venta.clienteInfo?.nombre || "Consumidor Final"}</span>
      </div>
      <div class="flex justify-between">
        <span>CC/NIT:</span>
        <span>${venta.clienteInfo?.cedula || "222222222222"}</span>
      </div>
      ${
        venta.clienteInfo?.telefono
          ? `
        <div class="flex justify-between">
          <span>Tel:</span>
          <span>${venta.clienteInfo.telefono}</span>
        </div>
      `
          : ""
      }

      <div class="border-t border-dashed border-gray-400 my-2"></div>

      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-gray-400">
            <th class="text-left">Descripcion</th>
            <th class="text-center">Cant</th>
            <th class="text-right">Vlr</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (it) => `
            <tr>
              <td class="text-left">${it.nombre}</td>
              <td class="text-center">${it.cantidad}</td>
              <td class="text-right">${formatearMoneda(it.precioUnitario)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="border-t border-dashed border-gray-400 my-2"></div>

      <div class="flex justify-between">
        <span>Subtotal:</span>
        <span>${formatearMoneda(venta.subtotal)}</span>
      </div>
      <div class="flex justify-between">
        <span>IVA (${ivaLabel}%):</span>
        <span>${formatearMoneda(venta.iva)}</span>
      </div>
      <div class="flex justify-between">
        <span>Descuento (${descLabel}%):</span>
        <span>-${formatearMoneda(venta.descuento)}</span>
      </div>

      <div class="border-t border-solid border-gray-800 mt-2 pt-1 flex justify-between font-bold text-sm">
        <span>TOTAL:</span>
        <span>${formatearMoneda(venta.total)}</span>
      </div>

      <div class="flex justify-between mt-1">
        <span>Recibido:</span>
        <span>${formatearMoneda(venta.montoRecibido)}</span>
      </div>
      <div class="flex justify-between">
        <span>Cambio:</span>
        <span>${formatearMoneda(venta.cambio)}</span>
      </div>
      <div class="flex justify-between">
        <span>Metodo:</span>
        <span>${venta.metodo}</span>
      </div>

      <div class="border-t border-dashed border-gray-400 my-2"></div>

      <p class="text-center">Gracias por su compra</p>
      <p class="text-center text-[10px] mt-1">Este recibo no es factura electronica</p>
    </div>
  `;

  bloquearScroll();
  modalRecibo.classList.remove("hidden");
  modalRecibo.classList.add("flex");
};

const cerrarRecibo = async () => {
  modalRecibo.classList.add("hidden");
  modalRecibo.classList.remove("flex");
  desbloquearScroll();

  // Si venimos de una venta reciente, recargar y limpiar
  if (ultimaVenta !== null) {
    ultimaVenta = null;
    await cargarRepuestos();
    await cargarVentasHoy();
  }
};

const cargarVentasHoy = async () => {
  const contenedor = document.getElementById("vender-historial");

  if (!contenedor) return;

  try {
    const hoy = new Date();
    const inicioDia = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
      0,
      0,
      0,
      0,
    );

    const data = await api.historialVentas({
      desde: inicioDia.toISOString(),
      limit: 50,
    });

    if (!data.ventas || data.ventas.length === 0) {
      contenedor.innerHTML = `<p class="text-sm text-zinc-500 text-center py-4">Aun no hay ventas registradas hoy</p>`;
      return;
    }

    contenedor.innerHTML = data.ventas
      .map(
        (v) => `
      <div class="flex items-center justify-between py-2 border-b border-ink-border last:border-0 text-sm">
        <div class="min-w-0">
          <p class="text-white truncate">${v.descripcion}</p>
          <p class="text-xs text-zinc-500">${new Date(v.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <p class="text-brand font-medium shrink-0 ml-3">${formatearMoneda(v.monto)}</p>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    console.error("[Ventas hoy] ERROR:", error);
    contenedor.innerHTML = `<p class="text-sm text-red-500 text-center py-4">Error: ${error.message || "Desconocido"}</p>`;
  }
};
