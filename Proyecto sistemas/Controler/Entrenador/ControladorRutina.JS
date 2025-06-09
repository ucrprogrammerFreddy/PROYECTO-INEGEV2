// ===============================
// 🔗 APIs
// ===============================
const API_BASE = "http://mi-api-powergym-2025.somee.com/api";

const API_CLIENTE = `${API_BASE}/Cliente`;
const API_PADECIMIENTO_CLIENTE = `${API_BASE}/AsignarPadecimientos`;
const API_PADECIMIENTO_GENERAL = `${API_BASE}/Padecimiento`;
const API_EJERCICIOS = `${API_BASE}/Ejercicio`;
const API_RUTINA = `${API_BASE}/Rutina`;
const API_IA_EJERCICIOS = `${API_BASE}/IAEjercicios`;
const API_EJERCICIO_RUTINA = `${API_BASE}/EjercicioRutina`;

// ===============================
// 🔄 Variables globales
// ===============================
let clienteSeleccionado = null;
let rutinaSugerida = [];
let rutinaYaGenerada = false;

window.listaPadecimientos = [];

// ===============================
// 🔄 Cargar lista global de padecimientos
// ===============================
$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, (data) => {
  window.listaPadecimientos = data;
});

// ===============================
// 🎯 FOCUS → cargar todos los clientes
// ===============================
$("#clienteBuscador").on("focus", function () {
  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const $lista = $("#listaResultados").empty();

    clientes.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} – ${c.Email}</li>`
      );
    });

    $lista.find("li").on("click", function () {
      seleccionarCliente($(this));
    });
  });
});

// 🔍 INPUT → filtrar clientes
$("#clienteBuscador").on("input", function () {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) {
    $("#listaResultados").empty();
    return;
  }

  $.get(`${API_CLIENTE}/listaClientes`, (clientes) => {
    const filtrados = clientes.filter(
      (c) =>
        c.Nombre.toLowerCase().includes(texto) ||
        c.Email.toLowerCase().includes(texto)
    );

    const $lista = $("#listaResultados").empty();

    filtrados.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} – ${c.Email}</li>`
      );
    });

    $lista.find("li").on("click", function () {
      seleccionarCliente($(this));
    });
  });
});

// 🚀 BLUR → al salir del campo, ocultar lista
$("#clienteBuscador").on("blur", function () {
  setTimeout(() => {
    $("#listaResultados").empty();
  }, 200);
});

// ===============================
// ✅ Seleccionar cliente
// ===============================
function seleccionarCliente($li) {
  const id = $li.data("id");
  const nombre = $li.text();
  clienteSeleccionado = parseInt(id);

  $("#nombreCliente").text(nombre);
  $("#infoCliente").show();
  $("#botonGenerarRutinaContainer").show();

  // 🚀 Limpiar rutina anterior
  resetUI();

  cargarInfoCliente(id);

  $("#listaResultados").empty();
  $("#clienteBuscador").val("");
}

// ===============================
// 📋 CARGAR INFO CLIENTE
// ===============================
function cargarInfoCliente(clienteId) {
  $.get(`${API_CLIENTE}/obtenerClientePorId/${clienteId}`, (cliente) => {
    $("#clienteNombre").text(cliente.Nombre);
    $("#clientePeso").text(cliente.Peso + " kg");
    $("#clienteAltura").text(cliente.Altura + " cm");
    $("#clienteEntrenador").text(cliente.NombreEntrenador || "-");

    $.get(
      `${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`,
      (padecimientos) => {
        const lista = padecimientos
          .map((p) => {
            const nombre =
              (
                window.listaPadecimientos.find(
                  (x) => Number(x.IdPadecimiento) === Number(p.IdPadecimiento)
                ) || {}
              ).Nombre || `ID ${p.IdPadecimiento}`;
            return `${nombre} (${p.Severidad})`;
          })
          .join(", ");
        $("#clientePadecimientos").text(lista || "-");
      }
    );
  });
}

