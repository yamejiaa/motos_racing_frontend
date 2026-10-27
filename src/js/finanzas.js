// src/js/finanzas.js
import { api } from "./api.js";
import { construirLayout } from "./layout.js";

await construirLayout({
  titulo: "Finanzas",
  subtitulo: "Resumen financiero del negocio",
  itemActivo: "finanzas",
});

const contenido = document.getElementById("contenido-finanzas");
const loader = document.getElementById("loader-finanzas");
const statIngresos = document.getElementById("stat-ingresos");
const statEgresos = document.getElementById("stat-egresos");
const statBalance = document.getElementById("stat-balance");
const balanceIcono = document.getElementById("balance-icono");
const balanceSvg = document.getElementById("balance-svg");
const detalleCategorias = document.getElementById("detalle-categorias");

loader.classList.add("hidden");
contenido.classList.remove("hidden");

const LABELS_CATEGORIA = {
  pago_cliente: "Pago de cliente",
  otro_ingreso: "Otro ingreso",
  compra_repuestos: "Compra de repuestos",
  pago_mecanico: "Pago a mecánico",
  gasto_operativo: "Gasto operativo",
  otro_egreso: "Otro egreso",
};

const formatMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);

// ─── Flatpickr tema oscuro ────────────────────────
let fpDesde, fpHasta;

const inicializarFlatpickr = () => {
  if (!window.flatpickr) return;

  const configBase = {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: window.flatpickr.l10ns?.es || "es",
    disableMobile: true,
    onChange: () => cargarResumen(),
  };

  fpDesde = window.flatpickr("#filtro-desde", configBase);
  fpHasta = window.flatpickr("#filtro-hasta", configBase);
};

document.getElementById("btn-limpiar-fechas").addEventListener("click", () => {
  fpDesde?.clear();
  fpHasta?.clear();
  cargarResumen();
});

// ─── Cargar resumen ───────────────────────────────
const cargarResumen = async () => {
  try {
    const params = {};
    const desde = fpDesde?.input?.value || "";
    const hasta = fpHasta?.input?.value || "";

    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta + "T23:59:59";

    const res = await api.resumenFinanciero(params);

    statIngresos.textContent = formatMoneda(res.ingresos);
    statEgresos.textContent = formatMoneda(res.egresos);
    statBalance.textContent = formatMoneda(res.balance);

    // Color del balance (usando classList, no className en SVG)
    if (res.balance >= 0) {
      statBalance.classList.remove("text-red-500");
      statBalance.classList.add("text-brand");
      balanceIcono.classList.remove("bg-red-500/10");
      balanceIcono.classList.add("bg-brand/10");
      balanceSvg.classList.remove("text-red-500");
      balanceSvg.classList.add("text-brand");
    } else {
      statBalance.classList.remove("text-brand");
      statBalance.classList.add("text-red-500");
      balanceIcono.classList.remove("bg-brand/10");
      balanceIcono.classList.add("bg-red-500/10");
      balanceSvg.classList.remove("text-brand");
      balanceSvg.classList.add("text-red-500");
    }

    renderDetalle(res.detallePorCategoria || []);
  } catch (error) {
    console.error("Error al cargar resumen:", error);
    window.Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo cargar el resumen financiero",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
    });
  }
};

// ─── Render detalle por categoría ─────────────────
const renderDetalle = (detalle) => {
  if (!detalle || detalle.length === 0) {
    detalleCategorias.innerHTML = `
      <div class="text-center text-zinc-500 text-sm py-8">
        No hay movimientos en el período seleccionado.
      </div>
    `;
    return;
  }

  const ingresos = detalle.filter((d) => d._id.tipo === "ingreso");
  const egresos = detalle.filter((d) => d._id.tipo === "egreso");

  const renderGrupo = (items, tipo) => {
    if (items.length === 0) return "";

    const color = tipo === "ingreso" ? "text-brand" : "text-red-500";
    const bgColor = tipo === "ingreso" ? "bg-brand" : "bg-red-500";
    const totalGrupo = items.reduce((sum, i) => sum + i.total, 0);

    return `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-wider font-medium pb-2 border-b border-ink-border">
          <span>${tipo === "ingreso" ? "Ingresos" : "Egresos"}</span>
          <span>${formatMoneda(totalGrupo)}</span>
        </div>
        ${items
          .map((d) => {
            const porcentaje =
              totalGrupo > 0 ? (d.total / totalGrupo) * 100 : 0;
            const label = LABELS_CATEGORIA[d._id.categoria] || d._id.categoria;

            return `
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-zinc-300">${label}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-zinc-500">${d.count} mov.</span>
                  <span class="font-medium ${color}">${formatMoneda(d.total)}</span>
                </div>
              </div>
              <div class="w-full h-1.5 bg-ink rounded-full overflow-hidden">
                <div class="${bgColor} h-full rounded-full transition-all" style="width: ${porcentaje}%"></div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  };

  detalleCategorias.innerHTML = `
    <div class="space-y-6">
      ${renderGrupo(ingresos, "ingreso")}
      ${renderGrupo(egresos, "egreso")}
    </div>
  `;
};

inicializarFlatpickr();
await cargarResumen();
