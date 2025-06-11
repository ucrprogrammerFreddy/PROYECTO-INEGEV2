const URL_API = "http://mi-api-powergym-2025.somee.com/api/Ejercicio";

let listaEjerciciosGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  cargarEjerciciosAdmin();
  inicializarFiltroEjercicios();

  // Inicializador del filtro de búsqueda
  function inicializarFiltroEjercicios() {
    const filtroInput = document.getElementById("filtroEjercicio");
    if (filtroInput) {
      filtroInput.addEventListener("input", function () {
        renderizarTablaEjercicios(this.value);
      });
    }
  }

  // Renderiza la tabla con o sin filtro
  function renderizarTablaEjercicios(filtro = "") {
    const table = document.getElementById("tablaEjercicios");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    let ejerciciosFiltrados = listaEjerciciosGlobal;

    if (filtro) {
      ejerciciosFiltrados = listaEjerciciosGlobal.filter(
        (ej) =>
          ej.Nombre && ej.Nombre.toLowerCase().includes(filtro.toLowerCase())
      );
    }

    if (
      !Array.isArray(ejerciciosFiltrados) ||
      ejerciciosFiltrados.length === 0
    ) {
      tbody.innerHTML =
        "<tr><td colspan='7'>No hay ejercicios registrados.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    ejerciciosFiltrados.forEach((ej) => {
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
  }

  // Carga y guarda la lista global de ejercicios
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

      listaEjerciciosGlobal = lista;
      renderizarTablaEjercicios();
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
