
const API_URL = "http://mi-api-powergym-2025.somee.com/api/padecimiento";

//const API_URL = "http://localhost:7086/api/padecimiento";

let filaEnEdicion = null;
let datosOriginales = {}; // Para cancelar

document.addEventListener("DOMContentLoaded", () => {
  const accion = document.body.dataset.accion;
  const params = new URLSearchParams(window.location.search);
  const modo = params.get("modo");
  const id = params.get("id");

  if (modo === "editar" && id) {
    configurarFormularioEditar(id);
    return;
  }

      

  switch (accion) {
    case "listar":
      listarPadecimientos();
      buscarPadecimientosAvanzado();
      break;

    case "agregar":
      configurarFormularioAgregar();
      break;
    case "editar":
      const form = document.querySelector(".formulario");
      const formId = form ? form.dataset.id : null;
      if (formId) {
        configurarFormularioEditar(formId);
      } else {
        console.warn("⚠️ No se proporcionó ID para editar.");
      }
      break;
    default:
      console.warn("⚠️ Acción no reconocida:", accion);
  }
});

function listarPadecimientos() {
  fetch(`${API_URL}/listaPadecimientos`)
    .then((res) => res.json())
    .then((lista) => {
      const tbody = document.querySelector("tbody.table-group-divider");
      tbody.innerHTML = "";

      lista.forEach((p) => {
        const fila = document.createElement("tr");
        fila.setAttribute("data-id", p.IdPadecimiento);
        fila.innerHTML = `
          <td>${p.IdPadecimiento}</td>
          <td>${p.Nombre}</td>
          <td style="max-width:500px;">${p.Descripcion}</td>
          <td>${p.AreaMuscularAfectada}</td>
          <td class="acciones-clientes">
            <button class="btn-tabla-editar" data-id="${p.IdPadecimiento}" title="Editar" type="button">
              <i class="fas fa-pen-to-square icono-btn"></i>
            </button>
            <button class="btn-tabla-eliminar" onclick="eliminarPadecimiento(${p.IdPadecimiento})" title="Eliminar" type="button">
              <i class="fas fa-trash icono-btn"></i>
            </button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    })
    .catch((err) => console.error("❌ Error al listar:", err.message));
}

document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-tabla-editar")) {
    const btn = e.target.closest(".btn-tabla-editar");
    const id = btn.dataset.id;
    if (filaEnEdicion !== null) {
      mostrarToast("⚠️ Solo puedes editar una fila a la vez.", "warning");
      return;
    }
    activarEdicionEnFila(id);
  }
});

function activarEdicionEnFila(id) {
  fetch(`${API_URL}/obtenerPadecimientoPorId/${id}`)
    .then((res) => res.json())
    .then((p) => {
      const fila = document
        .querySelector(`button[data-id="${id}"]`)
        .closest("tr");
      filaEnEdicion = fila;

      // 🔥 Guardamos los valores originales para cancelar
      datosOriginales = {
        id: p.IdPadecimiento,
        nombre: p.Nombre,
        descripcion: p.Descripcion,
        area: p.AreaMuscularAfectada,
      };

      fila.innerHTML = `
        <td>${p.IdPadecimiento}</td>
        <td><input class="form-control form-control-sm" type="text" value="${p.Nombre}" id="edit-nombre-${id}"></td>
        <td><input class="form-control form-control-sm" type="text" value="${p.Descripcion}" id="edit-descripcion-${id}"></td>
        <td><input class="form-control form-control-sm" type="text" value="${p.AreaMuscularAfectada}" id="edit-area-${id}"></td>
        <td>
          <button class="btn btn-success btn-sm" onclick="guardarEdicionPadecimiento(${id})">
            <i class="bi bi-check-circle-fill"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="cancelarEdicionPadecimiento(${id})">
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </td>
      `;
    });
}

function guardarEdicionPadecimiento(id) {
  const nuevoNombre = document.getElementById(`edit-nombre-${id}`).value.trim();
  const nuevaDescripcion = document
    .getElementById(`edit-descripcion-${id}`)
    .value.trim();
  const nuevaArea = document.getElementById(`edit-area-${id}`).value.trim();

  const dto = {
    idPadecimiento: parseInt(id),
    nombre: nuevoNombre,
    descripcion: nuevaDescripcion,
    areaMuscularAfectada: nuevaArea,
  };

  fetch(`${API_URL}/editarPadecimiento/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  })
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo guardar la edición.");
      mostrarToast("✅ Padecimiento actualizado correctamente.", "success");
      filaEnEdicion = null;
      listarPadecimientos(); // 🔥 Recargamos la tabla para reflejar cambios
    })
    .catch((err) => {
      console.error("Error:", err);
      mostrarToast("❌ Error al actualizar: " + err.message, "danger");
    });
}

