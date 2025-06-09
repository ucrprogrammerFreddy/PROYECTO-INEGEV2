// ADMINISTRADOR FUNCIONES
import { AdministradorModel } from "../../Model/AdministradorModel.js";

const URL_API = "http://mi-api-powergym-2025.somee.com/api/Administradores";
const ruta = window.location.pathname;

let administradoresGlobal = [];

if (ruta.includes("Empleados.html")) {
  $(document).ready(function () {
    obtenerAdministradores();

    $(".btn-agregar").click(() => {
      localStorage.removeItem("adminEditar");
      window.location.href = "RegistroAdministrador.html";
    });

    // Búsqueda avanzada
    $("#buscar").on("input", function () {
      const termino = $(this).val().toLowerCase();
      const filtrados = administradoresGlobal.filter((a) =>
        Object.values(a).some((v) => String(v).toLowerCase().includes(termino))
      );
      cargarTabla(filtrados);
    });

    // Filtro por rol (si deseas usar un select)
    $("#filtroRol").on("change", function () {
      const rol = $(this).val();
      const filtrados = rol
        ? administradoresGlobal.filter((a) => a.rol === rol)
        : administradoresGlobal;
      cargarTabla(filtrados);
    });
  });
}
//REGISTRAR UN ADMINISTRADOR

if (ruta.includes("RegistroAdministrador.html")) {
  $(document).ready(function () {
    const adminEditar = JSON.parse(localStorage.getItem("adminEditar"));
    if (adminEditar) {
      $("#idadmin").val(adminEditar.idIdUsuario);
      $("#nombre").val(adminEditar.nombre);
      $("#email").val(adminEditar.email);
      $("#clave").val(adminEditar.clave);
      $("#formacionAcademica").val(adminEditar.formacionAcademica);
      $("#telefono").val(adminEditar.telefono);
    } else {
      $("#rol").val("Admin");
    }

    $("#formAdministrador").submit(function (e) {
      e.preventDefault();
      const id = $("#idadmin").val();
      id ? actualizarAdministrador() : crearAdministrador();
    });

    $("#btnVolver").click(() => {
      localStorage.removeItem("adminEditar");
      window.location.href = "Empleados.html";
    });
  });
}

//LISTADO DE ADMINISTRADORES

function obtenerAdministradores() {
  $.ajax({
    type: "GET",
    url: `${URL_API}/listaAdministradores`,
    dataType: "json",
    success: function (data) {
      let lista = [];

      // Maneja posibles estructuras de respuesta
      if (Array.isArray(data)) {
        lista = data;
      } else if (data.data && Array.isArray(data.data)) {
        lista = data.data;
      } else {
        console.error("⚠️ Respuesta inesperada:", data);
        alert("❌ Error: Formato de respuesta inesperado.");
        return;
      }

      administradoresGlobal = lista;
      cargarTabla(lista);
    },
    error: function () {
      alert("❌ Error al obtener administradores");
    },
  });
}

//DATOS RECIBIDOS PARA LA TABLA
function cargarTabla(lista) {
  console.log("📦 Datos recibidos para tabla:", lista);

  const $tabla = $(".table-group-divider");
  $tabla.empty();

  if (!Array.isArray(lista)) {
    console.error("❌ Lista no es un arreglo:", lista);
    return;
  }

  if (lista.length === 0) {
    $tabla.append(
      `<tr><td colspan="6" class="text-center">No hay administradores registrados.</td></tr>`
    );
    return;
  }

  lista.forEach((a) => {
    const fila = `
      <tr class="table-primary">
        <td>${a.Nombre}</td>
        <td>${a.Email}</td>
        <td>${a.Clave}</td>
        <td>${a.Rol}</td>
        <td>${a.Telefono}</td>
        <td>${a.FormacionAcademica}</td>
        <td>
          <button class="btn btn-warning btn-sm" title="Modificar"
            onclick='editarAdministrador(${JSON.stringify(a).replace(
              /"/g,
              "&quot;"
            )})'>
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-danger btn-sm" title="Eliminar"
            onclick="eliminarAdministrador(${a.idIdUsuario})">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      </tr>`;
    $tabla.append(fila);
  });
}

// function cargarTabla(lista) {
//   const $tabla = $(".table-group-divider");
//   $tabla.empty();

