// Reglas de fortaleza de contrasena
export const REQUISITOS_PASSWORD = [
  { id: "length", label: "Minimo 8 caracteres", test: (p) => p.length >= 8 },
  {
    id: "mayuscula",
    label: "Al menos una mayuscula",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "minuscula",
    label: "Al menos una minuscula",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "numero", label: "Al menos un numero", test: (p) => /\d/.test(p) },
  {
    id: "especial",
    label: "Al menos un caracter especial (@#$%^&*!?.,-_)",
    test: (p) => /[@#$%^&*!?.,\-_]/.test(p),
  },
  { id: "sinEspacios", label: "Sin espacios", test: (p) => !/\s/.test(p) },
];

// Retorna un objeto con el estado de cada requisito y el puntaje total
export const evaluarPassword = (password) => {
  const resultados = REQUISITOS_PASSWORD.map((r) => ({
    ...r,
    ok: r.test(password),
  }));

  const cumplidos = resultados.filter((r) => r.ok).length;
  const total = REQUISITOS_PASSWORD.length;

  // Nivel: 0 a 4
  let nivel = 0;
  if (cumplidos === 0) nivel = 0;
  else if (cumplidos <= 2) nivel = 1;
  else if (cumplidos <= 4) nivel = 2;
  else if (cumplidos < total) nivel = 3;
  else nivel = 4;

  const etiquetas = ["Muy debil", "Debil", "Media", "Fuerte", "Muy fuerte"];
  const colores = ["#52525b", "#dc2626", "#f59e0b", "#eab308", "#16a34a"];

  return {
    requisitos: resultados,
    cumplidos,
    total,
    nivel,
    etiqueta: etiquetas[nivel],
    color: colores[nivel],
    esValida: cumplidos === total,
  };
};

// Validacion de email
export const esEmailValido = (email) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

// Validacion de telefono (solo digitos, +, espacios, guiones; minimo 7)
export const esTelefonoValido = (telefono) => {
  return /^[+\d][\d\s\-()]{6,}$/.test(telefono.trim());
};
