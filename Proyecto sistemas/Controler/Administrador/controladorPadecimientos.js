// ✅ Controlador actualizado SIN severidad en el modelo de Padecimiento
const API_URL = "https://localhost:7086/api/padecimiento";

let filaEnEdicion = null;

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
      buscarPorId();
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
    .then(res => res.json())
    .then(lista => {
      const tbody = document.querySelector("tbody.table-group-divider");
      tbody.innerHTML = "";

      lista.forEach(p => {
        const fila = document.createElement("tr");
        fila.classList.add();
        fila.innerHTML = `
          <td>${p.IdPadecimiento}</td>
          <td>${p.Nombre}</td>
          <td style="max-width:500px;">${p.Descripcion}</td>
          <td>${p.AreaMuscularAfectada}</td>
          <td>
            <button class="btn btn-warning  btn-editar" data-id="${p.IdPadecimiento}">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="btn btn-danger " onclick="eliminarPadecimiento(${p.IdPadecimiento})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    })
    .catch(err => console.error("❌ Error al listar:", err.message));
}


document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-editar")) {
    const btn = e.target.closest(".btn-editar");
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
    .then(res => res.json())
    .then(p => {
      const fila = document.querySelector(`button[data-id="${id}"]`).closest("tr");
      filaEnEdicion = fila;
      fila.innerHTML = `
        <td>${p.idPadecimiento}</td>
        <td><input class="form-control form-control-sm" type="text" value="${p.Nombre}" id="edit-nombre-${id}"></td>
        <td><input class="form-control form-control-sm" type="text" value="${p.Descripcion}" id="edit-descripcion-${id}"></td>
        <td><input class="form-control form-control-sm" type="text" value="${p.AreaMuscularAfectada}" id="edit-area-${id}"></td>
        <td>
          <button class="btn btn-success btn-sm" onclick="guardarEdicion(${id})">
            <i class="bi bi-check-circle-fill"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="cancelarEdicion(${id})">
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </td>
      `;
    });
}

function cancelarEdicion(id) {
  filaEnEdicion = null;
  actualizarFilaVisual(id);
}

function guardarEdicion(id) {
  const nombre = document.getElementById(`edit-nombre-${id}`).value.trim();
  const descripcion = document.getElementById(`edit-descripcion-${id}`).value.trim();
  const areaMuscularAfectada = document.getElementById(`edit-area-${id}`).value.trim();

  if (!nombre || !descripcion || !areaMuscularAfectada) {
    mostrarToast("⚠️ Todos los campos son obligatorios", "warning");
    return;
  }

  const dto = {
    idPadecimiento: parseInt(id),
    nombre,
    descripcion,
    areaMuscularAfectada
  };

  fetch(`${API_URL}/editarPadecimiento/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto)
  })
    .then(res => {
      if (!res.ok) throw new Error("No se pudo guardar la edición.");
      mostrarToast("✅ Padecimiento actualizado correctamente.", "success");
      filaEnEdicion = null;
      actualizarFilaVisual(id);
    })
    .catch(err => {
      console.error("Error:", err);
      mostrarToast("❌ Error al actualizar: " + err.message, "danger");
    });
}

function actualizarFilaVisual(id) {
  fetch(`${API_URL}/obtenerPadecimientoPorId/${id}`)
    .then(res => res.json())
    .then(p => {
      const fila = document.querySelector(`button[data-id="${id}"]`)?.closest("tr");
      if (!fila) return;
      fila.innerHTML = `
        <td>${p.IdPadecimiento}</td>
        <td>${p.Nombre}</td>
        <td>${p.Descripcion}</td>
        <td>${p.AreaMuscularAfectada}</td>
        <td>
          <button class="btn btn-warning btn-sm btn-editar" data-id="${p.IdPadecimiento}">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPadecimiento(${p.IdPadecimiento})">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      `;
    });
}

function eliminarPadecimiento(id) {
  if (!confirm("¿Seguro que deseas eliminar este padecimiento?")) return;

  console.log("ID a eliminar:", id); // Agrega esto para ver el valor del ID

  fetch(`${API_URL}/eliminarPadecimiento/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error("No se pudo eliminar.");
      mostrarToast("✅ Padecimiento eliminado correctamente.", "success");
      listarPadecimientos();
    })
    .catch(err => {
      mostrarToast("❌ Error al eliminar: " + err.message, "danger");
    });
}


function configurarFormularioAgregar() {
  const form = document.querySelector(".formulario");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const dto = obtenerDatosFormulario();

    if (!dto.nombre || !dto.descripcion || !dto.areaMuscularAfectada) {
      alert("⚠️ Por favor completa todos los campos antes de registrar.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/crearPadecimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });

      if (!res.ok) throw new Error("No se pudo registrar.");
      alert("✅ Padecimiento agregado.");
      form.reset();
      window.location.href = "../../View/Administrador/ListaPadecimientos.html";
    } catch (err) {
      alert("❌ Error al registrar: " + err.message);
    }
  });
}

function configurarFormularioEditar(id) {
  const form = document.querySelector(".formulario");

  fetch(`${API_URL}/obtenerPadecimientoPorId/${id}`)
    .then(res => res.json())
    .then(p => {
      document.getElementById("nombre").value = p.nombre;
      document.getElementById("Descripcion").value = p.descripcion;

      const areas = p.areaMuscularAfectada.split(",");
      areas.forEach(area => {
        const checkbox = document.querySelector(`input[name="AreaMuscularAfectada"][value="${area}"]`);
        if (checkbox) checkbox.checked = true;
      });
    });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const dto = obtenerDatosFormulario();
    dto.idPadecimiento = parseInt(id);

    try {
      const res = await fetch(`${API_URL}/editarPadecimiento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
      });

      if (!res.ok) throw new Error("No se pudo editar.");
      alert("✅ Padecimiento actualizado.");
    } catch (err) {
      alert("❌ Error al editar: " + err.message);
    }
  });
}

function obtenerDatosFormulario() {
  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("Descripcion").value.trim();
  const areas = Array.from(document.querySelectorAll('input[name="AreaMuscularAfectada"]:checked'))
    .map(cb => cb.value).join(",");

  return { nombre, descripcion, areaMuscularAfectada: areas };
}

function buscarPorId() {
  const input = document.getElementById("inputBuscarId");
  if (!input) return;

  input.addEventListener("input", function () {
    const id = input.value.trim();

    if (id === "") {
      listarPadecimientos();
      return;
    }

    if (isNaN(id)) return;

    fetch(`${API_URL}/obtenerPadecimientoPorId/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("No encontrado");
        return res.json();
      })
      .then(p => {
        const tbody = document.querySelector("tbody.table-group-divider");
        tbody.innerHTML = "";

        const fila = document.createElement("tr");
        fila.classList.add("table-primary");
        fila.innerHTML = `
          <td>${p.IdPadecimiento}</td>
          <td>${p.Nombre}</td>
          <td>${p.Descripcion}</td>
          <td>${p.AreaMuscularAfectada}</td>
          <td>
            <button class="btn btn-warning btn-sm btn-editar" data-id="${p.IdPadecimiento}">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="eliminarPadecimiento(${p.IdPadecimiento})">
              <i class="bi bi-trash-fill"></i>
            </button>
          </td>
        `;
        tbody.appendChild(fila);
      })
      .catch(() => {
        const tbody = document.querySelector("tbody.table-group-divider");
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-danger">No se encontró ningún padecimiento con ese ID.</td>
          </tr>
        `;
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
