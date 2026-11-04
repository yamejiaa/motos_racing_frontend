import "../css/tailwind.css";

const init = async () => {
  const token = localStorage.getItem("mysh_token");

  // Si no hay token, directo al login
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    // Hacemos la petición a Vercel (proxy) o directamente a Render
    // Enviamos el token en la cabecera Authorization
    const res = await fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();

      if (data.usuario.debeCambiarPassword) {
        window.location.href = "/login?cambio=obligatorio";
        return;
      }

      window.location.href = "/dashboard";
    } else {
      // Si el token es inválido o expiró, lo borramos y al login
      localStorage.removeItem("mysh_token");
      window.location.href = "/login";
    }
  } catch (error) {
    window.location.href = "/login";
  }
};

init();
