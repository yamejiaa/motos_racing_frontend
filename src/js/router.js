import "../css/tailwind.css";

const init = async () => {
  console.log("=== INICIANDO ROUTER ===");
  const token = localStorage.getItem("mysh_token");
  console.log("Token en localStorage:", token ? "EXISTE" : "NO EXISTE");

  if (!token) {
    console.log("No hay token, redirigiendo a /login");
    window.location.href = "/login";
    return;
  }

  try {
    console.log("Haciendo petición a /api/auth/verify...");
    const res = await fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Respuesta del verify:", res.status);

    if (res.ok) {
      const data = await res.json();
      console.log("Datos del usuario:", data);

      if (data.usuario.debeCambiarPassword) {
        window.location.href = "/login?cambio=obligatorio";
        return;
      }

      console.log("Redirigiendo a /dashboard");
      window.location.href = "/dashboard";
    } else {
      console.log("Verify falló, borrando token y yendo a login");
      localStorage.removeItem("mysh_token");
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Error en el fetch del router:", error);
    window.location.href = "/login";
  }
};

init();
