import { api } from "./api.js";
import { bloquearScroll, desbloquearScroll } from "./ui.js";

// ─── Configuracion de items del menu ─────────────
const MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "home",
    href: "/dashboard",
  },
  {
    id: "mantenimientos",
    label: "Mantenimientos",
    icon: "edit",
    submenu: [
      { label: "Lista", href: "/mantenimientos" },
      { label: "Kanban", href: "/mantenimientos?view=kanban" },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: "users",
    href: "/clientes",
  },
  {
    id: "motos",
    label: "Motos",
    icon: "moto",
    href: "/motos",
  },
  {
    id: "mecanicos",
    label: "Mecanicos",
    icon: "worker",
    submenu: [
      { label: "Todos", href: "/mecanicos", hrefMatch: "/mecanicos" },
      {
        label: "Pagos y comisiones",
        href: "/mecanicos?view=pagos",
        hrefMatch: "/mecanicos?view=pagos",
      },
    ],
  },
  {
    id: "servicios",
    label: "Servicios",
    icon: "clipboard",
    submenu: [
      { label: "Catalogo", href: "/servicios" },
      { label: "Diarios", href: "/servicios?view=diarios" },
    ],
  },
  {
    id: "repuestos",
    label: "Repuestos",
    icon: "box",
    submenu: [
      { label: "Catalogo", href: "/repuestos" },
      { label: "Vender", href: "/repuestos?view=vender" },
      { label: "Historial", href: "/repuestos?view=historial" },
      { label: "Marcas", href: "/repuestos?view=marcas" },
      { label: "Categorias", href: "/repuestos?view=categorias" },
    ],
  },
  {
    id: "proveedores",
    label: "Proveedores",
    icon: "truck",
    href: "/proveedores",
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: "cash",
    submenu: [
      { label: "Resumen", href: "/finanzas" },
      { label: "Ingresos", href: "/transacciones?tipo=ingreso" },
      { label: "Egresos", href: "/transacciones?tipo=egreso" },
    ],
  },
  {
    id: "configuracion",
    label: "Configuracion",
    icon: "cog",
    submenu: [
      { label: "Mi perfil", href: "/perfil" },
      { label: "Cambiar contrasena", href: "/cambiar-password" },
      { label: "Sistema", href: "/configuracion" },
    ],
  },
];

// ─── Iconos SVG inline ────────────────────────────
const ICONOS = {
  home: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  edit: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>',
  users:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
  moto: '<circle cx="5.5" cy="17.5" r="3.5" stroke-width="2"/><circle cx="18.5" cy="17.5" r="3.5" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 6h3l2 8M9 6h6l1 5H5l1-5h3zm0 0l-1-3H4"/>',
  worker:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17h2m14 0h2M5 17V9a3 3 0 013-3h8a3 3 0 013 3v8M5 17h14M5 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M17 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M9 6V5a3 3 0 013-3h0a3 3 0 013 3v1"/>',
  clipboard:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
  box: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
  truck:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>',
  cash: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  cog: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3" stroke-width="2"/>',
};

