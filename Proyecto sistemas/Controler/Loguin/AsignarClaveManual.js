// Controler/Login/AsignarClaveManual.js
const URL_ACTUALIZAR_CLAVE = "https://proyecto-inegev2-1.onrender.com/api/Login/AsignarClaveManual";

document.querySelector("#form-asignar-clave").addEventListener("submit", async (e) => {
  e.preventDefault();
  const correo = document.querySelector("#correoUsuario").value.trim();
  const nuevaClave = document.querySelector("#nuevaClave").value.trim();
  const mensaje = document.querySelector("#mensajeClave");

  if (!correo || !nuevaClave) {
    mensaje.textContent = "❌ Todos los campos son obligatorios.";
    mensaje.className = "text-danger";
    return;
  }

  try {
    const res = await fetch(URL_ACTUALIZAR_CLAVE, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, nuevaClave }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    mensaje.textContent = "✅ Contraseña actualizada correctamente.";
    mensaje.className = "text-success";
  } catch (error) {
    mensaje.textContent = "❌ " + error.message;
    mensaje.className = "text-danger";
  }
});
