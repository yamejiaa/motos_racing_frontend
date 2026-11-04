import "../css/tailwind.css";

const init = async () => {
  try {
    const res = await fetch("/api/auth/verify", {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();

      if (data.usuario.debeCambiarPassword) {
        // Usamos la ruta limpia, Vercel la manejará
        window.location.href = "/login?cambio=obligatorio";
        return;
      }

      // Redirigimos al dashboard con ruta limpia
      window.location.href = "/dashboard";
    } else {
      // Redirigimos al login con ruta limpia
      window.location.href = "/login";
    }
  } catch (error) {
    window.location.href = "/login";
  }
};

init();
