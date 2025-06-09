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
//const API_CLIENTE = "https://localhost:7086/api/Cliente";
//const API_PADECIMIENTO_CLIENTE =
//  "https://localhost:7086/api/AsignarPadecimientos";
//const API_PADECIMIENTO_GENERAL = "https://localhost:7086/api/Padecimiento";
//const API_EJERCICIOS = "https://localhost:7086/api/Ejercicio";
//const API_RUTINA = "https://localhost:7086/api/Rutina";
//c//onst API_IA_EJERCICIOS = "https://localhost:7086/api/IAEjercicios";

let clienteSeleccionado = null;
let rutinaSugerida = [];

window.listaPadecimientos = [];

// ===============================
// 🔄 Cargar lista global de padecimientos
// ===============================
$.get(`${API_PADECIMIENTO_GENERAL}/listaPadecimientos`, (data) => {
  window.listaPadecimientos = data;
});

// ===============================
// 🔍 BUSCAR CLIENTES
// ===============================
$("#clienteBuscador").on("input", function () {
  const texto = $(this).val().toLowerCase();
  if (texto.length < 2) return;

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
      const id = $(this).data("id");
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
      rutinaSugerida = response.ejerciciosRecomendados || [];

      if (
        !rutinaSugerida.length ||
        (rutinaSugerida.length === 1 &&
          rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente")
      ) {
        alert("⚠️ Ningún ejercicio es apto para este cliente.");
        rutinaSugerida = [];
      }

      mostrarTablaRutina();
    },
    error(xhr) {
      console.error(
        "Error recomendando ejercicios:",
        xhr.status,
        xhr.responseText
      );
      alert(`❌ Error al recomendar ejercicios.\nStatus: ${xhr.status}`);
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
// 📅 GUARDAR RUTINA (crear rutina + ejercicios optimizado)
// ===============================
// ===============================
// 📅 GUARDAR RUTINA (crear rutina + ejercicios optimizado)
// ===============================
// ===============================
// 📅 GUARDAR RUTINA (crear rutina + ejercicios optimizado)
// ===============================
$("#guardarRutina").on("click", async function () {
  if (!clienteSeleccionado || !rutinaSugerida.length) {
    alert(
      "Selecciona un cliente y asegúrate de que la rutina tenga ejercicios."
    );
    return;
  }

  const dtoRutina = {
    FechaInicio: new Date().toISOString(),
    FechaFin: new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    ).toISOString(),
    IdCliente: parseInt(clienteSeleccionado),
    Ejercicios: [], // Los ejercicios se agregarán en solicitudes separadas
  };

  console.log("Creando rutina:", dtoRutina);

  try {
    // --- Crear la rutina principal ---
    const responseRutina = await fetch(`${API_RUTINA}/crearRutina`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dtoRutina),
    });

    if (!responseRutina.ok) {
      const errorText = await responseRutina.text();
      throw new Error(
        `Error al crear la rutina: ${responseRutina.status} - ${errorText}`
      );
    }

    const rutinaCreada = await responseRutina.json();
    const idRutina = rutinaCreada.IdRutina || rutinaCreada.idRutina;
    console.log("✅ Rutina creada con ID:", idRutina);

    // --- Agregar ejercicios a la rutina ---
    let erroresEjercicios = 0;
    const promesasEjercicios = [];

    for (const [idx, ej] of rutinaSugerida.entries()) {
      const reps = parseInt($(`[data-index="${idx}"].reps-input`).val()) || 0;
      const comentario =
        $(`[data-index="${idx}"].comentario-input`).val() || "";

      if (!ej.IdEjercicio) {
        console.warn("❌ El ejercicio no tiene IdEjercicio:", ej);
        erroresEjercicios++;
        continue;
      }

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
        Dificultad: ej.Dificultad,
      };

      const promesa = fetch(`${API_EJERCICIO_RUTINA}/agregarEjercicioRutina`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dtoEj),
      })
        .then((responseEj) => {
          if (!responseEj.ok) {
            erroresEjercicios++;
            console.error(
              `❌ Error al guardar ejercicio ${ej.Nombre}: ${responseEj.status}`
            );
          }
          return responseEj;
        })
        .catch((err) => {
          erroresEjercicios++;
          console.error(
            `❌ Error de red al guardar ejercicio ${ej.Nombre}:`,
            err
          );
        });

      promesasEjercicios.push(promesa);
    }

    // Esperar a que todas las promesas de ejercicios se resuelvan
    await Promise.allSettled(promesasEjercicios);

    // --- Notificación final al usuario ---
    if (erroresEjercicios === 0) {
      alert("✅ Rutina y ejercicios guardados correctamente.");
    } else {
      alert(
        `⚠️ Rutina creada, pero fallaron ${erroresEjercicios} ejercicios al guardarse.`
      );
    }

    // 🚀 LIMPIAR LA PÁGINA DESPUÉS DE GUARDAR
    rutinaSugerida = [];
    clienteSeleccionado = null;

    $("#tablaRutina tbody").empty();
    $("#nombreCliente").text("");
    $("#clienteNombre").text("");
    $("#clientePeso").text("");
    $("#clienteAltura").text("");
    $("#clienteEntrenador").text("");
    $("#clientePadecimientos").text("");

    $("#rutinaGenerada, #infoCliente").hide();
    $("#clienteBuscador").val("");

    console.log("🚀 Página limpiada correctamente.");
  } catch (error) {
    console.error("❌ Error general al procesar la rutina:", error);
    alert(`❌ Error al crear la rutina: ${error.message}`);
  }
});
