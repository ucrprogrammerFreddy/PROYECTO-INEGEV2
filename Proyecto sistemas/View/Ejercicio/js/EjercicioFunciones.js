// Importa el modelo EjercicioModel desde la carpeta Modelo
import { EjercicioModel } from "../Modelo/EjercicioModel.js"; // Asegúrate que el archivo y nombre coincidan exactamente

// URL base de la API de ejercicios
const URL_API = "https://localhost:7086/api/Ejercicio";

// Espera a que todo el DOM esté cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", function () {
  // --- TABLA DE EJERCICIOS ---
  // Solo ejecuta la lógica si existe la tabla de ejercicios en el DOM
  if (document.getElementById("tablaEjercicios")) {
    cargarEjercicios(); // Carga ejercicios en la tabla al iniciar

    // Delegación de eventos para los botones Editar y Borrar
    document
      .getElementById("tablaEjercicios")
      .addEventListener("click", async function (e) {
        // Si se hace clic en el botón editar
        if (e.target.classList.contains("btn-editar")) {
          const id = e.target.dataset.id;
          await mostrarModalEditar(id); // Abre el modal y precarga datos
        }
        // Si se hace clic en el botón borrar
        if (e.target.classList.contains("btn-borrar")) {
          const id = e.target.dataset.id;
          // Confirmación antes de eliminar
          if (confirm("¿Seguro que deseas borrar este ejercicio?")) {
            await borrarEjercicio(id); // Elimina el ejercicio
            await cargarEjercicios(); // Recarga la tabla
          }
        }
      });
  }

  // -----------------------------------
  // --- SUBMIT MODAL Para EDITAR los ejercicios---
  // -----------------------------------
  const formModal = document.getElementById("formEditarEjercicio");
  if (formModal) {
    formModal.addEventListener("submit", async function (e) {
      e.preventDefault(); // Previene el envío por defecto del formulario

      // Obtiene y limpia los valores del formulario
      const idEditar = document.getElementById("edit-idEjercicio").value;
      const nombre = document.getElementById("edit-nombre").value.trim();
      const descripcion = document
        .getElementById("edit-descripcion")
        .value.trim();
      const areaMuscular = document.getElementById("edit-areaMuscular").value;
      const repeticiones = parseInt(
        document.getElementById("edit-repeticiones").value,
        10
      );
      const guiaEjercicio = document
        .getElementById("edit-guiaEjercicio")
        .value.trim();
      const dificultad = document.getElementById("edit-dificultad").value;
      const areaMuscularAfectada = document.getElementById("edit-areaMuscularAfectada").value.trim();


      // --- VALIDACIONES ---
      // Asegúrate que ningún campo esté vacío o inválido
      if (
        !nombre ||
        !descripcion ||
        !areaMuscular ||
        !guiaEjercicio ||
        !dificultad
      ) {
        mostrarMensaje(
          "Por favor complete todos los campos obligatorios.",
          "danger"
        );
        return;
      }
      // Validar repeticiones: debe ser un número entero positivo
      if (isNaN(repeticiones) || repeticiones <= 0) {
        mostrarMensaje(
          "Las repeticiones deben ser un número positivo.",
          "danger"
        );
        return;
      }
      // Validar URL del video
      if (!/^https?:\/\/.+\..+/.test(guiaEjercicio)) {
        mostrarMensaje(
          "Ingrese una URL válida para la guía del ejercicio.",
          "danger"
        );
        return;
      }
      // Puedes agregar más validaciones según tus reglas de negocio

      // Crea el objeto DTO para enviar a la API
      const ejercicioDTO = {
  nombre,
  descripcion,
  areaMuscular,
  areaMuscularAfectada, 
  repeticiones,
  guiaEjercicio,
  dificultad
};


      try {
        // Envía la petición PUT a la API para editar el ejercicio
        const response = await fetch(`${URL_API}/editarEjercicio/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ejercicioDTO),
        });
        if (response.ok) {
          mostrarMensaje("¡Ejercicio editado exitosamente!", "success");
          // Cierra el modal
          const modal = bootstrap.Modal.getOrCreateInstance(
            document.getElementById("modalEditarEjercicio")
          );
          modal.hide();
          await cargarEjercicios(); // Recarga la tabla
        } else {
          let errorMsg = "Error al editar el ejercicio.";
          try {
            const error = await response.json();
            if (error && error.mensaje) errorMsg += "<br>" + error.mensaje;
          } catch (jsonErr) {}
          mostrarMensaje(errorMsg, "danger");
        }
      } catch (err) {
        mostrarMensaje(
          "Error al conectar con la API: " + err.message,
          "danger"
        );
      }
    });
  }

  // --- AGREGAR/EDITAR DESDE FORMULARIO SEPARADO ---
  // Agrega este código dentro del bloque DOMContentLoaded, justo antes de form.addEventListener
const form = document.querySelector("form:not(#formEditarEjercicio)");
if (form) {
  const params = new URLSearchParams(window.location.search);
  const idEditar = params.get("id");

  // --- NUEVO CÓDIGO PARA OBTENER LOS IMPEDIMENTOS MARCADOS ---
  function obtenerImpedimentosSeleccionados() {
    const checkboxes = document.querySelectorAll("input[name='impedimentos[]']:checked");
    return Array.from(checkboxes).map(cb => cb.value).join(", ");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const areaMuscular = document.getElementById("areaMuscular").value;
    const repeticiones = parseInt(document.getElementById("repeticiones").value, 10);
    const guiaEjercicio = document.getElementById("guiaEjercicio").value.trim();
    const dificultad = document.getElementById("dificultad").value;
    const areaMuscularAfectada = obtenerImpedimentosSeleccionados();

    if (!nombre || !descripcion || !areaMuscular || !guiaEjercicio || !dificultad) {
      mostrarMensaje("Por favor complete todos los campos obligatorios.", "danger");
      return;
    }
    if (isNaN(repeticiones) || repeticiones <= 0) {
      mostrarMensaje("Las repeticiones deben ser un número positivo.", "danger");
      return;
    }
    if (!/^https?:\/\/.+\..+/.test(guiaEjercicio)) {
      mostrarMensaje("Ingrese una URL válida para la guía del ejercicio.", "danger");
      return;
    }

    const ejercicioDTO = {
      nombre,
      descripcion,
      areaMuscular,
      areaMuscularAfectada,
      repeticiones,
      guiaEjercicio,
      dificultad
    };

    try {
      let response;
      if (idEditar) {
        response = await fetch(`${URL_API}/editarEjercicio/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ejercicioDTO),
        });
      } else {
        response = await fetch(`${URL_API}/crearEjercicio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ejercicioDTO),
        });
      }

      if (response.ok) {
        mostrarMensaje(idEditar ? "¡Ejercicio editado exitosamente!" : "¡Ejercicio guardado exitosamente!", "success");
        form.reset();
        if (idEditar) setTimeout(() => (window.location.href = "indexEjercicio.html"), 1000);
      } else {
        let errorMsg = "Error al guardar el ejercicio.";
        try {
          const error = await response.json();
          if (error && error.mensaje) errorMsg += "<br>" + error.mensaje;
        } catch (jsonErr) {}
        mostrarMensaje(errorMsg, "danger");
      }
    } catch (err) {
      mostrarMensaje("Error al conectar con la API: " + err.message, "danger");
    }
  });
}


  // --- FUNCIONES AUXILIARES ---

  // Carga la lista de ejercicios en la tabla
  async function cargarEjercicios() {
    const table = document.getElementById("tablaEjercicios");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='7'>Cargando...</td></tr>";
    try {
      const resp = await fetch(`${URL_API}/listaEjercicios`);
      if (!resp.ok) throw new Error("No se pudo obtener la lista");
      const ejercicios = await resp.json();
      // Soporta diferentes formatos de respuesta (por compatibilidad con .NET)
      let lista = [];
      if (Array.isArray(ejercicios)) {
        lista = ejercicios;
      } else if (Array.isArray(ejercicios.$values)) {
        lista = ejercicios.$values;
      } else if (Array.isArray(ejercicios.data)) {
        lista = ejercicios.data;
      } else if (Array.isArray(ejercicios.lista)) {
        lista = ejercicios.lista;
      } else {
        console.warn("Formato inesperado de la respuesta:", ejercicios);
      }

      if (!Array.isArray(lista) || lista.length === 0) {
        tbody.innerHTML =
          "<tr><td colspan='7'>No hay ejercicios registrados.</td></tr>";
        return;
      }
      tbody.innerHTML = "";
      lista.forEach((ej) => {
        tbody.insertAdjacentHTML(
          "beforeend",
          `
          <tr>
            <td>${ej.Nombre}</td>
            <td>${ej.Descripcion}</td>
            <td>${ej.Repeticiones}</td>
            <td><a href="${ej.GuiaEjercicio}" target="_blank">Ver video</a></td>
            <td>${ej.AreaMuscular}</td>
            <td>${ej.Dificultad}</td>
            <td>
              <button class="btn btn-sm btn-primary btn-editar" data-id="${ej.IdEjercicio}"><i class="fas fa-edit"></i> Editar</button>
              <button class="btn btn-sm btn-danger btn-borrar" data-id="${ej.IdEjercicio}"><i class="fas fa-trash-alt"></i> Borrar</button>
            </td>
          </tr>
        `
        );
      });
    } catch (err) {
      mostrarMensaje("Error al cargar ejercicios: " + err.message, "danger");
      if (tbody)
        tbody.innerHTML =
          "<tr><td colspan='7'>Error al cargar datos.</td></tr>";
    }
  }

  // Muestra el modal de edición y precarga los datos del ejercicio
  async function mostrarModalEditar(id) {
    try {
      const resp = await fetch(`${URL_API}/obtenerEjercicioPorId/${id}`);
      if (!resp.ok) throw new Error("No se pudo obtener el ejercicio");
      const ejercicio = await resp.json();
      // Precarga los valores en el formulario del modal
      document.getElementById("edit-idEjercicio").value =
        ejercicio.IdEjercicio ?? "";
      document.getElementById("edit-nombre").value = ejercicio.Nombre ?? "";
      document.getElementById("edit-descripcion").value =
        ejercicio.Descripcion ?? "";
      document.getElementById("edit-areaMuscular").value =
        ejercicio.AreaMuscular ?? "";
      document.getElementById("edit-repeticiones").value =
        ejercicio.Repeticiones ?? "";
      document.getElementById("edit-guiaEjercicio").value =
        ejercicio.GuiaEjercicio ?? "";
      document.getElementById("edit-dificultad").value =
        ejercicio.Dificultad ?? "";
      // Abre el modal
      const modal = new bootstrap.Modal(
        document.getElementById("modalEditarEjercicio")
      );
      modal.show();
    } catch (err) {
      mostrarMensaje(
        "Error al cargar ejercicio para editar: " + err.message,
        "danger"
      );
    }
  }

  // Elimina un ejercicio según su id
  async function borrarEjercicio(id) {
    try {
      // Validación: id debe estar definido y ser numérico
      if (!id || isNaN(id)) {
        mostrarMensaje("ID de ejercicio inválido.", "danger");
        return;
      }
      // Llama al endpoint DELETE de la API ( eliminarEjericicio!)
      const resp = await fetch(`${URL_API}/eliminarEjericicio/${id}`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        // Intenta obtener el mensaje de error si lo hay
        let mensaje = "No se pudo borrar el ejercicio";
        try {
          const data = await resp.json();
          if (data && data.mensaje) mensaje = data.mensaje;
        } catch (_) {}
        throw new Error(mensaje);
      }
      mostrarMensaje("Ejercicio eliminado correctamente.", "success");
    } catch (err) {
      mostrarMensaje("Error al borrar ejercicio: " + err.message, "danger");
    }
  }

  // Muestra mensajes de alerta en el DOM
  function mostrarMensaje(msg, tipo = "info") {
    let alertPlaceholder = document.getElementById("alertPlaceholder");
    if (!alertPlaceholder) {
      alertPlaceholder = document.createElement("div");
      alertPlaceholder.id = "alertPlaceholder";
      const main = document.querySelector("main");
      if (main) main.insertBefore(alertPlaceholder, main.firstChild);
      else document.body.prepend(alertPlaceholder);
    }
    alertPlaceholder.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show mt-3 mb-0" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `;
  }

  // Precarga los valores de un ejercicio en el formulario para editar/crear
  function precargarFormulario(ejercicio) {
    document.getElementById("nombre").value = ejercicio.Nombre ?? "";
    document.getElementById("descripcion").value = ejercicio.Descripcion ?? "";
    document.getElementById("areaMuscular").value =
      ejercicio.AreaMuscular ?? "";
    document.getElementById("repeticiones").value =
      ejercicio.Repeticiones ?? "";
    document.getElementById("guiaEjercicio").value =
      ejercicio.GuiaEjercicio ?? "";
    document.getElementById("dificultad").value = ejercicio.Dificultad ?? "";
  }
});
// Fin del script
// Fin del DOMContentLoaded