//   lista.forEach((a) => {
//     const fila = `
//       <tr class="table-primary">
//         <td>${a.nombre}</td>
//         <td>${a.email}</td>
//         <td>${a.clave}</td>
//         <td>${a.rol}</td>
//         <td>${a.formacionAcademica}</td>
//         <td>${a.telefono}</td>
//         <td>
//           <button class="btn btn-warning btn-sm" title="Modificar"
//             onclick='editarAdministrador(${JSON.stringify(a).replace(/"/g, "&quot;")})'>
//             <i class="bi bi-pencil-fill"></i>
//           </button>
//           <button class="btn btn-danger btn-sm" title="Eliminar"
//             onclick="eliminarAdministrador(${a.idIdUsuario})">
//             <i class="bi bi-trash-fill"></i>
//           </button>
//         </td>
//       </tr>`;
//     $tabla.append(fila);
//   });
// }

function crearAdministrador() {
  const nuevo = construirDesdeFormulario();

  $.ajax({
    type: "POST",
    url: `${URL_API}/crearAdministrador`,
    data: JSON.stringify(nuevo),
    contentType: "application/json",
    success: function () {
      alert("✅ Administrador registrado");
      localStorage.removeItem("adminEditar");
      window.location.href = "Empleados.html";
    },
    error: function (xhr) {
      alert("❌ Error al registrar: " + xhr.responseText);
    },
  });
}

// function actualizarAdministrador() {
//   const admin = construirDesdeFormulario();

//   $.ajax({
//     type: "PUT",
//     url: `${URL_API}/actualizarAdministrador/${admin.idIdUsuario}`,
//     data: JSON.stringify(admin),
//     contentType: "application/json",
//     success: function () {
//       alert("✅ Administrador actualizado");
//       localStorage.removeItem("adminEditar");
//       window.location.href = "Empleados.html";
//     },
//     error: function (xhr) {
//       alert("❌ Error al actualizar: " + xhr.responseText);
//     },
//   });
// }

//EDITAR ADMINISTRADOR

if (ruta.includes("EditarAdministrador.html")) {
  $(document).ready(function () {
    const adminEditar = JSON.parse(localStorage.getItem("adminEditar"));
    if (adminEditar) {
      // Mostrar en consola para confirmar qué trae
      console.log("🟢 Objeto cargado desde localStorage:", adminEditar);

      // Adapta a ambas estructuras posibles
      $("#idadmin").val(adminEditar.idIdUsuario || adminEditar.id || "");
      $("#nombre").val(adminEditar.Nombre || adminEditar.nombre || "");
      $("#email").val(adminEditar.Email || adminEditar.email || "");
      $("#clave").val(adminEditar.Clave || adminEditar.clave || "");
      $("#telefono").val(adminEditar.Telefono || adminEditar.telefono || "");
      $("#formacionAcademica").val(
        adminEditar.FormacionAcademica || adminEditar.formacionAcademica || ""
      );
    }

    $("#formEditarAdministrador").submit(function (e) {
      e.preventDefault();
      actualizarAdministrador();
    });

    $("#btnVolver").click(function () {
      localStorage.removeItem("adminEditar");
      window.location.href = "Empleados.html";
    });
  });
}

function actualizarAdministrador() {
  const id = $("#idadmin").val();

  const actualizado = {
    idIdUsuario: parseInt(id),
    Nombre: $("#nombre").val(),
    Email: $("#email").val(),
    Clave: $("#clave").val(),
    Telefono: parseInt($("#telefono").val()),
    Rol: "Admin",
    FormacionAcademica: $("#formacionAcademica").val(),
  };

  $.ajax({
    type: "PUT",
    url: `${URL_API}/actualizarAdministrador/${id}`,
    data: JSON.stringify(actualizado),
    contentType: "application/json",
    success: function () {
      alert("✅ Administrador actualizado correctamente");
      localStorage.removeItem("adminEditar");
      window.location.href = "Empleados.html";
    },
    error: function (xhr) {
      alert("❌ Error al actualizar: " + xhr.responseText);
    },
  });
}

window.eliminarAdministrador = function (id) {
  if (!confirm("¿Deseas eliminar este administrador?")) return;

  $.ajax({
    type: "DELETE",
    url: `${URL_API}/eliminarAdministrador/${id}`,
    success: function () {
      alert("🗑️ Administrador eliminado");
      obtenerAdministradores();
    },
    error: function (xhr) {
      alert("❌ Error al eliminar: " + xhr.responseText);
    },
  });
};

window.editarAdministrador = function (admin) {
  localStorage.setItem("adminEditar", JSON.stringify(admin));
  window.location.href = "EditarAdministrador.html";
};

function construirDesdeFormulario() {
  return new AdministradorModel(
    $("#idadmin").val() ? parseInt($("#idadmin").val()) : 0,
    $("#nombre").val(),
    $("#email").val(),
    $("#clave").val(),
    "Admin",
    parseInt($("#telefono").val()),
    $("#formacionAcademica").val()
  );
}
