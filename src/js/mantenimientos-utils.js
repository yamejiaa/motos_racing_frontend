// ─── Formateo ─────────────────────────────────────
export const formatearMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);

export const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Estados ──────────────────────────────────────
export const ESTADOS = [
  { value: "Recibido", label: "Recibido", color: "blue" },
  { value: "En Diagnostico", label: "En Diagnostico", color: "yellow" },
  { value: "En Reparacion", label: "En Reparacion", color: "orange" },
  { value: "Listo", label: "Listo", color: "purple" },
  { value: "Entregado", label: "Entregado", color: "brand" },
];

export const colorEstado = (estado) => {
  const colores = {
    Recibido: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "En Diagnostico": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    "En Reparacion": "bg-orange-500/10 text-orange-400 border-orange-500/30",
    Listo: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    Entregado: "bg-brand/10 text-brand border-brand/30",
  };
  return colores[estado] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
};

export const colorEstadoPago = (estadoPago) => {
  const colores = {
    Pendiente: "bg-red-500/10 text-red-400 border-red-500/30",
    Abonado: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    Pagado: "bg-brand/10 text-brand border-brand/30",
  };
  return colores[estadoPago] || "bg-zinc-500/10 text-zinc-400";
};

// ─── Badges HTML ──────────────────────────────────
export const badgeEstado = (estado) => `
  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${colorEstado(estado)}">
    ${estado}
  </span>
`;

export const badgeEstadoPago = (estadoPago) => `
  <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${colorEstadoPago(estadoPago)}">
    ${estadoPago}
  </span>
`;

// ─── Busqueda de motos por placa ─────────────────
export const buscarMotosPorPlaca = async (placa) => {
  if (!placa || placa.length < 2) return [];
  try {
    const { api } = await import("./api.js");
    const data = await api.listarMotos({ search: placa, limit: 10 });
    return data.motos || [];
  } catch (error) {
    console.error("Error al buscar motos:", error);
    return [];
  }
};

export const formatearInputMoneda = (valor) => {
  const num = String(valor).replace(/\D/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString("es-CO");
};

export const parsearMoneda = (str) => {
  const num = String(str).replace(/\D/g, "");
  return num ? parseInt(num, 10) : 0;
};
