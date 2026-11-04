// Wrapper de fetch con credenciales y manejo de errores
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

// ─── Cerrar sesion por login en otro dispositivo ─
const cerrarSesionPorInactividad = () => {
  if (window.__avisoSesionMostrado) return;
  window.__avisoSesionMostrado = true;

  if (window.Swal) {
    window.Swal.fire({
      icon: "warning",
      title: "Sesion cerrada",
      html: "Tu sesion ha sido cerrada porque se inicio sesion en otro dispositivo.<br><br>Solo se permite una sesion activa por cuenta.",
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Aceptar",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {}
      window.location.href = "/src/pages/login.html";
    });
  } else {
    window.location.href = "/src/pages/login.html";
  }
};

const request = async (endpoint, options = {}) => {
  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  // Si es FormData, quitar Content-Type para que el navegador lo ponga solo
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // Serializar body si es objeto
  if (
    config.body &&
    typeof config.body === "object" &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  let data = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (!res.ok) {
    // Manejo especial: sesion invalida por login en otro dispositivo
    if (data?.codigo === "SESION_INVALIDADA") {
      if (window.__avisoSesionMostrado) {
        window.location.href = "/src/pages/login.html";
      } else {
        cerrarSesionPorInactividad();
      }
      const err = new Error(data.msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    const err = new Error(data?.msg || "Error en la peticion");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  // ─── Auth ──────────────────────────────────────
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  verify: () => request("/auth/verify"),
  solicitarReset: (email) =>
    request("/auth/solicitar-reset", { method: "POST", body: { email } }),
  verificarTokenReset: (token, email) =>
    request("/auth/verificar-token-reset", {
      method: "POST",
      body: { token, email },
    }),
  cambiarPassword: (passwordActual, passwordNueva) =>
    request("/auth/cambiar-password", {
      method: "POST",
      body: { passwordActual, passwordNueva },
    }),
  restablecerPassword: (token, email, passwordNueva) =>
    request("/auth/restablecer-password", {
      method: "POST",
      body: { token, email, passwordNueva },
    }),

  // ─── Dashboard ─────────────────────────────────
  dashboard: () => request("/dashboard"),
  dashboardPorEstado: () => request("/dashboard/mantenimientos-por-estado"),
  dashboardNotificaciones: () => request("/dashboard/notificaciones"),
  dashboardIngresosPorMes: () => request("/dashboard/ingresos-por-mes"),
  dashboardRankingMecanicos: () => request("/dashboard/ranking-mecanicos"),
  trabajosPendientesMecanico: (id) =>
    request(`/mecanicos/${id}/trabajos-pendientes`),
  resumenPagosMecanicos: (params = {}) =>
    request(`/mecanicos/pagos-resumen?${new URLSearchParams(params)}`),

  // ─── Clientes ──────────────────────────────────
  listarClientes: (params = {}) =>
    request(`/clientes?${new URLSearchParams(params)}`),
  obtenerCliente: (id) => request(`/clientes/${id}`),
  crearCliente: (data) => request("/clientes", { method: "POST", body: data }),
  actualizarCliente: (id, data) =>
    request(`/clientes/${id}`, { method: "PUT", body: data }),
  eliminarCliente: (id) => request(`/clientes/${id}`, { method: "DELETE" }),
  crearClienteYMotoRapido: (data) =>
    request("/clientes/rapido", { method: "POST", body: data }),

  // ─── Motos ─────────────────────────────────────
  listarMotos: (params = {}) =>
    request(`/motos?${new URLSearchParams(params)}`),
  obtenerMoto: (id) => request(`/motos/${id}`),
  historialMoto: (id) => request(`/motos/${id}/historial`),
  crearMoto: (data) => request("/motos", { method: "POST", body: data }),
  listarMarcas: () => request("/motos/marcas"),
  actualizarMoto: (id, data) =>
    request(`/motos/${id}`, { method: "PUT", body: data }),
  eliminarMoto: (id) => request(`/motos/${id}`, { method: "DELETE" }),

  // ─── Mecanicos ─────────────────────────────────
  listarMecanicos: (params = {}) =>
    request(`/mecanicos?${new URLSearchParams(params)}`),
  obtenerMecanico: (id) => request(`/mecanicos/${id}`),
  estadisticasMecanico: (id) => request(`/mecanicos/${id}/estadisticas`),
  pagarMecanico: (id) => request(`/mecanicos/${id}/pagar`, { method: "POST" }),
  crearMecanico: (data) =>
    request("/mecanicos", { method: "POST", body: data }),
  actualizarMecanico: (id, data) =>
    request(`/mecanicos/${id}`, { method: "PUT", body: data }),
  eliminarMecanico: (id) => request(`/mecanicos/${id}`, { method: "DELETE" }),
  toggleActivoMecanico: (id) =>
    request(`/mecanicos/${id}/toggle-activo`, { method: "PATCH" }),

  // ─── Servicios ─────────────────────────────────
  listarServicios: (params = {}) =>
    request(`/servicios?${new URLSearchParams(params)}`),
  obtenerServicio: (id) => request(`/servicios/${id}`),
  crearServicio: (data) =>
    request("/servicios", { method: "POST", body: data }),
  actualizarServicio: (id, data) =>
    request(`/servicios/${id}`, { method: "PUT", body: data }),
  eliminarServicio: (id) => request(`/servicios/${id}`, { method: "DELETE" }),

  // ─── Servicios Diarios ─────────────────────────
  listarServiciosDiarios: (params = {}) =>
    request(`/servicios-diarios?${new URLSearchParams(params)}`),
  obtenerServicioDiario: (id) => request(`/servicios-diarios/${id}`),
  crearServicioDiario: (data) =>
    request("/servicios-diarios", { method: "POST", body: data }),
  eliminarServicioDiario: (id) =>
    request(`/servicios-diarios/${id}`, { method: "DELETE" }),

  // ─── Repuestos ─────────────────────────────────
  generarReferenciaRepuesto: () => request("/repuestos/generar-referencia"),
  listarRepuestos: (params = {}) =>
    request(`/repuestos?${new URLSearchParams(params)}`),
  obtenerRepuesto: (id) => request(`/repuestos/${id}`),
  crearRepuesto: (data) =>
    request("/repuestos", { method: "POST", body: data }),
  actualizarRepuesto: (id, data) =>
    request(`/repuestos/${id}`, { method: "PUT", body: data }),
  ajustarStock: (id, cantidad, motivo) =>
    request(`/repuestos/${id}/ajustar-stock`, {
      method: "POST",
      body: { cantidad, motivo },
    }),
  venderRepuesto: (id, data) =>
    request(`/repuestos/${id}/vender`, { method: "POST", body: data }),
  eliminarRepuesto: (id) => request(`/repuestos/${id}`, { method: "DELETE" }),
  historialVentas: (params = {}) =>
    request(`/repuestos/ventas?${new URLSearchParams(params)}`),
  reversarVenta: (id, motivo) =>
    request(`/repuestos/ventas/${id}/reverso`, {
      method: "POST",
      body: { motivo },
    }),

  // ─── Configuracion ─────────────────────────────
  obtenerConfiguracion: () => request("/configuracion"),
  actualizarConfiguracion: (data) =>
    request("/configuracion", { method: "PUT", body: data }),

  // ─── Marcas de repuestos ───────────────────────
  listarMarcasRepuestos: (params = {}) =>
    request(`/marcas-repuestos?${new URLSearchParams(params)}`),
  obtenerMarcaRepuesto: (id) => request(`/marcas-repuestos/${id}`),
  crearMarcaRepuesto: (data) =>
    request("/marcas-repuestos", { method: "POST", body: data }),
  actualizarMarcaRepuesto: (id, data) =>
    request(`/marcas-repuestos/${id}`, { method: "PUT", body: data }),
  eliminarMarcaRepuesto: (id) =>
    request(`/marcas-repuestos/${id}`, { method: "DELETE" }),

  // ─── Categorias de repuestos ───────────────────
  listarCategoriasRepuestos: (params = {}) =>
    request(`/categorias-repuestos?${new URLSearchParams(params)}`),
  obtenerCategoriaRepuesto: (id) => request(`/categorias-repuestos/${id}`),
  crearCategoriaRepuesto: (data) =>
    request("/categorias-repuestos", { method: "POST", body: data }),
  actualizarCategoriaRepuesto: (id, data) =>
    request(`/categorias-repuestos/${id}`, { method: "PUT", body: data }),
  eliminarCategoriaRepuesto: (id) =>
    request(`/categorias-repuestos/${id}`, { method: "DELETE" }),

  // ─── Proveedores ───────────────────────────────
  listarProveedores: (params = {}) =>
    request(`/proveedores?${new URLSearchParams(params)}`),
  obtenerProveedor: (id) => request(`/proveedores/${id}`),
  crearProveedor: (data) =>
    request("/proveedores", { method: "POST", body: data }),
  actualizarProveedor: (id, data) =>
    request(`/proveedores/${id}`, { method: "PUT", body: data }),
  eliminarProveedor: (id) =>
    request(`/proveedores/${id}`, { method: "DELETE" }),

  // ─── Mantenimientos ────────────────────────────
  listarMantenimientos: (params = {}) =>
    request(`/mantenimientos?${new URLSearchParams(params)}`),
  obtenerMantenimiento: (id) => request(`/mantenimientos/${id}`),
  crearMantenimiento: (formData) =>
    request("/mantenimientos", { method: "POST", body: formData }),
  actualizarMantenimiento: (id, data) =>
    request(`/mantenimientos/${id}`, { method: "PUT", body: data }),
  actualizarMantenimientoCompleto: (id, data) =>
    request(`/mantenimientos/${id}/completo`, { method: "PUT", body: data }),
  cambiarEstadoMantenimiento: (id, estado, nota) =>
    request(`/mantenimientos/${id}/estado`, {
      method: "PATCH",
      body: { estado, nota },
    }),
  subirImagenes: (id, formData) =>
    request(`/mantenimientos/${id}/imagenes`, {
      method: "POST",
      body: formData,
    }),
  eliminarImagen: (id, index) =>
    request(`/mantenimientos/${id}/imagenes/${index}`, { method: "DELETE" }),
  registrarAnticipo: (id, monto, metodo, referencia) =>
    request(`/mantenimientos/${id}/anticipo`, {
      method: "POST",
      body: { monto, metodo, referencia },
    }),
  eliminarMantenimiento: (id) =>
    request(`/mantenimientos/${id}`, { method: "DELETE" }),

  // ─── Transacciones ─────────────────────────────
  listarTransacciones: (params = {}) =>
    request(`/transacciones?${new URLSearchParams(params)}`),
  obtenerTransaccion: (id) => request(`/transacciones/${id}`),
  crearTransaccion: (data) =>
    request("/transacciones", { method: "POST", body: data }),
  resumenFinanciero: (params = {}) =>
    request(`/transacciones/resumen?${new URLSearchParams(params)}`),
  eliminarTransaccion: (id) =>
    request(`/transacciones/${id}`, { method: "DELETE" }),

  // ─── Perfil ────────────────────────────────────
  actualizarPerfil: (data) =>
    request("/auth/perfil", { method: "PUT", body: data }),
};
