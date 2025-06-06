// ===============================
// 🔗 APIs
// ===============================

const API_CLIENTE = "https://localhost:7086/api/Cliente";
const API_PADECIMIENTO_CLIENTE =
  "https://localhost:7086/api/AsignarPadecimientos";
const API_PADECIMIENTO_GENERAL = "https://localhost:7086/api/Padecimiento";
const API_EJERCICIOS = "https://localhost:7086/api/Ejercicio";
const API_RUTINA = "https://localhost:7086/api/Rutina";
const API_IA_EJERCICIOS = "https://localhost:7086/api/IAEjercicios";

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

    const $lista = $("#listaResultados");
    $lista.empty();
    filtrados.forEach((c) => {
      $lista.append(
        `<li data-id="${c.IdUsuario}">${c.Nombre} - ${c.Email}</li>`
      );
    });

    $lista.find("li").on("click", function () {
      const id = $(this).data("id");
      const nombre = $(this).text();
      clienteSeleccionado = id;
      $("#nombreCliente").text(nombre);
      $("#rutinaGenerada").show();
      $("#infoCliente").show();
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
    $("#clienteEntrenador").text(cliente.Entrenador?.Nombre || "-");

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
// 📋 GENERAR RUTINA (NUEVO con IA + AGRUPADO)
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
    success: function (response) {
      console.log("Respuesta IA:", response);

      rutinaSugerida = response.ejerciciosRecomendados;

      if (
        rutinaSugerida.length === 0 ||
        (rutinaSugerida.length === 1 &&
          rutinaSugerida[0] === "Ningún ejercicio es apto para este cliente")
      ) {
        alert("⚠️ Ningún ejercicio es apto para este cliente.");
        rutinaSugerida = [];
      }

      // 🚀 AQUI USAMOS LA TABLA:
      mostrarTablaRutina();

      // (si no quieres usar más el accordion, puedes comentar esta línea)
      // mostrarRutinaAgrupada();
    },
    error: function (xhr, status, error) {
      console.error(
        "Error recomendando ejercicios:",
        xhr.status,
        xhr.responseText
      );
      alert(
        `❌ Error al recomendar los ejercicios.\nStatus: ${xhr.status}\nMensaje: ${xhr.responseText}`
      );
    },
  });
}

function mostrarTablaRutina() {
  const $tbody = $("#tablaRutina tbody");
  $tbody.empty();

  if (!rutinaSugerida || rutinaSugerida.length === 0) {
    $tbody.append(`
      <tr>
        <td colspan="8" class="text-center text-muted">
          No hay ejercicios en la rutina actual.
        </td>
      </tr>
    `);
    return;
  }

  rutinaSugerida.forEach((ej, index) => {
    $tbody.append(`
      <tr>
        <td>${escapeHtml(ej.Nombre)}</td>
        <td>${escapeHtml(ej.Descripcion)}</td>
        <td>${escapeHtml(ej.AreaMuscular)}</td>
        <td>${escapeHtml(ej.Dificultad)}</td>
        <td>${escapeHtml(ej.AreaAfectada)}</td>
        <td>
          <input type="number" class="form-control reps-input" value="12" min="1" data-index="${index}">
        </td>
        <td>
          <input type="text" class="form-control comentario-input" placeholder="Comentario opcional" data-index="${index}">
        </td>
        <td class="text-center">
          <button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${index})">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </td>
      </tr>
    `);
  });
}

// ===============================
// 🛡️ ESCAPAR HTML
// ===============================

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// 🗑️ ELIMINAR EJERCICIO
// ===============================

function eliminarEjercicio(index) {
  if (index >= 0 && index < rutinaSugerida.length) {
    rutinaSugerida.splice(index, 1);
    mostrarRutinaAgrupada();
  }
}

// ===============================
// 💾 GUARDAR RUTINA
// ===============================

$("#guardarRutina").on("click", function () {
  if (!clienteSeleccionado || !rutinaSugerida || rutinaSugerida.length === 0) {
    alert(
      "Selecciona un cliente y asegúrate de que la rutina tenga ejercicios."
    );
    return;
  }

  const ejercicios = rutinaSugerida.map((ej, i) => {
    const $inputs = $(`[data-index="${i}"]`);
    const repeticiones = parseInt($inputs.filter(".reps-input").val()) || 0;
    const comentarioInput = $inputs.filter(".comentario-input").val();
    const comentario = comentarioInput ? comentarioInput.trim() : "";

    return {
      IdEjercicio: ej.IdEjercicio,
      Comentario: comentario,
      NombreEjercicio: ej.Nombre,
      DescripcionEjercicio: ej.Descripcion,
      AreaMuscular: ej.AreaMuscular,
      AreaMuscularAfectada: ej.AreaAfectada,
      Repeticiones: repeticiones,
      GuiaEjercicio: ej.GuiaEjercicio,
      Dificultad: ej.Dificultad,
    };
  });

  const dto = {
    FechaInicio: new Date().toISOString(),
    FechaFin: new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    ).toISOString(),
    IdCliente: clienteSeleccionado,
    Ejercicios: ejercicios,
  };

  console.log("DTO a enviar:", dto);

  $.ajax({
    url: `${API_RUTINA}/crearRutinaCompleta`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(dto),
    success: () => alert("✅ Rutina guardada correctamente"),
    error: () => alert("❌ Error al guardar rutina"),
  });
});

// ===============================
// 📋 MOSTRAR RUTINA AGRUPADA (PRO)
// ===============================

function mostrarRutinaAgrupada() {
  const $accordion = $("#accordionRutinaAgrupada");
  $accordion.empty();

  if (!rutinaSugerida || rutinaSugerida.length === 0) {
    $accordion.append(`
      <div class="text-center text-muted mb-3">
        No hay ejercicios en la rutina actual.
      </div>
    `);
    return;
  }

  const grupos = {};

  rutinaSugerida.forEach((ej, index) => {
    const area = ej.AreaMuscular || "Sin área";
    if (!grupos[area]) grupos[area] = [];
    grupos[area].push({ ...ej, index });
  });

  let idx = 0;
  for (const area in grupos) {
    idx++;
    const ejercicios = grupos[area];

    const itemsHtml = ejercicios
      .map(
        (ej) => `
      <li class="mb-1">
        <strong>${escapeHtml(ej.Nombre)}</strong> - ${escapeHtml(
          ej.Descripcion
        )} <br>
        <small>Dificultad: ${escapeHtml(ej.Dificultad)} | Reps: 
          <input type="number" class="reps-input" value="12" min="1" data-index="${
            ej.index
          }"> 
          | Comentario: 
          <input type="text" class="comentario-input" placeholder="Opcional" data-index="${
            ej.index
          }">
        </small>
        <br>
        <button class="btn btn-sm btn-danger mt-1" onclick="eliminarEjercicio(${
          ej.index
        })">Eliminar</button>
      </li>
    `
      )
      .join("");

    $accordion.append(`
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${idx}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${idx}" aria-expanded="false" aria-controls="collapse${idx}">
            ${area.toUpperCase()} (${ejercicios.length} ejercicios)
          </button>
        </h2>
        <div id="collapse${idx}" class="accordion-collapse collapse" aria-labelledby="heading${idx}" data-bs-parent="#accordionRutinaAgrupada">
          <div class="accordion-body">
            <ul style="padding-left: 1rem;">
              ${itemsHtml}
            </ul>
          </div>
        </div>
      </div>
    `);
  }
}

