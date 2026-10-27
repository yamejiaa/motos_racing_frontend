import "../css/tailwind.css";

const init = async () => {
  try {
    const res = await fetch("/api/auth/verify", {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();

      if (data.usuario.debeCambiarPassword) {
        window.location.href = "/src/pages/login.html?cambio=obligatorio";
        return;
      }

      window.location.href = "/src/pages/dashboard.html";
    } else {
      window.location.href = "/src/pages/login.html";
    }
  } catch (error) {
    window.location.href = "/src/pages/login.html";
  }
};

init();
