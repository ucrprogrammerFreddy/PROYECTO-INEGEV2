// // Controler/Loguin/RecuperarClave.js
// const URL_RECUPERAR_CLAVE = "https://proyecto-inegev2-1.onrender.com/api/Login/RecuperarClave";
// //const API_RECUPERAR_CLAVE = "http://mi-api-powergym-2025.somee.com/api/Login/RecuperarClave";
// //const API_RECUPERAR_CLAVE = "http://localhost:7086/api/Login/RecuperarClave";


// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.querySelector("#form-recuperacion");
//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const correo = document.querySelector("#correoRecuperacion").value.trim();
//     const mensajeDiv = document.querySelector("#mensajeRespuesta");

//     if (!correo) {
//       mensajeDiv.textContent = " Debes ingresar un correo.";
//       mensajeDiv.classList.add("text-danger");
//       return;
//     }

//     try {
//       const response = await fetch(API_RECUPERAR_CLAVE, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(correo),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(errorText || "Error al recuperar contraseña.");
//       }

//       mensajeDiv.textContent = " Se ha enviado una nueva contraseña a tu correo.";
//       mensajeDiv.className = "text-success";
//     } catch (error) {
//       console.error(" Error:", error);
//       mensajeDiv.textContent = " " + error.message;
//       mensajeDiv.className = "text-danger";
//     }
//   });
// });

const API_ENVIAR_CODIGO = "https://proyecto-inegev2-1.onrender.com/api/Login/EnviarCodigoVerificacion";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#form-recuperacion");
  const mensajeDiv = document.querySelector("#mensajeRespuesta");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = document.querySelector("#correoRecuperacion").value.trim();

    if (!correo) {
      mensajeDiv.textContent = "❌ Debes ingresar un correo.";
      mensajeDiv.classList.add("text-danger");
      return;
    }

    try {
      const res = await fetch(API_ENVIAR_CODIGO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(correo),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      localStorage.setItem("correoRecuperacion", correo); // Guardar correo para usar después
      window.location.href = "../../View/Login/VerificarCodigo.html"; // Redirigir

    } catch (error) {
      mensajeDiv.textContent = "❌ " + error.message;
      mensajeDiv.className = "text-danger";
    }
  });
});