// ─── Generadores de HTML ──────────────────────────
const generarSidebarHTML = () => {
  const menuHTML = MENU_ITEMS.map((item) => {
    if (item.submenu && item.submenu.length > 0) {
      return `
        <div class="nav-group" data-item="${item.id}">
          <button class="nav-item w-full justify-between" data-group="${item.id}">
            <span class="flex items-center gap-3">
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${ICONOS[item.icon]}</svg>
              <span>${item.label}</span>
            </span>
            <svg class="w-4 h-4 nav-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
          <div class="nav-submenu hidden pl-6 mt-1 space-y-0.5">
            ${item.submenu
              .map(
                (sub) => `
              <a href="${sub.href}" class="nav-subitem" data-href="${sub.href}">${sub.label}</a>
            `,
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <a href="${item.href}" class="nav-item" data-item="${item.id}" data-href="${item.href}">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${ICONOS[item.icon]}</svg>
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  return `
    <aside id="sidebar" class="w-72 max-w-[85vw] bg-ink-soft border-r border-ink-border fixed inset-y-0 left-0 z-40 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 flex flex-col">
      <div class="px-5 py-4 border-b border-ink-border flex items-center justify-center shrink-0">
        <img src="/logo-horizontal.png" alt="Motos Racing Quibdo" class="h-9 w-68 object-contain shrink-0 rounded-lg">
      </div>

      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        ${menuHTML}
      </nav>

      <div class="border-t border-ink-border p-3 shrink-0">
        <div class="flex items-center gap-3 p-2 rounded-lg">
          <div id="sidebar-avatar" class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0">--</div>
          <div class="min-w-0 flex-1">
            <p id="sidebar-nombre" class="text-sm font-medium truncate">Cargando...</p>
            <p id="sidebar-rol" class="text-xs text-zinc-500 truncate">-</p>
          </div>
          <button id="btn-logout" class="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors shrink-0" aria-label="Cerrar sesion">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 hidden lg:hidden"></div>
  `;
};

const generarHeaderHTML = (titulo, subtitulo) => {
  return `
    <header class="bg-ink-soft border-b border-ink-border px-4 py-3 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <button id="btn-toggle-sidebar" class="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg transition-colors shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M18 18H4"/>
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-base sm:text-lg font-bold truncate">${titulo}</h1>
          ${subtitulo ? `<p class="text-[11px] text-zinc-500 hidden sm:block truncate">${subtitulo}</p>` : ""}
        </div>
      </div>

      <div class="relative shrink-0">
        <button id="btn-notificaciones" class="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Notificaciones">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span id="notif-badge" class="hidden absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
        </button>

        <div id="notif-panel" class="hidden absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-ink-soft border border-ink-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div class="flex items-center justify-between px-4 py-3 border-b border-ink-border">
            <h3 class="text-sm font-bold">Notificaciones</h3>
            <button id="btn-marcar-leidas" class="text-xs text-brand hover:text-brand-dark transition-colors">Marcar como leidas</button>
          </div>
          <div id="notif-lista" class="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
            <div class="p-8 text-center text-zinc-500 text-sm">Cargando...</div>
          </div>
          <div class="border-t border-ink-border px-4 py-2">
            <a href="/notificaciones" class="block text-center text-xs text-zinc-500 hover:text-brand transition-colors py-1">Ver todas</a>
          </div>
        </div>
      </div>
    </header>
  `;
};

// ─── Logica de notificaciones (compartida) ────────
const CLAVE_LEIDAS = "motos_racing_notif_leidas";

const obtenerLeidas = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LEIDAS) || "[]");
  } catch {
    return [];
  }
};

const guardarLeidas = (ids) => {
  localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(ids));
};

const cargarNotificaciones = async () => {
  const badge = document.getElementById("notif-badge");
  const lista = document.getElementById("notif-lista");

  if (!badge || !lista) return;

  try {
    const data = await api.dashboardNotificaciones();
    const leidas = obtenerLeidas();
    const noLeidas = data.notificaciones.filter((n) => !leidas.includes(n.id));

    if (noLeidas.length > 0) {
      badge.textContent = noLeidas.length > 99 ? "99+" : noLeidas.length;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    if (data.notificaciones.length === 0) {
      lista.innerHTML = `
        <div class="p-8 text-center text-zinc-500 text-sm">
          No tienes notificaciones
        </div>
      `;
      return;
    }

    const coloresTipo = {
      danger: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
      warning: {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        dot: "bg-yellow-500",
      },
      info: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
    };

    lista.innerHTML = data.notificaciones
      .map((n) => {
        const color = coloresTipo[n.tipo] || coloresTipo.info;
        const esLeida = leidas.includes(n.id);

        return `
        <a href="${n.enlace || "#"}" class="notif-item flex items-start gap-3 p-3 border-b border-ink-border hover:bg-white/5 transition-colors ${esLeida ? "opacity-50" : ""}" data-id="${n.id}">
          <div class="w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center shrink-0 mt-0.5">
            <div class="w-2 h-2 rounded-full ${color.dot}"></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium ${color.text} mb-0.5">${n.titulo}</p>
            <p class="text-xs text-zinc-400 leading-snug">${n.mensaje}</p>
          </div>
        </a>
      `;
      })
      .join("");

    lista.querySelectorAll(".notif-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        const leidasActuales = obtenerLeidas();
        if (!leidasActuales.includes(id)) {
          leidasActuales.push(id);
          guardarLeidas(leidasActuales);
        }
      });
    });
  } catch (error) {
    console.error("Error al cargar notificaciones:", error);
    lista.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Error al cargar</div>`;
  }
};

const bindNotificaciones = () => {
  const btnNotif = document.getElementById("btn-notificaciones");
  const panel = document.getElementById("notif-panel");
  const btnMarcar = document.getElementById("btn-marcar-leidas");

  if (!btnNotif || !panel) return;

  btnNotif.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("hidden");
  });

  if (btnMarcar) {
    btnMarcar.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        const data = await api.dashboardNotificaciones();
        const ids = data.notificaciones.map((n) => n.id);
        guardarLeidas(ids);
        await cargarNotificaciones();
      } catch (error) {
        console.error(error);
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (
      !panel.classList.contains("hidden") &&
      !panel.contains(e.target) &&
      e.target !== btnNotif
    ) {
      panel.classList.add("hidden");
    }
  });
};

