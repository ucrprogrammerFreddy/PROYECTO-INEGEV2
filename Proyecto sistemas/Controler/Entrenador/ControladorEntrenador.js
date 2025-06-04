const API_BASE = "https://localhost:7086/api";

document.addEventListener("DOMContentLoaded", () => {
  const idEntrenador = sessionStorage.getItem("idEntrenador");

  if (idEntrenador) {
    cargarClientes(idEntrenador);
  } else {
    alert("⚠️ No se encontró el ID del entrenador en la sesión.");
    window.location.href = "../../View/Login/Login.html";
  }
});

function cargarClientes(idEntrenador) {
  fetch(`${API_BASE}/entrenador/${idEntrenador}/clientes`)
    .then(res => res.json())
    .then(clientes => {
      const tbody = document.getElementById("tablaClientes");
      tbody.innerHTML = "";

clientes.forEach(cliente => {
  const fila = document.createElement("tr");
    fila.innerHTML = `

      <td class="text-center">${cliente.Nombre}</td>
      <td class="text-center" style="width: 250px;">
        <button class="btn btn-secondary btn-sm me-1" onclick="verRutina(${cliente.IdUsuario})" title="Ver rutina">
          <i class="fas fa-dumbbell"></i>
        </button>
      </td>
      <td class="text-center" style="width: 350px;">
        <button class="btn btn-success btn-sm px-3" title="Nueva rutina">
          <i class="fas fa-plus me-1"></i>
        </button>
      </td>
      <td class="text-center">
        <button class="btn btn-salud btn-sm" title="Ver perfil de salud">
          <i class="fas fa-heart-pulse"></i>
        </button>
      </td>
    `;
  tbody.appendChild(fila);
});

    })
    .catch(err => {
      console.error("❌ Error al cargar clientes:", err);
    });
}

window.verRutina = function(idCliente) {
  fetch(`${API_BASE}/cliente/${idCliente}/rutina-actual`)
    .then(res => res.json())
    .then(rutina => {
      if (!rutina) return alert("⚠️ No hay rutina actual.");

      let html = `
        <p><strong>Inicio:</strong> ${rutina.fechaInicio}</p>
        <p><strong>Fin:</strong> ${rutina.fechaFin}</p>
        <ul>
      `;

      rutina.ejercicios.forEach(ej => {
        html += `<li><strong>${ej.nombre}</strong>: ${ej.descripcion} (${ej.comentario})</li>`;
      });

      html += `</ul>`;

      document.getElementById("contenidoRutina").innerHTML = html;
      new bootstrap.Modal(document.getElementById("modalRutina")).show();
    })
    .catch(err => {
      console.error("❌ Error al cargar rutina:", err);
    });
}
