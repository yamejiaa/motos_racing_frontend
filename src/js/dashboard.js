import { api } from "./api.js";
import { construirLayout } from "./layout.js";

const contenido = document.getElementById("contenido-dashboard");
const loader = document.getElementById("loader-dashboard");

const formatearMoneda = (valor) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);
};

const init = async () => {
  try {
    const usuario = await construirLayout({
      titulo: "Dashboard",
      subtitulo: "Resumen general del taller",
      itemActivo: "dashboard",
    });

    if (!usuario) return;

    await cargarEstadisticas();

    loader.classList.add("hidden");
    contenido.classList.remove("hidden");
  } catch (error) {
    console.error("Error init dashboard:", error);
  }
};

const cargarEstadisticas = async () => {
  try {
    const data = await api.dashboard();

    document.querySelectorAll(".card-stat").forEach((card) => {
      const key = card.dataset.stat;
      const valor = data.totales[key];
      const el = card.querySelector("[data-valor]");

      if (el) {
        let actual = 0;
        const pasos = 20;
        const incremento = valor / pasos;

        const timer = setInterval(() => {
          actual += incremento;
          if (actual >= valor) {
            actual = valor;
            clearInterval(timer);
          }
          el.textContent = Math.round(actual);
        }, 30);
      }
    });

    document.getElementById("stat-ingresos").textContent = formatearMoneda(
      data.finanzas.ingresos,
    );
    document.getElementById("stat-egresos").textContent = formatearMoneda(
      data.finanzas.egresos,
    );
    document.getElementById("stat-balance").textContent = formatearMoneda(
      data.finanzas.balance,
    );

    const balanceEl = document.getElementById("stat-balance");
    balanceEl.style.color = data.finanzas.balance >= 0 ? "#16a34a" : "#dc2626";

    await cargarRanking();
  } catch (error) {
    console.error("Error al cargar estadisticas:", error);
  }
};

const cargarRanking = async () => {
  const contenedor = document.getElementById("ranking-mecanicos");

  try {
    const data = await api.dashboardRankingMecanicos();

    if (!data.ranking || data.ranking.length === 0) {
      contenedor.innerHTML =
        '<p class="text-zinc-500">Aun no hay datos de mecanicos.</p>';
      return;
    }

    contenedor.innerHTML = data.ranking
      .map(
        (m, i) => `
      <div class="flex items-center justify-between p-3 bg-ink rounded-lg border border-ink-border">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full ${i === 0 ? "bg-brand text-white" : "bg-ink-border text-zinc-400"} flex items-center justify-center font-bold text-xs">
            ${i + 1}
          </div>
          <div>
            <p class="font-medium text-white text-sm">${m.nombre}</p>
            <p class="text-xs text-zinc-500">${m.totalMantenimientos} mantenimiento(s)</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-brand font-semibold text-sm">${formatearMoneda(m.totalComision)}</p>
          ${m.pendientePago > 0 ? `<p class="text-xs text-yellow-500">Pendiente: ${formatearMoneda(m.pendientePago)}</p>` : ""}
        </div>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML =
      '<p class="text-red-500">Error al cargar el ranking.</p>';
  }
};

init();