// ─── Funcion principal: construir layout ──────────
export const construirLayout = async ({
  titulo = "Dashboard",
  subtitulo = "",
  itemActivo = "dashboard",
} = {}) => {
  // Verificar autenticacion
  let usuario;
  try {
    const data = await api.verify();
    usuario = data.usuario;
  } catch (error) {
    if (error.status === 401) {
      window.location.href = "/login"; // <--- RUTA CORREGIDA
      return null;
    }
    if (error.status === 403 && error.data?.codigo === "CAMBIO_OBLIGATORIO") {
      window.location.href = "/login?cambio=obligatorio"; // <--- RUTA CORREGIDA
      return null;
    }
    throw error;
  }

  // Inyectar sidebar y overlay ANTES del contenido principal
  const contenedor = document.getElementById("app-layout");
  if (!contenedor) {
    console.error("Falta el elemento #app-layout en el HTML");
    return null;
  }

  // Insertar sidebar como primer hijo del contenedor
  contenedor.insertAdjacentHTML("afterbegin", generarSidebarHTML());

  // Insertar header dentro del bloque de contenido
  const contentWrapper = document.getElementById("app-content");
  if (contentWrapper) {
    contentWrapper.insertAdjacentHTML(
      "afterbegin",
      generarHeaderHTML(titulo, subtitulo),
    );
  }

  // ─── Rellenar datos del usuario en el sidebar ───
  document.getElementById("sidebar-nombre").textContent = usuario.nombre;
  document.getElementById("sidebar-rol").textContent =
    usuario.rol === "admin" ? "Administrador" : usuario.rol;

  const iniciales = usuario.nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  document.getElementById("sidebar-avatar").textContent = iniciales;

  // ─── Marcar item activo ─────────────────────────
  const hrefActual = window.location.pathname;

  // 1. Marcar el item principal (si es link directo)
  const itemEl = document.querySelector(`[data-item="${itemActivo}"]`);
  if (itemEl) {
    if (itemEl.tagName === "A") {
      // Es un link directo (Dashboard, Motos)
      itemEl.classList.add("active");
    } else {
      // Es un grupo con submenu: abrirlo y marcarlo activo
      const grupo = itemEl.closest(".nav-group");
      if (grupo) {
        grupo.classList.add("open");
        const submenu = grupo.querySelector(".nav-submenu");
        if (submenu) submenu.classList.remove("hidden");
        itemEl.classList.add("active");
      }
    }
  }

  // 2. Marcar subitem activo por coincidencia de href
  const hrefConQuery = window.location.pathname + window.location.search;
  const hrefSinQuery = window.location.pathname;
  const queryActual = window.location.search;

  let subitemActivo = null;

  // 1) Buscar coincidencia EXACTA (con query string)
  document.querySelectorAll(".nav-subitem").forEach((sub) => {
    const subHref = sub.dataset.href || "";
    if (subHref === hrefConQuery) {
      subitemActivo = sub;
    }
  });

  // 2) Si no hubo match con query, buscar el que coincida sin query
  if (!subitemActivo) {
    document.querySelectorAll(".nav-subitem").forEach((sub) => {
      const subHref = sub.dataset.href || "";
      const subPath = subHref.split("?")[0];
      const tieneQuery = subHref.includes("?");

      if (subPath === hrefSinQuery && !tieneQuery && !queryActual) {
        subitemActivo = sub;
      }
    });
  }

  // 3) Aplicar estilos al subitem activo y al grupo padre
  if (subitemActivo) {
    subitemActivo.classList.add("active");

    const grupo = subitemActivo.closest(".nav-group");
    if (grupo) {
      grupo.classList.add("open");
      const submenu = grupo.querySelector(".nav-submenu");
      if (submenu) submenu.classList.remove("hidden");

      const navItem = grupo.querySelector(".nav-item");
      if (navItem) {
        navItem.classList.add("active-grupo");
      }
    }
  }

  // ─── Eventos del sidebar ────────────────────────
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const btnToggle = document.getElementById("btn-toggle-sidebar");
  const btnLogout = document.getElementById("btn-logout");

  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      const abierto = !sidebar.classList.contains("-translate-x-full");
      if (abierto) {
        sidebar.classList.add("-translate-x-full");
        sidebarOverlay.classList.add("hidden");
        desbloquearScroll();
      } else {
        sidebar.classList.remove("-translate-x-full");
        sidebarOverlay.classList.remove("hidden");
        bloquearScroll();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      sidebarOverlay.classList.add("hidden");
      desbloquearScroll();
    });
  }

  // Submenus
  document.querySelectorAll(".nav-group").forEach((group) => {
    const btn = group.querySelector(".nav-item");
    const submenu = group.querySelector(".nav-submenu");
    if (!btn || !submenu) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const abierto = group.classList.contains("open");

      document.querySelectorAll(".nav-group.open").forEach((g) => {
        if (g !== group) {
          g.classList.remove("open");
          g.querySelector(".nav-submenu")?.classList.add("hidden");
        }
      });

      if (abierto) {
        group.classList.remove("open");
        submenu.classList.add("hidden");
      } else {
        group.classList.add("open");
        submenu.classList.remove("hidden");
      }
    });
  });

  // Cerrar sidebar en movil al tocar un enlace
  document.querySelectorAll("#sidebar nav a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 1024) {
        sidebar.classList.add("-translate-x-full");
        sidebarOverlay.classList.add("hidden");
        desbloquearScroll();
      }
    });
  });

  // ─── Logout ─────────────────────────────────────
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      bloquearScroll();

      const result = await window.Swal.fire({
        title: "Cerrar sesion?",
        text: "Volveras a la pantalla de inicio",
        icon: "question",
        showCancelButton: true,
        background: "#18181b",
        color: "#ffffff",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#3f3f46",
        confirmButtonText: "Si, cerrar",
        cancelButtonText: "Cancelar",
        allowOutsideClick: false,
      });

      desbloquearScroll();

      if (result.isConfirmed) {
        try {
          await api.logout();
          window.location.href = "/login"; // <--- RUTA CORREGIDA
        } catch (error) {
          console.error(error);
        }
      }
    });
  }

  // Iniciar notificaciones
  bindNotificaciones();
  await cargarNotificaciones();
  // ─── Conexion SSE para detectar sesion iniciada en otro dispositivo ───
  iniciarConexionSSE();

  return usuario;
};
let eventSourceSSE = null;

