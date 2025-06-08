// ===============================
// 🔗 APIs
// ===============================
const API_CLIENTE               = "https://localhost:7086/api/Cliente";
const API_PADECIMIENTO_CLIENTE  = "https://localhost:7086/api/AsignarPadecimientos";
const API_PADECIMIENTO_GENERAL  = "https://localhost:7086/api/Padecimiento";
const API_EJERCICIOS            = "https://localhost:7086/api/Ejercicio";
const API_RUTINA                = "https://localhost:7086/api/Rutina";
const API_IA_EJERCICIOS         = "https://localhost:7086/api/IAEjercicios";
const API_EJERCICIO_RUTINA      = "https://localhost:7086/api/EjercicioRutina";

let clienteSeleccionado = null;
let rutinaSugerida      = [];

window.listaPadecimientos = [];

// ===============================
// 🔄 Cargar lista global de padecimientos
// ===============================
$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, data => {
  window.listaPadecimientos = data;
});

// ===============================
// 🔍 BUSCAR CLIENTES
// ===============================
$("#clienteBuscador").on("input", function() {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) return;

  $.get(`${API_CLIENTE}/listaClientes`, clientes => {
    const filtrados = clientes.filter(c =>
      c.Nombre.toLowerCase().includes(texto) ||
      c.Email.toLowerCase().includes(texto)
    );

    const $lista = $("#listaResultados").empty();
    filtrados.forEach(c => {
      $lista.append(`<li data-id="${c.IdUsuario}">${c.Nombre} – ${c.Email}</li>`);
    });

    $lista.find("li").on("click", function() {
      const id     = $(this).data("id");
      const nombre = $(this).text();
      clienteSeleccionado = parseInt(id);
      $("#nombreCliente").text(nombre);
      $("#rutinaGenerada, #infoCliente").show();
      cargarInfoCliente(id);
      generarRutina(id);
      $lista.empty();
      $("#clienteBuscador").val("");
    });
  });
});

// ===============================
// 📋 CARGAR INFO CLIENTE
// ===============================
function cargarInfoCliente(clienteId) {
  $.get(`${API_CLIENTE}/obtenerClientePorId/${clienteId}`, cliente => {
    $("#clienteNombre").text(cliente.Nombre);
    $("#clientePeso").text(cliente.Peso + " kg");
    $("#clienteAltura").text(cliente.Altura + " cm");
    $("#clienteEntrenador").text(cliente.NombreEntrenador || "-");

    $.get(`${API_PADECIMIENTO_CLIENTE}/obtenerPadecimientos/${clienteId}`, padecimientos => {
      const lista = padecimientos
        .map(p => {
          const nombre = (window.listaPadecimientos.find(
            x => Number(x.IdPadecimiento) === Number(p.IdPadecimiento)
          ) || {}).Nombre || `ID ${p.IdPadecimiento}`;
          return `${nombre} (${p.Severidad})`;
        })
        .join(", ");
      $("#clientePadecimientos").text(lista || "-");
    });
  });
}

// ===============================
// 📃 GENERAR RUTINA (IA)
// ===============================
function generarRutina(clienteId) {
  console.log("Generando rutina con IA para clienteId:", clienteId);
  const nombreCliente = $("#nombreCliente").text();

  $.ajax({
    url:    `${API_IA_EJERCICIOS}/recomendar`,
    method: "POST",
    contentType: "application/json",

data: JSON.stringify({
  IdCliente: clienteId,
  NombreCliente: nombreCliente
}),
    success(response) {
      console.log("Respuesta IA:", response);
      rutinaSugerida = response.ejerciciosRecomendados || [];

      if (!rutinaSugerida.length ||
          (rutinaSugerida.length === 1 && rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente")) {
        alert("⚠️ Ningún ejercicio es apto para este cliente.");
        rutinaSugerida = [];
      }

      mostrarTablaRutina();
    },
    error(xhr) {
      console.error("Error recomendando ejercicios:", xhr.status, xhr.responseText);
      alert(`❌ Error al recomendar ejercicios.\nStatus: ${xhr.status}`);
    }
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
    const guia = ej.GuiaEjercicio ? `<a href="${escapeHtml(ej.GuiaEjercicio)}" target="_blank">Ver Guía</a>` : "Sin guía";

    $tbody.append(`
      <tr>
        <td>${escapeHtml(ej.Nombre)}</td>
        <td>${escapeHtml(ej.Descripcion)}</td>
        <td>${escapeHtml(ej.AreaMuscular)}</td>
        <td>${escapeHtml(ej.Dificultad)}</td>
        <td>${escapeHtml(ej.AreaAfectada)}</td>
        <td><input type="number" class="form-control reps-input" value="${ej.Repeticiones || 12}" min="1" data-index="${index}"></td>
        <td>${guia}</td>
        <td><input type="text" class="form-control comentario-input" placeholder="Comentario opcional" data-index="${index}"></td>
        <td class="text-center"><button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${index})"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
      </tr>
    `);
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function eliminarEjercicio(index) {
  rutinaSugerida.splice(index, 1);
  mostrarTablaRutina();
}

// ===============================
// 📅 GUARDAR RUTINA (crear rutina + ejercicios)
// ===============================
$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || !rutinaSugerida.length) {
    alert("Selecciona un cliente y asegúrate de que la rutina tenga ejercicios.");
    return;
  }

const dtoRutina = {

  FechaInicio: new Date().toISOString(),
  FechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
  ClienteIdUsuario: parseInt(clienteSeleccionado),
  Ejercicios: []
};


  console.log("Creando rutina:", dtoRutina);

  $.ajax({
    url: `${API_RUTINA}/crearRutina`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dtoRutina),
    success: function (rutinaCreada) {
      const idRutina = rutinaCreada.IdRutina || rutinaCreada.idRutina;
      console.log("✅ Rutina creada con ID:", idRutina);

      let errores = 0;

      rutinaSugerida.forEach((ej, idx) => {
        const reps = parseInt($(`[data-index="${idx}"].reps-input`).val()) || 0;
        const comentario = $(`[data-index="${idx}"].comentario-input`).val() || "";

        const dtoEj = {
          IdRutina: idRutina,
          IdEjercicio: ej.IdEjercicio,
          Comentario: comentario,
          NombreEjercicio: ej.Nombre,
          DescripcionEjercicio: ej.Descripcion,
          AreaMuscular: ej.AreaMuscular,
          AreaMuscularAfectada: ej.AreaAfectada,
          Repeticiones: reps,
          GuiaEjercicio: ej.GuiaEjercicio,
          Dificultad: ej.Dificultad
        };

        if (!ej.IdEjercicio) {
  console.warn("❌ El ejercicio no tiene IdEjercicio:", ej);
  errores++;
  return;
}



        $.ajax({
          url: `${API_EJERCICIO_RUTINA}/agregarEjercicioRutina`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(dtoEj),
          error: () => errores++
        });
      });

      setTimeout(() => {
        if (errores === 0) {
          alert("✅ Rutina y ejercicios guardados correctamente.");
        } else {
          alert(`⚠️ Rutina creada, pero fallaron ${errores} ejercicios.`);
        }
      }, 500);
    },
    error: function (xhr) {
      console.error("❌ Error creando rutina:", xhr.status, xhr.responseText);
      alert(`❌ Error al crear la rutina (status ${xhr.status}).`);
    }
  });
});
