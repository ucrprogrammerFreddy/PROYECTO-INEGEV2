const URL_API = "http://mi-api-powergym-2025.somee.com/api/Ejercicio";

document.addEventListener("DOMContentLoaded", function () {
  cargarEjerciciosAdmin();

  async function cargarEjerciciosAdmin() {
    const table = document.getElementById("tablaEjercicios");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    tbody.innerHTML = "<tr><td colspan='7'>Cargando...</td></tr>";

    try {
      const resp = await fetch(`${URL_API}/listaEjercicios`);
      if (!resp.ok) throw new Error("No se pudo obtener la lista");
      const ejercicios = await resp.json();

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
            <td>${ej.AreaMuscularAfectada}</td>
            <td>${ej.Dificultad}</td>
          </tr>
          `
        );
      });
    } catch (err) {
      mostrarMensaje("Error al cargar ejercicios: " + err.message, "danger");
      tbody.innerHTML = "<tr><td colspan='7'>Error al cargar datos.</td></tr>";
    }
  }

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
});