// ===============================
// 🚀 BOTÓN GENERAR RUTINA
// ===============================
$("#btnGenerarRutina").on("click", function () {
  if (!clienteSeleccionado) {
    alert("Primero selecciona un cliente.");
    return;
  }

  if (rutinaYaGenerada) {
    alert(
      "⚠️ Ya has generado una rutina para este cliente. Guarda la rutina o busca otro cliente para generar otra."
    );
    return;
  }

  // 🚀 Bloquear botón
  $("#btnGenerarRutina").prop("disabled", true).text("Generando...");

  generarRutina(clienteSeleccionado);
});

// ===============================
// 📃 GENERAR RUTINA (IA)
// ===============================
function generarRutina(clienteId) {
  console.log("Generando rutina con IA para clienteId:", clienteId);

  const nombreCliente = $("#nombreCliente").text();

  $.ajax({
    url: `${API_IA_EJERCICIOS}/recomendar`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      IdCliente: clienteId,
      NombreCliente: nombreCliente,
    }),
    success(response) {
      console.log("Respuesta IA:", response);
      console.log("Ejercicios recomendados:", response.ejerciciosRecomendados);

      rutinaSugerida = response.ejerciciosRecomendados || [];

      if (
        !rutinaSugerida.length ||
        (rutinaSugerida.length === 1 &&
          rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente")
      ) {
        alert("⚠️ Ningún ejercicio es apto para este cliente.");
        rutinaSugerida = [];
        $("#btnGenerarRutina")
          .prop("disabled", false)
          .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
      } else {
        rutinaYaGenerada = true;
        $("#rutinaGenerada").show();
        mostrarTablaRutina();
      }
    },
    error(xhr) {
      console.error(
        "Error recomendando ejercicios:",
        xhr.status,
        xhr.responseText
      );
      alert(`❌ Error al recomendar ejercicios.\nStatus: ${xhr.status}`);

      // Reactivar botón
      $("#btnGenerarRutina")
        .prop("disabled", false)
        .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
    },
  });
}

// ===============================
// 📃 MOSTRAR TABLA
// ===============================
function mostrarTablaRutina() {
  const $tbody = $("#tablaRutina tbody").empty();
  if (!rutinaSugerida.length) {
    $tbody.append(`
      <tr>
        <td colspan="9" class="text-center text-muted">
          No hay ejercicios en la rutina actual.
        </td>
      </tr>
    `);
    return;
  }

  rutinaSugerida.forEach((ej, index) => {
    const guia = ej.GuiaEjercicio
      ? `<a href="${escapeHtml(ej.GuiaEjercicio)}" target="_blank">Ver Guía</a>`
      : "Sin guía";

    $tbody.append(`
      <tr>
        <td>${escapeHtml(ej.Nombre)}</td>
        <td>${escapeHtml(ej.Descripcion)}</td>
        <td>${escapeHtml(ej.AreaMuscular)}</td>
        <td>${escapeHtml(ej.Dificultad)}</td>
        <td>${escapeHtml(ej.AreaAfectada)}</td>
        <td><input type="number" class="form-control reps-input" value="${
          ej.Repeticiones || 12
        }" min="1" data-index="${index}"></td>
        <td>${guia}</td>
        <td><input type="text" class="form-control comentario-input" placeholder="Comentario opcional" data-index="${index}"></td>
        <td class="text-center"><button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${index})"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
      </tr>
    `);
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function eliminarEjercicio(index) {
  rutinaSugerida.splice(index, 1);
  mostrarTablaRutina();
}

// ===============================
// 🔄 FUNCIÓN resetUI → limpia rutina
// ===============================
function resetUI() {
  rutinaSugerida = [];
  rutinaYaGenerada = false;
  $("#tablaRutina tbody").empty();
  $("#rutinaGenerada").hide();
  $("#btnGenerarRutina")
    .prop("disabled", false)
    .html('<i class="fas fa-dumbbell"></i> Generar Rutina');
}
