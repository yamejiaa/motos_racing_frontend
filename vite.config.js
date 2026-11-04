import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/login.html"),
        dashboard: resolve(__dirname, "src/pages/dashboard.html"),
        clientes: resolve(__dirname, "src/pages/clientes.html"),
        motos: resolve(__dirname, "src/pages/motos.html"),
        mecanicos: resolve(__dirname, "src/pages/mecanicos.html"),
        servicios: resolve(__dirname, "src/pages/servicios.html"),
        repuestos: resolve(__dirname, "src/pages/repuestos.html"),
        proveedores: resolve(__dirname, "src/pages/proveedores.html"),
        finanzas: resolve(__dirname, "src/pages/finanzas.html"),
        transacciones: resolve(__dirname, "src/pages/transacciones.html"),
        perfil: resolve(__dirname, "src/pages/perfil.html"),
        cambiarPassword: resolve(__dirname, "src/pages/cambiar-password.html"),
        configuracion: resolve(__dirname, "src/pages/configuracion.html"),
        mantenimientos: resolve(__dirname, "src/pages/mantenimientos.html"),
        notificaciones: resolve(__dirname, "src/pages/notificaciones.html"),
        restablecer: resolve(__dirname, "src/pages/restablecer.html"),
      },
    },
  },
});