function cancelarEdicionPadecimiento(id) {
  const fila = document.querySelector(`tr[data-id='${id}']`);
  if (fila) {
    fila.innerHTML = `
      <td>${datosOriginales.id}</td>
      <td>${datosOriginales.nombre}</td>
      <td>${datosOriginales.descripcion}</td>
      <td>${datosOriginales.area}</td>
      <td>
        <button class="btn btn-warning btn-editar" data-id="${datosOriginales.id}">
          <i class="fas fa-pen-to-square"></i>
        </button>
        <button class="btn btn-danger" onclick="eliminarPadecimiento(${datosOriginales.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    filaEnEdicion = null; // 🔥 Liberamos la edición
    datosOriginales = {}; // Limpiamos datos
    mostrarToast("❌ Edición cancelada.", "warning");
  }
}

function eliminarPadecimiento(id) {
  if (!confirm("¿Seguro que deseas eliminar este padecimiento?")) return;

  fetch(`${API_URL}/eliminarPadecimiento/${id}`, { method: "DELETE" })
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo eliminar.");
      mostrarToast("✅ Padecimiento eliminado correctamente.", "success");
      listarPadecimientos();
    })
    .catch((err) => {
      mostrarToast("❌ Error al eliminar: " + err.message, "danger");
    });
}

function buscarPadecimientosAvanzado() {
  const input = document.getElementById("inputBuscar");
  if (!input) return;

  input.addEventListener("input", function () {
    const texto = input.value.trim().toLowerCase();

    if (texto === "") {
      listarPadecimientos();
      return;
    }

    fetch(`${API_URL}/listaPadecimientos`)
      .then((res) => res.json())
      .then((lista) => {
        const resultados = lista.filter((p) => {
          return (
            p.IdPadecimiento.toString().includes(texto) ||
            p.Nombre.toLowerCase().includes(texto) ||
            p.Descripcion.toLowerCase().includes(texto) ||
            p.AreaMuscularAfectada.toLowerCase().includes(texto)
          );
        });

        const tbody = document.querySelector("tbody.table-group-divider");
        tbody.innerHTML = "";

        if (resultados.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="text-danger">No se encontraron resultados.</td>
            </tr>
          `;
          return;
        }

        resultados.forEach((p) => {
          const fila = document.createElement("tr");
          fila.setAttribute("data-id", p.IdPadecimiento);
          fila.innerHTML = `
            <td>${p.IdPadecimiento}</td>
            <td>${p.Nombre}</td>
            <td>${p.Descripcion}</td>
            <td>${p.AreaMuscularAfectada}</td>
            <td class="acciones-clientes">
              <button class="btn-tabla-editar" data-id="${p.IdPadecimiento}" title="Editar" type="button">
                <i class="fas fa-pen-to-square icono-btn"></i>
              </button>
              <button class="btn-tabla-eliminar" onclick="eliminarPadecimiento(${p.IdPadecimiento})" title="Eliminar" type="button">
                <i class="fas fa-trash icono-btn"></i>
              </button>
            </td>
          `;
          tbody.appendChild(fila);
        });
      })
      .catch((err) => {
        console.error("Error en búsqueda:", err);
      });
  });
}

function mostrarToast(mensaje, tipo = "info") {
  const toastElemento = document.getElementById("liveToast");
  const toastMensaje = document.getElementById("toastMensaje");

  if (!toastElemento || !toastMensaje) return;

  toastElemento.className = `toast align-items-center text-bg-${tipo} border-0`;
  toastMensaje.textContent = mensaje;

  const toast = new bootstrap.Toast(toastElemento);
  toast.show();
}

function configurarFormularioAgregar() {
  const form = document.querySelector(".formulario");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Recoger los datos del formulario
    const nombre = form.nombre.value.trim();
    const descripcion = form.Descripcion.value.trim();

    // Recoger los checkboxes seleccionados
    const areasSeleccionadas = Array.from(
      form.querySelectorAll("input[name='AreaMuscularAfectada']:checked")
    )
      .map((cb) => cb.value)
      .join(", ");

    // Validación básica
    if (!nombre || !descripcion || !areasSeleccionadas) {
      alert(
        "Por favor, completa todos los campos y selecciona al menos un área afectada."
      );
      return;
    }

    // Prepara el objeto para el backend
    const dto = {
      nombre: nombre,
      descripcion: descripcion,
      areaMuscularAfectada: areasSeleccionadas,
    };
   


    fetch(
      "http://mi-api-powergym-2025.somee.com/api/padecimiento",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo agregar el padecimiento.");
        alert("✅ Padecimiento agregado correctamente.");
        form.reset();
      })
      .catch((err) => {
        alert("❌ Error al agregar: " + err.message);
      });
  });
}