const iniciarConexionSSE = () => {
  if (eventSourceSSE) return;

  try {
    eventSourceSSE = new EventSource("/api/auth/events");

    eventSourceSSE.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.evento === "sesion-invalidada") {
          mostrarAvisoSesionInvalidada(data.motivo);
        }
      } catch (e) {
        // Ignorar eventos malformados
      }
    };

    eventSourceSSE.onerror = () => {
      // El navegador reintenta automaticamente
    };
  } catch (error) {
    console.error("Error al iniciar SSE:", error);
  }
};

const mostrarAvisoSesionInvalidada = (motivo) => {
  if (window.__avisoSesionMostrado) return;
  window.__avisoSesionMostrado = true;

  // Cerrar la conexion SSE
  if (eventSourceSSE) {
    eventSourceSSE.close();
    eventSourceSSE = null;
  }

  if (window.Swal) {
    window.Swal.fire({
      icon: "warning",
      title: "Sesion cerrada",
      html: `${motivo || "Se inicio sesion en otro dispositivo."}<br><br>Solo se permite una sesion activa por cuenta.`,
      background: "#18181b",
      color: "#ffffff",
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Aceptar",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(async () => {
      // Cerrar sesion y redirigir
      try {
        const { api } = await import("./api.js");
        await api.logout();
      } catch (e) {
        // Ignorar errores al cerrar sesion
      }
      window.location.href = "/login"; // <--- RUTA CORREGIDA
    });
  } else {
    window.location.href = "/login"; // <--- RUTA CORREGIDA
  }
};
